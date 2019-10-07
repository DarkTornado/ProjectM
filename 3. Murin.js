/*
Project - M
3rd Open Source : Murin
© 2018-2019 Dark Tornado, All rights reserved.

<작동 방식>
1. 채팅방에서 사람들이 하는 채팅을 '내장메모리/Murin/' 폴더에 '방이름.txt' 파일로 저장.
  -> 각 채팅들은 엔터로 구분합니다. 따라서, 엔터가 포함된 채팅은 저장하지 않습니다.
  -> 학습 및 채팅 전송은 채팅방마다 따로따로 작동합니다.
2. 해당 채팅방에서 채팅이 수신되면 10% 확률로 수신된 채팅과 파일 안에 있는 채팅의 유사도를 대충 검사.
  -> 어절이 하나 이상 일치하면 유사하다고 봄.
3. 유사하다고 판단된 채팅들에 대한 답변을 채팅방으로 전송.
  -> 배운게 없으면 전송 안함

<가이드라인>

- 개발자의 허락 없이 소스 코드 무단 배포 금지. 들키면, 싸대기 퍽퍽.
- 소스 사용시 원작자를 밝혀주세요.
  ex) 이 봇은 Dark Tornado의 Project M - Murin 소스를 사용하였습니다.

<라이선스>

이 소스에는 LGPL 3.0이 적용되어있습니다.

one line to give the library's name and an idea of what it does.
Copyright (C) 2018  Dark Tornado

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA

*/


/*상수 선언*/
const sdcard = android.os.Environment.getExternalStorageDirectory().getAbsolutePath(); //내장메모리 최상위 경로

/*상수 (객체) 선언*/
const Murin = {}; //무린 관련 객체
const DB = {}; //파일 입/출력용 객제인데, 이름이 DB인건 기분탓
const preChat = {}; //도배 방지 구현용
const lastSender = {}; //보낸 사람 구분용

/*변수 선언*/
var botOff = false; //봇 작동여부 설정용

/*Murin 객체*/
Murin.checkWord = function(que, msg) { //적당히 비슷한 말인지 비교
    var data = msg.split(" "); //수신된 채팅의 어절들 중
    var count = 0;
    if (Math.floor(Math.random() * 2) == 0) count = 1;
    if (Math.floor(Math.random() * 5) == 0) count = 2;
    for (var n = 0; n < data.length; n++) { //3개 이상이 저장된 채팅들에 포함되어 있다면,
        if (que.indexOf(data[n]) != -1) {
            if (count == 2) return true; //대강 비슷하다고 판단
            else count++;
        }
    }
    return false; //아님 말고
};
Murin.getReply = function(room, msg) { //수신된 채팅에 대한 적당한 답변 반환
    var data = DB.readData(room); //저장된 채팅들을 불러옴
    if (data != null && Math.floor(Math.random() * 10) == 0) { //저장된 채팅이 없거나, 10% 확률이 터진게 아니면, 작동 안함
        data = data.split("\n"); //냥
        var result = []; //비슷한 말들이 들어갈 배열
        for (var n = 0; n < data.length - 1; n++) { //적당하다 싶은 녀석들을
            if (Murin.checkWord(data[n], msg)) result.push(data[n + 1]); //배열에 추가
        }
        if (result[0] != null) return result[Math.floor(Math.random() * result.length)]; //배열이 빈게 아니라면 아무거나 하나 반환
    }
    return null; //일치하는게 없거나, 저장된 채팅이 없거나, 발동할 확률(?)이 아니면, null 반환
};
Murin.say = function(msg, replier) { //그냥 말하는 함수
    replier.reply("[AI] " + msg); //앞에다가 이상한 문구 붙이는 용도
};
Murin.isValidData = function(msg) { //배울 만한 채팅인지 구분하는 함수
    var invalids = ["#", "/"];
    for (var n = 0; n < invalids.length; n++) {
        if (msg.charAt(0) == invalids[n]) return false; //특정 문자로 시작하는 것은 학습 X.	
    }
    var noStudy = ["\n", "//"]; //엔터가 포함된건 학습 X. 비속어 필터링 등도 여기다가 넣으면 이상한 말은 안배움
    for (var n = 0; n < noStudy.length; n++) {
        if (msg.indexOf(noStudy[n]) != -1) return false;
    }
    return true;
};

