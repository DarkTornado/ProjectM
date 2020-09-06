/*
Project - M
5th Open Source : Moka
© 2018 Dark Tornado, All rights reserved.

<작동 방식>
1. 채팅방에서 사람들이 하는 채팅을 '내장메모리/Moka/' 폴더에 '방이름.txt' 파일로 저장.
  -> 각 채팅들은 엔터로 구분합니다. 따라서, 엔터가 포함된 채팅은 저장하지 않습니다.
  -> 학습 및 채팅 전송은 채팅방마다 따로따로 작동합니다.
2. 해당 채팅방에서 채팅이 수신되면 10% 확률로 수신된 채팅과 파일 안에 있는 채팅의 유사도를 대충 검사.
  -> 한글, 숫자, 띄어쓰기를 제외한 나머지만 비교.
  -> 어절이 하나 이상 일치하면 유사하다고 판단하며, 가장 많이 일치하는 말들 중 응답할 말 선택.
3. 유사하다고 판단된 채팅들에 대한 답변을 채팅방으로 전송.
  -> 배운게 없으면 전송 안함

<가이드라인>

- 개발자의 허락 없이 소스 코드 무단 배포 금지. 들키면, 싸대기 퍽퍽.
- 소스 사용시 원작자를 밝혀주세요.
  ex) 이 봇은 Dark Tornado의 Project M - Moka 소스를 사용하였습니다.

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
const Moka = {}; //모카 관련 객체
const DB = {}; //파일 입/출력용 객제인데, 이름이 DB인건 기분탓
const preChat = {}; //도배 방지 구현용
const lastSender = {}; //보낸 사람 구분용
const botOn = {}; //봇 작동여부 설정용

/*변수 선언*/
var chatData = []; //1:1 채팅방에서 사용할 대화 목록이 저장될 배열

/*Moka 객체*/
Moka.checkWord = function(que, msg) { //적당히 비슷한 말인지 비교
    var data = msg.split(" "); //수신된 채팅을 어절 단위로 나눔
    var count = 0;
    for (var n = 0; n < data.length; n++) { //저장된 채팅에 어절들이 몇 개 포함되어 있는지
        if (que.indexOf(data[n]) != -1) {
            count++;
        }
    }
    return count; //반환
};
Moka.getReply = function(room, msg, data) { //수신된 채팅에 대한 적당한 답변 반환
    msg = msg.replace(/[^(가-힣ㄱ-ㅎㅏ-ㅣ0-9 )]/g, ""); //수신된 채팅 내용 중 한글, 띄어쓰기, 숫자를 제외하고 전부 삭제
    if (data != null) { //저장된 채팅이 없으면 작동 안함
        var result = []; //비슷한 말들이 들어갈 배열
        var max = 0; //최대 유사도(?) 값
        for (var n = 0; n < data.length - 1; n++) { //저장된 채팅들 중 비슷하다 싶은 녀석들을 배열에 넣을건데,
            var count = Moka.checkWord(data[n], msg); //유사도(?)를 가져와서
            if (count > 0) { //유사한 채팅이라면,
                if (count > max) { //기존에 확인했던 녀석들보다 유사도가 높으면, 결과 배열 초기화 및 최대 유사도 값 변경
                    max = count;
                    result = [];
                }
                if (count == max) { //이미 유사도가 더 높은 말이 있다면, 저장 안함
                    result.push(data[n + 1]); //배열에 추가
                }
            }
        }
        if (result[0] != null) return result[Math.floor(Math.random() * result.length)]; //배열이 빈게 아니라면 아무거나 하나 반환
    }
    return null; //일치하는게 없거나, 저장된 채팅이 없거나, 발동할 확률(?)이 아니면, null 반환
};
Moka.say = function(msg, replier) { //그냥 말하는 함수
    replier.reply("[AI] " + msg); //앞에다가 이상한 문구 붙이는 용도
};
Moka.isValidData = function(msg) { //배울 만한 채팅인지 구분하는 함수 
    var invalids = ["#", "/"];
    for (var n = 0; n < invalids.length; n++) {
        if (msg.startsWith(invalids[n])) return false; //특정 문자로 시작하는 것은 학습 X.    
    }
    var noStudy = ["\n", "//"]; //엔터가 포함된건 학습 X. 비속어 필터링 등도 여기다가 넣으면 이상한 말은 안배움
    for (var n = 0; n < noStudy.length; n++) {
        if (msg.indexOf(noStudy[n]) != -1) return false;
    }
    return true;
};

