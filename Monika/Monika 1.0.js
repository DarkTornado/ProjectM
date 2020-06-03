/*
Monika (모니카) - Project M
© 2020 Dark Tornado, All rights reserved.
version 1.0
Just Monika!
*/

const sdcard = android.os.Environment.getExternalStorageDirectory().getAbsolutePath();

const Monika = {};
const preChat = {};
const chatData = {};

Monika.VERSION = "1.0";
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
    FileStream.write(sdcard + "/Monika/" + name + ".txt", value);
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
    for (var n = 0; n < chatData.length - 1; n++) {
        if (Monika.checkWord(chatData[n], msg)) result.push(chatData[n + 1]);
    }
    if (result.length == 0) return null;
    else return result[Math.floor(Math.random() * result.length)];
};
Monika.checkWord = function(chat, msg) {
    for (var n = 0; n < msg.length; n++) {
        return chat.includes(msg[n]);
    }
};

Monika.init();

function response(room, msg, sender, isGroupChat, replier) {
    if (!isGroupChat) return;
    msg = msg.trim();
    if (preChat[room] == msg) return;
    preChat[room] = msg;
    if (chatData[room] == undefined) chatData[room] = [];

    var cmd = msg.split(" ")[0];
    var data = cmd.replace(cmd + " ", "");
    if (msg == "/모니카" || msg == "/Monika") {
        replier.reply("[Prjoect M]\n이름 : 모니카\n버전 : "+Monika.VERSION+"\nDB : "+chatData[room].length);
    }
    if (msg == "모니카") {
        replier.reply("Just Monika");
    }
    if (msg == "/DB") {
        replier.reply(chatData[room].length + "개");
    }

    var noReply = [".", "사진", "동영상", "음성메시지", "카카오톡 프로필", "(이모티콘)", "카카오링크", "카카오링크 이미지"];
    for (var n = 0; n < noReply.length; n++) {
        if (msg == noReply[n]) return;
    }

    if (Math.floor(Math.random() * 20) == 0) {
        var result = Monika.getReply(chatData[room], msg);
        if (result != null) replier.reply(result);
    }

    if (Monika.isValidData(msg)) {
        chatData[room].push(msg);
        Monika.save(room, chatData[room].join("\n"));
    }

}

