/*
Monika (모니카) - Project M
© 2020 Dark Tornado, All rights reserved.
version 2.0
Just Monika!
*/

const sdcard = android.os.Environment.getExternalStorageDirectory().getAbsolutePath();

const Monika = {};
const preChat = {};
const lastSender = {};
const chatData = {};

var log = "";

var reply = {
    up: 1,
    down: 20
};

Monika.VERSION = "2.0";
Monika.actived = true;
Monika.init = function() {
    var file = new java.io.File(sdcard + "/Monika/");
    file.mkdirs();
    var files = file.list();
    for (var n = 0; n < files.length; n++) {
        var room = files[n].replace(".txt", "");
        var data = Monika.read(room);
        if (data == null) chatData[room] = [];
        else chatData[room] = data.split("\n");
    }
};
Monika.read = function(name) {
    return FileStream.read(sdcard + "/Monika/" + name + ".txt");
};
Monika.save = function(name, value) {
    return FileStream.write(sdcard + "/Monika/" + name + ".txt", value);
};
Monika.isValidData = function(msg) {
    var invalids = ["#", "/"];
    for (var n = 0; n < invalids.length; n++) {
        if (msg.charAt(0) == invalids[n]) return false;
    }
    var noStudy = ["\n", "//"];
    for (var n = 0; n < noStudy.length; n++) {
        if (msg.indexOf(noStudy[n]) != -1) return false;
    }
    return true;
};
Monika.getReply = function(chatData, msg) {
    msg = msg.split(" ");
    var result = [];
    var max = 0;
    for (var n = 0; n < chatData.length - 1; n++) {
        var count = Monika.checkWord(chatData[n], msg);
        if (count > 0) {
            if (count > max) {
                max = count;
                result = [];
            }
            if (count == max) {
                result.push(chatData[n + 1]);
            }
        }
    }
    if (result.length == 0) return null;
    else return result[Math.floor(Math.random() * result.length)];
};
Monika.checkWord = function(chat, msg) {
    var count = 0;
    for (var n = 0; n < msg.length; n++) {
        if (chat.includes(msg[n])) count++;
    }
    return count;
};

Utils.isAdmin = function(sender) {
    if (sender == "Input Your Nickname") return true;
    else return false;
};

Monika.init();

function response(room, msg, sender, isGroupChat, replier) {
    if (!isGroupChat) return;
    msg = msg.trim();

    if (Utils.isAdmin(room) && msg.startsWith("/m ")) {
        procCmd(room, msg.replace("/m ", ""), sender, replier);
    }

    if (!Monika.actived) return;

    if (preChat[room] == msg) return;
    preChat[room] = msg;
    if (chatData[room] == undefined) chatData[room] = [];

    var cmd = msg.split(" ")[0];
    var data = cmd.replace(cmd + " ", "");
    if (msg == "/모니카" || msg == "/Monika") {
        replier.reply("[Just Monika]\n이름 : 모니카\n버전 : " + Monika.VERSION + "\n제작자 : Dark Tornado\n반응 확률 : " + reply.up + "/" + reply.down+"\nDB : " + chatData[room].length);
    }
    if (msg == "모니카") {
        replier.reply("Just Monika");
    }
    if (msg == "시니카"||msg=="씨니카") {
        replier.reply("모발년이ㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣㅣ");
    }
    if (msg == "/DB") {
        replier.reply(chatData[room].length + "개");
    }

    var noReply = [".", "사진", "동영상", "음성메시지", "카카오톡 프로필", "(이모티콘)", "카카오링크", "카카오링크 이미지"];
    for (var n = 0; n < noReply.length; n++) {
        if (msg == noReply[n]) return;
    }

    if (Math.floor(Math.random() * reply.down) < reply.up) {
        var result = Monika.getReply(chatData[room], msg);
        if (result != null) {
            replier.reply(result);
            log += "["+room+"]\nQ: "+msg+"\nA: "+result+"\n\n";
        }
    }

    if (Monika.isValidData(msg)) {
        if (lastSender[room] == sender) {
            chatData[room][chatData[room].length - 1] += " " + msg;
        } else {
            chatData[room].push(msg);
        }
        Monika.save(room, chatData[room].join("\n"));
    }

    lastSender[room] = sender;

}

function procCmd(room, msg, sender, replier) {
    var cmd = msg.split(" ")[0];
    var data = msg.replace(cmd + " ", "");

    if (msg == "on") {
        Monika.actived = true;
        replier.reply("모니카가 활성화되었습니다.");
    } else if (msg == "off") {
        Monika.actived = false;
        replier.reply("모니카가 비활성화되었습니다.");
    }

    if (cmd == "reply") {
        var rep = data.split(" ");
        reply.up = Number(rep[0]);
        reply.down = Number(rep[1]);
        replier.reply("반응 확률이 " + reply.up + "/" + reply.down + "(으)로 설정되었습니다.");
    }

    if (cmd == "log") {
        replier.reply(log);
    }

}