/*DB 객체*/
DB.createDir = function() { //배운 채팅들이 저장될 폴더를 만드는 함수
    var folder = new java.io.File(sdcard + "/Moka/"); //File 인스턴스 생성
    folder.mkdirs(); //폴더 생성
};
DB.saveData = function(name, msg) { //파일에 내용을 저장하는 함수
    try { //사실, 나도 어디서 긁어와서 이곳저곳에서 사용하는 거임
        var file = new java.io.File(sdcard + "/Moka/" + name + ".txt");
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
        var file = new java.io.File(sdcard + "/Moka/" + name + ".txt");
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
DB.initChatData = function() {
    var data = DB.loadChatData();
    if (data == null) {
        Log.info("1:1 채팅방용 대화 데이터를 받아오지 못했습니다.");
    } else {
        chatData = data.split("\n");
        Log.info("1:1 채팅방용 대화 데이터 로드 완료.");
    }
};
DB.loadChatData = function() {
    try {
        var url = new java.net.URL("https://raw.githubusercontent.com/DarkTornado/ProjectM/master/ChatData.txt");
        var con = url.openConnection();
        if (con != null) {
            con.setConnectTimeout(5000);
            con.setUseCaches(false);
            var isr = new java.io.InputStreamReader(con.getInputStream());
            var br = new java.io.BufferedReader(isr);
            var str = br.readLine();
            var line = "";
            while ((line = br.readLine()) != null) {
                str += "\n" + line;
            }
            isr.close();
            br.close();
            con.disconnect();
        }
        return str.toString();
    } catch (e) {
        Log.debug(e);
    }
};


/*전역에서 실행할 것들*/
DB.createDir(); //폴더 생성
DB.initChatData(); //Project M 깃허브에서 대화 목록을 불러옴

/*response 부분*/
function response(room, msg, sender, isGroupChat, replier) {
    /*모르면 골롬*/
    msg = msg.trim();
    sender = sender.trim();
    room = room.trim();

    /*도배 방지*/
    if (preChat[room] == msg) return; //동일한 채팅이 두 번 이상 연속으로 수신되면, 가볍게 무시
    preChat[room] = msg;

    /*봇 작동여부 결정 및 명령어 처리*/
    procCmd(msg, room, isGroupChat, replier);
    if (botOn[room] === undefined) botOn[room] = true;
    if (botOn[room] == false) return;

    /*반응 안할 채팅들*/
    var noReply = [".", "사진", "동영상", "음성메시지", "카카오톡 프로필", "(이모티콘)", "카카오링크 이미지"];
    for (var n = 0; n < noReply.length; n++) {
        if (msg == noReply[n]) return;
    }

    /*1:1 채팅방은 chatHook에서 따로 처리*/
    if (!isGroupChat) {
        chatHook(room, msg, sender, replier);
        return;
    }

    /*적당한 채팅 하나 가져와서 답장(?)하는 부분*/
    if (Math.floor(Math.random() * 10) == 0) { //10% 확률로 작동
        var data = DB.readData(room); //저장된 채팅들을 불러옴
        var chat = Moka.getReply(room, msg, data.split("\n")); //적당한거 하나 가져와서
        if (chat != null) Moka.say(chat, replier); //전송
    }

    /*채팅을 학습하는 부분*/
    if (Moka.isValidData(msg)) { //배울 만한 채팅인 경우,
        var data = DB.readData(room); //배운 채팅 목록을 가져옴
        if (data == null) { //아직 배운게 없다면,
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

/*1:1 채팅방용*/
function chatHook(room, msg, sender, replier) {
    if (Math.floor(Math.random() * 3) != 0) { // 2/3 확률로 반응
        var chat = Moka.getReply(room, msg, chatData);
        if (chat != null) Moka.say(chat, replier);
    }
}

/*그냥 명령어 목록*/
function procCmd(cmd, room, isGroupChat, r) {
    switch (cmd) {
        case "/on":
            Moka.say("Moka가 말을 하기 시작합니다.", r);
            botOn[room] = true;
            break;
        case "/off":
            Moka.say("Moka가 말을 하지 않기 시작합니다.", r);
            botOn[room] = false;
            break;
        case "/info":
            Moka.say("[Project M - 5th]\n봇 이름 : Moka\n버전 : 3.1\n원작자 : Dark Tornado\n\n 나름 사람처럼 대화하는 카카오톡 봇 만들기 프로젝트(?) 중 5번째 오픈 소스인 Moka(모카)입니다.", r);
            break;
        case "/help":
            Moka.say("Moka의 명령어 목록입니다.\n /on - Moka을 활성화시킵니다.\n /off - Moka을 비활성화시킵니다.\n /info - Moka의 정보를 띄웁니다.\n /help - Moka의 명령어 목록을 띄웁니다.\n /DB - 단체 채팅방의 경우, 해당 채팅방에서 배운 채팅들의 수를 출력합니다.", r);
            break;
        case "/DB":
            if (isGroupChat) {
                var data = DB.readData(room);
                if (data == null) Moka.say("0개입니다.", r);
                else Moka.say(data.split("\n").length + "개입니다.", r);
            } else {
                Moka.say(chatData.length + "개입니다.", r);
            }
            break;
    }
}

