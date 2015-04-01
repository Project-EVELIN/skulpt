/* jslint nomen: true, bitwise: true */
/* global Sk: true */

// Takes a JavaScript string and returns a number using the
// parser and negater functions (for int/long right now)
//
// parser should take a string that is a postive number which only
// contains characters that are valid in the given base and a base and
// return a number
//
// negater should take a number and return its negation
//
// fname is a string containing the function name to be used in error
// messages
Sk.str2number = function (s, base, parser, negater, fname) {
    "use strict";
    var origs = s,
        neg = false,
        i,
        ch,
        val;

    // strip whitespace from ends
    // s = s.trim();
    s = s.replace(/^\s+|\s+$/g, "");

    // check for minus sign
    if (s.charAt(0) === "-") {
        neg = true;
        s = s.substring(1);
    }

    // check for plus sign
    if (s.charAt(0) === "+") {
        s = s.substring(1);
    }

    if (base === undefined) {
        base = 10;
    } // default radix is 10, not dwim

    if (base < 2 || base > 36) {
        if (base !== 0) {
            throw new Sk.builtin.ValueError(fname + "() base must be >= 2 and <= 36");
        }
    }

    if (s.substring(0, 2).toLowerCase() === "0x") {
        if (base === 16 || base === 0) {
            s = s.substring(2);
            base = 16;
        } else if (base < 34) {
            throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
        }
    } else if (s.substring(0, 2).toLowerCase() === "0b") {
        if (base === 2 || base === 0) {
            s = s.substring(2);
            base = 2;
        } else if (base < 12) {
            throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
        }
    } else if (s.substring(0, 2).toLowerCase() === "0o") {
        if (base === 8 || base === 0) {
            s = s.substring(2);
            base = 8;
        } else if (base < 25) {
            throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
        }
    } else if (s.charAt(0) === "0") {
        if (s === "0") {
            return 0;
        }
        if (base === 8 || base === 0) {
            base = 8;
        }
    }

    if (base === 0) {
        base = 10;
    }

    if (s.length === 0) {
        throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
    }

    // check all characters are valid
    for (i = 0; i < s.length; i = i + 1) {
        ch = s.charCodeAt(i);
        val = base;
        if ((ch >= 48) && (ch <= 57)) {
            // 0-9
            val = ch - 48;
        } else if ((ch >= 65) && (ch <= 90)) {
            // A-Z
            val = ch - 65 + 10;
        } else if ((ch >= 97) && (ch <= 122)) {
            // a-z
            val = ch - 97 + 10;
        }

        if (val >= base) {
            throw new Sk.builtin.ValueError("invalid literal for " + fname + "() with base " + base + ": '" + origs + "'");
        }
    }

    // parse number
    val = parser(s, base);
    if (neg) {
        val = negater(val);
    }
    return val;
};

Sk.builtin.int_ = function (x, base) {
    "use strict";
    var val;

    // if base is not of type int, try calling .__index__
    if(base !== undefined && !Sk.builtin.checkInt(base)) {
        if(base.tp$getattr("__index__")) {
            base = Sk.misceval.callsim(base.__index__, base);
        } else if(base.tp$getattr("__int__")) {
            base = Sk.misceval.callsim(base.__int__, base);
        } else {
            throw new Sk.builtin.AttributeError(Sk.abstr.typeName(base) + " instance has no attribute '__index__' or '__int__'");
        }
    }

    if (x instanceof Sk.builtin.str) {
        base = Sk.builtin.asnum$(base);

        val = Sk.str2number(x.v, base, parseInt, function (x) {
            return -x;
        }, "int");

        if ((val > Sk.builtin.nmber.threshold$) || (val < -Sk.builtin.nmber.threshold$)) {
            // Too big for int, convert to long
            return new Sk.builtin.lng(x, base);
        }

        return new Sk.builtin.nmber(val, Sk.builtin.nmber.int$);
    }

    if (base !== undefined) {
        throw new Sk.builtin.TypeError("int() can't convert non-string with explicit base");
    }

    if (x === undefined || x === Sk.builtin.none) {
        x = 0;
    }

    // try calling internal magic method
    if((x.tp$getattr && x.tp$getattr("__int__")) || x.__int__) {
        return Sk.misceval.callsim(x.__int__, x);
    }

    x = Sk.builtin.asnum$(x);
    if (x > Sk.builtin.nmber.threshold$ || x < -Sk.builtin.nmber.threshold$) {
        return new Sk.builtin.lng(x);
    }
    return new Sk.builtin.nmber(parseInt(x, base), Sk.builtin.nmber.int$);
};

Sk.builtin.int_.prototype.__int__ = new Sk.builtin.func(function(self) {
    return self;
});

Sk.builtin.int_.prototype.__index__ = new Sk.builtin.func(function(self) {
    return self;
});

Sk.builtin.int_.prototype.__float__ = new Sk.builtin.func(function(self) {
    return new Sk.builtin.nmber(Sk.ffi.remapToJs(self), Sk.builtin.nmber.float$);
});

Sk.builtin.int_.prototype.__complex__ = new Sk.builtin.func(function(self) {
    throw new Sk.builtin.TypeError("__complex__ is not implemented for type 'int'.");
    //return new Sk.builtin.complex(self); // create new complex number
});

Sk.builtin.int_.co_varnames = [ "base" ];
Sk.builtin.int_.co_numargs = 2;
Sk.builtin.int_.$defaults = [ new Sk.builtin.nmber(10, Sk.builtin.nmber.int$) ];

Sk.builtin.int_.prototype.tp$name = "int";
Sk.builtin.int_.prototype.ob$type = Sk.builtin.type.makeIntoTypeObj("int", Sk.builtin.int_);
