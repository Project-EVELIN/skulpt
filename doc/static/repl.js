$(function () {
    var repl = new CodeMirrorREPL('interactive', {
        mode: "python",
        theme: "solarized dark",
    });

    var compilableLines = [];
//finds lines starting with "print"
    var re = new RegExp("\s*print");

    repl.print("Python 2.6(ish) (skulpt, " + new Date() + ")");
    repl.print("[" + navigator.userAgent + "] on " + navigator.platform);
    repl.print('Don\'t type "help", "copyright", "credits" or "license" unless you\'ve assigned something to them');

    repl.isBalanced = function (code) {
        var lines = code.split('\n');
        depth = 0;
        for (var l in lines){
            if (lines[l].substr(lines[l].length -1) == ":") {
                depth++;
            }
            if (lines[l] == "" && depth > 0){
                depth--;
            }
        }
        return depth == 0;
    }

//Loop
    repl.eval = function (code) {

        Sk.configure({ output: function(str) {
            if (str.replace(/\n/g, "") != ""){
                repl.print(str);
            }
        } });

        var lines = code.split('\n');

        var removePrints = false;

        var linesToCompile = compilableLines.concat(lines);

        if (lines.length == 1) {
            if (lines[0].indexOf('=') == -1 && lines[0].indexOf(':') == -1) {
                //Print
                if (!re.test(lines[0])) {
                    linesToCompile.pop();
                    linesToCompile.push("evaluationresult = " + lines[0]);
                    linesToCompile.push("if not evaluationresult == None: print evaluationresult");
                }
                lines.pop();
            }
        }

        try {
            //Evaluate
            Sk.importMainWithBody("repl", false, linesToCompile.join('\n'));
            //remove print statements when a block is created that doesn't define anything
            compilableLines = compilableLines.concat(lines.map(function (str) {
                if (re.test(str) && removePrints) {
                    return str.replace(/print.*/g, "pass");
                } else {
                    return str;
                }
            }));
        } catch (err) {
            repl.print(err);

            var index = -1;
            //find the line number
            if ((index = err.toString().indexOf("on line")) != -1) {
                index = parseInt(err.toString().substr(index + 8), 10);
            }
            var line = 0;
            //print the accumulated code with a ">" before the broken line.
            //Don't add the last statement to the accumulated code
            repl.print(linesToCompile.map(function (str) {
                return ++line + (index == line ? ">" : " ") + ": " + str;
            }).join('\n'));
        }
    }
});