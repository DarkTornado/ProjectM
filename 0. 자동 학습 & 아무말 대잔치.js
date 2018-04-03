/*
Project - M
카카오톡 봇 - 자동 학습 & 아무말 대잔치
© 2018 Dark Tornado, All rights reserved.

<작동 방식>
1. 채팅방에서 사람들이 하는 채팅을 '내장메모리/AI/' 폴더에 '방이름.txt' 파일로 저장.
  -> 각 채팅들은 엔터로 구분합니다. 따라서, 엔터가 포함된 채팅은 저장하지 않습니다.
  -> 학습(?) 및 아무말 전송은 채팅방마다 따로따로 작동합니다.
2. 해당 채팅방에서 채팅이 수신되면 10% 확률로 파일 안에 있는 채팅들 중 하나를 채팅방으로 전송.
  -> 배운게 없으면 전송 안함
  -> 소스 주인(?) 만든 다른 대화 기능이 있는 녀석(?)들과는 다른, 완전한 랜덤이라 아무말 대잔치입니다?

<가이드라인>

개발자의 허락 없이 소스 코드 무단 배포 금지. 들키면, 싸대기 퍽퍽.
소스 사용시 원작자를 밝혀주세요.
 ex) 이 봇은 Dark Tornado의 아무말 대잔치 소스를 사용하였습니다.

<라이선스>

이 소스에는 아파치 라이선스 2.0이 적용되어있습니다.

Copyright 2018 Dark Tornado

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/*상수 선언. 변수여도 상관 X*/
const sdcard = android.os.Environment.getExternalStorageDirectory().getAbsolutePath(); //내장메모리 상위 경로 가져오기. 상수인데 소문자인건 기분탓.

const AI = {}; //AI 관련 함수들이 들어갈 객체
const DB = {}; //저장 및 읽기 관련 함수들이 들어갈 객체. 파일 입/출력인데, DB라고 쓴건 기분탓.
const preMsg = {}; //도배 방지용 객체

/*AI 객체에 포함된 함수들 정의*/
AI.say = function(msg, replier) { //채팅 전송 관련 함수
    replier.reply("[Bot] " + msg); //앞에다가 봇 이름 같은거 붙여서 전송
};
AI.getRandomChat = function(room) { //저장된 채팅들 중 아무말 하나 가져오는 함수
    var data = DB.readData(room); //해당 채팅방에서 수신된 메시지들을 읽어옴
    if (data == null) return null; //수신된게 없으면 null 반환
    data = data.split("\n"); //파일 내용을 엔터 단위로 잘라서, 배열로 변환
    var r = Math.floor(Math.random() * data.length); //0~배열길이-1 사이의 난수 생성
    return data[r]; //배열에 있는 채팅들 중 아무거나 하나 반환
};
AI.isValidData = function(data) { //이 말이 배울 말인지 아닌지를 구분하는 함수
    var noSave = ["사진", "동영상", "음성메시지", "(이모티콘)", "카카오톡 프로필"]; //사진, 동영상 등을 보내는 경우에도
    for (var n = 0; n < noSave.length; n++) { //배우지 않도록 예외처리.
        if (data == noSave[n]) return false;
    }
    noSave = ["\n", "", "/"]; //이 배열에 들어있는 내용이 포함된 채팅은 배우지 않음. 비속어 필터링 등도 여기에다가 넣으면 됨
    for (var n = 0; n < noSave.length; n++) { //배열의 길이만큼 반복
        if (noSave[n].indexOf(data) != -1) return false; //배열의 요소들 중 포함되는게 하나라도 있다면, false 반환
    }
    return true; //아니면 true 반환
};
AI.study = function(room, msg) { //수신된 채팅을 저장하는 함수
    var data = DB.readData(room); //이미 저장된 내용을 불러옴
    if (data == null) { //이미 저장된게 없다면
        DB.saveData(room, msg); //새로 저장
    } else { //이미 저장된게 있다면,
        DB.saveData(room, data + "\n" + msg); //기존에 있던 내용 뒤에 엔터와 함께 붙임.
    }
};

/*DB 객체에 포함된 함수들 정의*/
DB.createDir = function() { //채팅이 저장될 폴더를 생성하는 함수
    var folder = new java.io.File(sdcard + "/AI/"); //파일 인스턴스 생성
    folder.mkdirs(); //폴더 생성. 상위 폴더가 없으면, 상위 폴더도 생성.
};
DB.saveData = function(name, msg) { //파일에 내용을 저장하는 함수
    try { //사실, 나도 어디서 긁어와서 이곳저곳에서 사용하는 거임
        var file = new java.io.File(sdcard + "/AI/" + name + ".txt");
        var fos = new java.io.FileOutputStream(file);
        var str = new java.lang.String(msg);
        fos.write(str.getBytes());
        fos.close();
    } catch (e) {
        Log.debug(e + " At:" + e.lineNumber);
    }
};
DB.readData = function(name) { //파일에 저장된 내용을 불러오는 함수
    try { //사실, 나도 어디서 긁어와서 이곳저곳에서 사용하는 거임
        var file = new java.io.File(sdcard + "/AI/" + name + ".txt");
        if (!file.exists()) return null; //파일이 없으면 null 반환
        var fis = new java.io.FileInputStream(file);
        var isr = new java.io.InputStreamReader(fis);
        var br = new java.io.BufferedReader(isr);
        var str = br.readLine();
        var line = "";
        while ((line = br.readLine()) != null) {
            str += "\n" + line;
        }
        fis.close();
        isr.close();
        br.close();
        return str;
    } catch (e) {
        Log.debug(e + " At:" + e.lineNumber);
    }
};

/*전역에서 실행할 것들*/
DB.createDir(); //폴더 생성

function response(room, msg, sender, isGroupChat, replier, ImageDB) {
    msg = msg.trim(); //이거 왜있는지 모르면 골롬
    room = room.trim();
    sender = sender.trim();
if(room!="0TestRoom") return;
    /*도배 방지*/
    if (preMsg[room] == msg) { //채팅 내용이랑 직전에 수신된 채팅 내용이 같으면,
        return; //도배로 간주하고 response 함수 종료
    }
    preMsg[room] = msg; //수신된 채팅 내용 저장

    /*채팅 학습*/
    if (AI.isValidData(msg)) { //배울 채팅이 수신된다면,
        AI.study(room, msg); //배움
    }

    /*학습된 채팅 내용들 중 아무너가 하나 전송*/
    var r = Math.floor(Math.random() * 10); //0~9 중 아무 숫자나 생성
    if (r == 0) { //그 숫가자 0이라면(1/10 확률)
        var chat = AI.getRandomChat(room); //해당 방에서 수신된 채팅들 중 아무 채팅이나 하나 불러옴
        if (chat != null) AI.say(chat, replier); //수신된 채팅이 있다면, 불러온 아무말 전송
        Log.info("[아무말 대잔치 실행됨\n[" + sender + "] " + msg + "\n[봇] " + chat); //로그 저장
    }
}

