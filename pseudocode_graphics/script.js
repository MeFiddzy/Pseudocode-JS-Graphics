function processJson(str) {
    var json = JSON.parse(str);    

    var lines = json.lines;
    var circles = json.circles;
    var rects = json.rects;
    var canvas = json.canvas;

    var canvases = document.getElementsByTagName("canvas");

    for (var i = 0; i < canvases.length; i++) {
        canvases[i].remove();
    }

    document.getElementById("body").innerHTML += 
       '<canvas width="' + canvas.width + '" height="' + canvas.height + '" style="border:1px solid #000000;" id="canvas"></canvas>';

    var m = document.getElementById("canvas").getContext("2d");

    // lines
    for (var i = 0; i < lines.length; i++) {
        var cLine = lines[i];
        m.lineWidth = cLine.line.thick;
        m.strokeStyle = cLine.line.color;

        m.beginPath();
        m.moveTo(cLine.startPos.x, cLine.startPos.y);
        m.lineTo(cLine.endPos.x, cLine.endPos.y);
        m.stroke();
    }

    // circles
    for (var i = 0; i < circles.length; i++) {
        var cCir = circles[i];
        m.lineWidth = cCir.line.thick;
        m.strokeStyle = cCir.line.color;

        m.beginPath();
        m.arc(cCir.midPos.x, cCir.midPos.y, cCir.rad, 0, Math.PI * 2);
        m.stroke();
    }

    // rects
    for (var i = 0; i < rects.length; i++) {
        var cRect = rects[i];        
        if (cRect.fill.color === null) {
            // no fill
            m.lineWidth = cRect.line.thick;
            m.strokeStyle = cRect.line.color;
            m.beginPath();
            m.rect(cRect.startPos.x, cRect.startPos.y, cRect.endPos.x - cRect.startPos.x, cRect.endPos.y - cRect.startPos.y);
            m.stroke();
        } else {
            m.fillStyle = cRect.fill.color;
            m.fillRect(cRect.startPos.x, cRect.startPos.y, cRect.endPos.x - cRect.startPos.x, cRect.endPos.y - cRect.startPos.y);
        }
    }
}


function putLineInJson(code) {
    var cleanCode = code.replace(/\s+/g, ' ').trim();

    var match = cleanCode.match(/\((\d+),\s*(\d+)\)\s*->\s*\((\d+),\s*(\d+)\)\s*,\s*"([^"]+)"\s*,\s*(\d+)/);

    if (match) {
        return {
            startPos: {
                x: parseInt(match[1]),
                y: parseInt(match[2]) 
            },
            endPos: {
                x: parseInt(match[3]),
                y: parseInt(match[4]) 
            },
            line: { 
                color: match[5], 
                thick: parseInt(match[6]) 
            },
        };
    } else {
        console.error("Exception: Line parsing failed for:", cleanCode);
    }
    return null;
}




function putCanvasInJson(code) {
    var match = code.match(/(\d+)\s*,\s*(\d+)/);
    if (match) {
        return {
            width: parseInt(match[1]),
            height: parseInt(match[2]),
        };
    }
    return null;
}

function putCircleInJson(code) {
    var match = code.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)\s*<-\s*(\d+)\s*,\s*"([^"]+)"\s*,\s*(\d+)/);
    if (match) {
        return {
            midPos: {
                x: parseInt(match[1]),
                y: parseInt(match[2])
            },
            rad: parseInt(match[3]),
            line: {
                color: match[4],
                thick: parseInt(match[5])
            }
        };
    }
    return null;
}

function putRectFillInJson(code) {
    var match = code.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)\s*->\s*\(\s*(\d+)\s*,\s*(\d+)\s*\),\s*"([^"]+)"/);
    if (match) {
        return {
            startPos: {
                x: parseInt(match[1]),
                y: parseInt(match[2]) 
            },
            endPos: {
                x: parseInt(match[3]),
                y: parseInt(match[4]) 
            },
            line: null,
            fill: {
                color: match[5]
            }
        };
    }
    return null;
}

function putRectStrokeInJson(code) {
    var match = code.match(/\(\s*(\d+)\s*,\s*(\d+)\s*\)\s*->\s*\(\s*(\d+)\s*,\s*(\d+)\s*\),\s*"([^"]+)",\s*(\d+)/);
    if (match) {
        return {
            startPos: {
                x: parseInt(match[1]),
                y: parseInt(match[2]) 
            },
            endPos: {
                x: parseInt(match[3]),
                y: parseInt(match[4]) 
            },
            line: {
                thick: parseInt(match[6]),
                color: match[5]
            },
            fill: {
                color: null
            }
        };
    }
    return null;
}



function process() {
    var entry = document.getElementById("input").value.trim();
    var instr = entry.split(";").filter(s => s.trim().length > 0);

    console.log(instr);


    var obj = {
        canvas: null,
        lines: [],
        circles: [],
        rects: []
    };

    for (let i = 0; i < instr.length; i++) {
        var cInst = instr[i].trim();
        var match = cInst.match(/^(\w+)\s*\{([\s\S]*?)\}$/);
        if (!match) {
            console.error("Exception: Invalid instruction format:", cInst);
            continue;
        }

        var cmd = match[1];
        var content = match[2];

        if (cmd === "canvas") {
            var ret = putCanvasInJson(content);
            if (ret) 
                obj.canvas = ret;
            else 
                console.error("Exception: Failed to parse canvas:", content);
        }
        else if (cmd === "line") {
            var ret = putLineInJson(content.replace(/\s+/g, " ").trim());
            if (ret) 
                obj.lines.push(ret);
            else 
                console.error("Exception: Failed to parse line:", content);
        }
        else if (cmd === "circle") {
            var ret = putCircleInJson(content.replace(/\s+/g, " ").trim());
            if (ret) 
                obj.circles.push(ret);
            else 
                console.error("Exception: Failed to parse line:", content);
        }
        else if (cmd === "rect_fill") {
            var ret = putRectFillInJson(content.replace(/\s+/g, " ").trim());
            if (ret) 
                obj.rects.push(ret);
            else 
                console.error("Exception: Failed to parse line:", content);
        }
        else if (cmd === "rect_stroke") {
            var ret = putRectStrokeInJson(content.replace(/\s+/g, " ").trim());
            if (ret) 
                obj.rects.push(ret);
            else 
                console.error("Exception: Failed to parse line:", content);
        }
        else if (cmd === "" || cmd == "comment") {

        }
        else {
            console.error("Exception: Unknown command trown: " + cmd);
        }
    }

    if (!obj.canvas) {
        console.error("Exception: No canvas was declared.");
        return;
    }

    console.log(JSON.stringify(obj));
    processJson(JSON.stringify(obj));
}