/*DB 객체*/
DB.createDir = function() { //배운 채팅들이 저장될 폴더를 만드는 함수
    var folder = new java.io.File(sdcard + "/Murin/"); //File 인스턴스 생성
    folder.mkdirs(); //폴더 생성
};
DB.saveData = function(name, msg) { //파일에 내용을 저장하는 함수
    try { //사실, 나도 어디서 긁어와서 이곳저곳에서 사용하는 거임
        var file = new java.io.File(sdcard + "/Murin/" + name + ".txt");
        var fos = new java.io.FileOutputStream(file);
        var str = new java.lang.String(msg);
        fos.write(str.getBytes());
        fos.close();
    } catch (e) {
        Log.debug(e + ", " + e.lineNumber);
    }
};
DB.readData = function(name) { //파일에 저장된 내용을 불러오는 함수
    try { //사실, 나도 어디서 긁어와서 이곳저곳에서 사용하는 거임
        var file = new java.io.File(sdcard + "/Murin/" + name + ".txt");
        if (!file.exists()) return null;
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
        Log.debug(e + ", " + e.lineNumber);
    }
};

/*전역에서 실행할 것들*/
DB.createDir(); //폴더 생성

/*response 부분*/
function response(room, msg, sender, isGroupChat, replier) {
    /*모르면 골롬*/
    msg = msg.trim();
    sender = sender.trim();
    room = room.trim();

    /*도배 방지, 1:1 채팅방 필터링*/
    if (!isGroupChat) return; //단체 채팅방에서만 작동
    if (preChat[room] == msg) return; //동일한 채팅이 두 번 이상 연속으로 수신되면, 가볍게 무시
    preChat[room] = msg;

    /*봇 작동여부 결정 및 명령어 처리*/
    procCmd(msg, replier);
    if (botOff) return;

    /*반응 안할 채팅들*/
    var noReply = [".", "사진", "동영상", "음성메시지", "카카오톡 프로필", "(이모티콘)", "카카오링크 이미지"];
    for (var n = 0; n < noReply.length; n++) {
        if (msg == noReply[n]) return;
    }

    /*적당한 채팅 하나 가져와서 답장(?)하는 부분*/
    var chat = Murin.getReply(room, msg);
    if (chat != null) Murin.say(chat, replier);

    /*채팅을 학습하는 부분*/
    if (Murin.isValidData(msg)) { //배울 만한 채팅인 경우,
        var data = DB.readData(room); //배운 채팅 목록을 가져옴
        if (data == null) { //이미 배운게 있다면
            DB.saveData(room, msg); //새로 저장
        } else { //아니면,
            if (lastSender[room] == sender) { //같은 사람이 연속으로 채팅을 한 경우,
                DB.saveData(room, data + " " + msg); //같은 채팅으로 분류
            } else { //아니면,
                DB.saveData(room, data + "\n" + msg); //다른 채팅으로 분류
            }
        }
    }
    lastSender[room] = sender;
}

/*그냥 명령어 목록*/
function procCmd(cmd, r) {
    switch (cmd) {
        case "/on":
            Murin.say("Murin이 말을 하기 시작합니다.", r);
            botOff = false;
            break;
        case "/off":
            Murin.say("Murin이 말을 하지 않기 시작합니다.", r);
            botOff = true;
            break;
        case "/info":
            Murin.say("[Project M - 3rd]\n봇 이름 : Murin\n버전 : 2.0\n원작자 : Dark Tornado\n\n 나름 사람처럼 대화하는 카카오톡 봇 만들기 프로젝트(?) 중 3번째 오픈 소스인 Murin(무린)입니다.", r);
            break;
        case "/help":
            Murin.say("Murin의 명령어 목록입니다.\n /on - Murin을 활성화시킵니다.\n /off - Murin을 비활성화시킵니다.\n /info - Murin의 정보를 띄웁니다.\n /help - Murin의 명령어 목록을 띄웁니다.", r);
            break;
    }
}

