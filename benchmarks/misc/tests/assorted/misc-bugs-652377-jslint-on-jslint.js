// jslint.js
// 2011-04-21

// Copyright (c) 2002 Douglas Crockford  (www.JSLint.com)

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// The Software shall be used for Good, not Evil.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


// JSLINT is a global function. It takes two parameters.

//     var myResult = JSLINT(source, option);

// The first parameter is either a string or an array of strings. If it is a
// string, it will be split on '\n' or '\r'. If it is an array of strings, it
// is assumed that each string represents one line. The source can be a
// JavaScript text, or HTML text, or a JSON text, or a CSS text.

// The second parameter is an optional object of options that control the
// operation of JSLINT. Most of the options are booleans: They are all
// optional and have a default value of false. One of the options, predef,
// can be an array of names, which will be used to declare global variables,
// or an object whose keys are used as global names, with a boolean value
// that determines if they are assignable.

// If it checks out, JSLINT returns true. Otherwise, it returns false.

// If false, you can inspect JSLINT.errors to find out the problems.
// JSLINT.errors is an array of objects containing these properties:

//  {
//      line      : The line (relative to 0) at which the lint was found
//      character : The character (relative to 0) at which the lint was found
//      reason    : The problem
//      evidence  : The text line in which the problem occurred
//      raw       : The raw message before the details were inserted
//      a         : The first detail
//      b         : The second detail
//      c         : The third detail
//      d         : The fourth detail
//  }

// If a stopping error was found, a null will be the last element of the
// JSLINT.errors array. A stopping error means that JSLint was not confident
// enough to continue. It does not necessarily mean that the error was
// especailly heinous.

// You can request a Function Report, which shows all of the functions
// and the parameters and vars that they use. This can be used to find
// implied global variables and other problems. The report is in HTML and
// can be inserted in an HTML <body>.

//     var myReport = JSLINT.report(errors_only);

// If errors_only is true, then the report will be limited to only errors.

// You can request a data structure that contains JSLint's results.

//     var myData = JSLINT.data();

// It returns a structure with this form:

//     {
//         errors: [
//             {
//                 line: NUMBER,
//                 character: NUMBER,
//                 reason: STRING,
//                 evidence: STRING
//             }
//         ],
//         functions: [
//             name: STRING,
//             line: NUMBER,
//             last: NUMBER,
//             param: [
//                 TOKEN
//             ],
//             closure: [
//                 STRING
//             ],
//             var: [
//                 STRING
//             ],
//             exception: [
//                 STRING
//             ],
//             outer: [
//                 STRING
//             ],
//             unused: [
//                 STRING
//             ],
//             global: [
//                 STRING
//             ],
//             label: [
//                 STRING
//             ]
//         ],
//         globals: [
//             STRING
//         ],
//         member: {
//             STRING: NUMBER
//         },
//         unuseds: [
//             {
//                 name: STRING,
//                 line: NUMBER
//             }
//         ],
//         implieds: [
//             {
//                 name: STRING,
//                 line: NUMBER
//             }
//         ],
//         urls: [
//             STRING
//         ],
//         json: BOOLEAN
//     }

// Empty arrays will not be included.

// You can obtain the parse tree that JSLint constructed while parsing. The
// latest tree is kept in JSLINT.tree. A nice stringication can be produced
// with

//     JSON.stringify(JSLINT.tree, [
//         'value',  'arity', 'name',  'first',
//         'second', 'third', 'block', 'else'
//     ], 4));

// JSLint provides three directives. They look like slashstar comments, and
// allow for setting options, declaring global variables, and establishing a
// set of allowed property names.

// These directives respect function scope.

// The jslint directive is a special comment that can set one or more options.
// The current option set is

//     adsafe     true, if ADsafe rules should be enforced
//     bitwise    true, if bitwise operators should not be allowed
//     browser    true, if the standard browser globals should be predefined
//     cap        true, if upper case HTML should be allowed
//     'continue' true, if the continuation statement should be tolerated
//     css        true, if CSS workarounds should be tolerated
//     debug      true, if debugger statements should be allowed
//     devel      true, if logging should be allowed (console, alert, etc.)
//     es5        true, if ES5 syntax should be allowed
//     evil       true, if eval should be allowed
//     forin      true, if for in statements need not filter
//     fragment   true, if HTML fragments should be allowed
//     indent     the indentation factor
//     maxerr     the maximum number of errors to allow
//     maxlen     the maximum length of a source line
//     newcap     true, if constructor names must be capitalized
//     node       true, if Node.js globals should be predefined
//     nomen      true, if names should be checked
//     on         true, if HTML event handlers should be allowed
//     onevar     true, if only one var statement per function should be allowed
//     passfail   true, if the scan should stop on first error
//     plusplus   true, if increment/decrement should not be allowed
//     regexp     true, if the . should not be allowed in regexp literals
//     rhino      true, if the Rhino environment globals should be predefined
//     undef      true, if variables should be declared before used
//     safe       true, if use of some browser features should be restricted
//     windows    true, if MS Windows-specific globals should be predefined
//     strict     true, require the "use strict"; pragma
//     sub        true, if all forms of subscript notation are tolerated
//     white      true, if strict whitespace rules apply
//     widget     true  if the Yahoo Widgets globals should be predefined

// For example:

/*jslint
    evil: true, nomen: false, onevar: false, regexp: false, strict: true
*/

// The properties directive declares an exclusive list of property names.
// Any properties named in the program that are not in the list will
// produce a warning.

// For example:

/*properties "\b", "\t", "\n", "\f", "\r", "!=", "!==", "\"", "%",
    "&", "'", "(begin)", "(breakage)", "(context)", "(error)",
    "(global)", "(identifier)", "(line)", "(loopage)", "(name)", "(onevar)",
    "(params)", "(scope)", "(statement)", "(token)", "(verb)", ")", "*",
    "+", "-", "/", ";", "<", "<<", "<=", "==", "===",
    ">", ">=", ">>", ">>>", ADSAFE, ActiveXObject, Array, Boolean, Buffer,
    COM, CScript, Canvas, CustomAnimation, Date, Debug, E, Enumerator,
    Error, EvalError, FadeAnimation, Flash, FormField, Frame, Function,
    HotKey, Image, JSON, LN10, LN2, LOG10E, LOG2E, MAX_VALUE, MIN_VALUE,
    Math, MenuItem, MoveAnimation, NEGATIVE_INFINITY, Number, Object,
    Option, PI, POSITIVE_INFINITY, Point, RangeError, Rectangle,
    ReferenceError, RegExp, ResizeAnimation, RotateAnimation, SQRT1_2,
    SQRT2, ScrollBar, String, Style, SyntaxError, System, Text, TextArea,
    Timer, TypeError, URIError, URL, VBArray, WScript, Web, Window, XMLDOM,
    XMLHttpRequest, "\\", "^", __dirname, __filename, a, a_function,
    a_label, a_not_allowed, a_not_defined, a_scope, abbr, acronym,
    activeborder, activecaption, address, adsafe, adsafe_a,
    adsafe_autocomplete, adsafe_bad_id, adsafe_div, adsafe_fragment,
    adsafe_go, adsafe_html, adsafe_id, adsafe_id_go, adsafe_lib,
    adsafe_lib_second, adsafe_missing_id, adsafe_name_a, adsafe_placement,
    adsafe_prefix_a, adsafe_script, adsafe_source, adsafe_subscript_a,
    adsafe_tag, alert, aliceblue, all, already_defined, and, animator,
    antiquewhite, appleScript, applet, apply, approved, appworkspace, aqua,
    aquamarine, area, arguments, arity, article, aside, assign,
    assign_exception, assignment_function_expression, at, attribute_case_a,
    audio, autocomplete, avoid_a, azure, b, background,
    "background-attachment", "background-color", "background-image",
    "background-position", "background-repeat", bad_assignment, bad_color_a,
    bad_constructor, bad_entity, bad_html, bad_id_a, bad_in_a,
    bad_invocation, bad_name_a, bad_new, bad_number, bad_operand, bad_type,
    bad_url, bad_wrap, base, bdo, beep, beige, big, bisque, bitwise, black,
    blanchedalmond, block, blockquote, blue, blueviolet, body, border,
    "border-bottom", "border-bottom-color", "border-bottom-style",
    "border-bottom-width", "border-collapse", "border-color", "border-left",
    "border-left-color", "border-left-style", "border-left-width",
    "border-right", "border-right-color", "border-right-style",
    "border-right-width", "border-spacing", "border-style", "border-top",
    "border-top-color", "border-top-style", "border-top-width",
    "border-width", bottom, br, braille, brown, browser, burlywood, button,
    buttonface, buttonhighlight, buttonshadow, buttontext, bytesToUIString,
    c, cadetblue, call, callee, caller, canvas, cap, caption,
    "caption-side", captiontext, center, charAt, charCodeAt, character,
    chartreuse, chocolate, chooseColor, chooseFile, chooseFolder, cite,
    clear, clearInterval, clearTimeout, clip, closeWidget,
    closure, cm, code, col, colgroup, color, combine_var, command, comment,
    comments, concat, conditional_assignment, confirm, confusing_a,
    confusing_regexp, console, constructor, constructor_name_a, content,
    continue, control_a, convertPathToHFS, convertPathToPlatform, coral,
    cornflowerblue, cornsilk, "counter-increment", "counter-reset", create,
    crimson, css, cursor, cyan, d, dangerous_comment, dangling_a, darkblue,
    darkcyan, darkgoldenrod, darkgray, darkgreen, darkkhaki, darkmagenta,
    darkolivegreen, darkorange, darkorchid, darkred, darksalmon,
    darkseagreen, darkslateblue, darkslategray, darkturquoise, darkviolet,
    data, datalist, dd, debug, decodeURI, decodeURIComponent, deeppink,
    deepskyblue, defineClass, del, deleted, deserialize, details, devel,
    dfn, dialog, dimgray, dir, direction, display, disrupt, div, dl,
    document, dodgerblue, dt, duplicate_a, edge, edition, else, em, embed,
    embossed, empty, "empty-cells", empty_block, empty_case, empty_class,
    encodeURI, encodeURIComponent, entityify, errors, es5, escape, eval,
    event, evidence, evil, ex, exception, exec, expected_a,
    expected_a_at_b_c, expected_a_b, expected_a_b_from_c_d, expected_at_a,
    expected_attribute_a, expected_attribute_value_a, expected_class_a,
    expected_fraction_a, expected_id_a, expected_identifier_a,
    expected_identifier_a_reserved, expected_lang_a, expected_linear_a,
    expected_media_a, expected_name_a, expected_nonstandard_style_attribute,
    expected_number_a, expected_operator_a, expected_percent_a,
    expected_positive_a, expected_pseudo_a, expected_selector_a,
    expected_small_a, expected_space_a_b, expected_string_a,
    expected_style_attribute, expected_style_pattern, expected_tagname_a,
    fieldset, figure, filesystem, filter, firebrick, first, float, floor,
    floralwhite, focusWidget, font, "font-family", "font-size",
    "font-size-adjust", "font-stretch", "font-style", "font-variant",
    "font-weight", footer, for_if, forestgreen, forin, form, fragment,
    frame, frames, frameset, from, fromCharCode, fuchsia, fud, funct,
    function, function_block, function_eval, function_loop,
    function_statement, function_strict, functions, g, gainsboro, gc,
    get_set, ghostwhite, global, globals, gold, goldenrod, gray, graytext,
    green, greenyellow, h1, h2, h3, h4, h5, h6, handheld, hasOwnProperty,
    head, header, height, help, hgroup, highlight, highlighttext, history,
    honeydew, hotpink, hr, "hta:application", html, html_confusion_a,
    html_handlers, i, iTunes, id, identifier, identifier_function, iframe,
    img, immed, implied_evil, implieds, in, inactiveborder, inactivecaption,
    inactivecaptiontext, include, indent, indexOf, indianred, indigo,
    infix_in, infobackground, infotext, init, input, ins, insecure_a,
    isAlpha, isApplicationRunning, isArray, isDigit, isFinite, isNaN, ivory,
    join, jslint, json, kbd, keygen, keys, khaki, konfabulatorVersion,
    label, label_a_b, labeled, lang, lavender, lavenderblush, lawngreen,
    lbp, leading_decimal_a, led, left, legend, lemonchiffon, length,
    "letter-spacing", li, lib, lightblue, lightcoral, lightcyan,
    lightgoldenrodyellow, lightgreen, lightpink, lightsalmon, lightseagreen,
    lightskyblue, lightslategray, lightsteelblue, lightyellow, lime,
    limegreen, line, "line-height", linen, link, "list-style",
    "list-style-image", "list-style-position", "list-style-type", load,
    loadClass, location, log, m, magenta, map, margin, "margin-bottom",
    "margin-left", "margin-right", "margin-top", mark, "marker-offset",
    maroon, match, "max-height", "max-width", maxerr, maxlen, md5,
    mediumaquamarine, mediumblue, mediumorchid, mediumpurple,
    mediumseagreen, mediumslateblue, mediumspringgreen, mediumturquoise,
    mediumvioletred, member, menu, menutext, message, meta, meter,
    midnightblue, "min-height", "min-width", mintcream, missing_a,
    missing_a_after_b, missing_option, missing_property, missing_space_a_b,
    missing_url, missing_use_strict, mistyrose, mixed, mm, moccasin, mode,
    module, move_invocation, move_var, name, name_function, nav,
    navajowhite, navigator, navy, nested_comment, newcap, next, node,
    noframes, nomen, noscript, not, not_a_constructor, not_a_defined,
    not_a_function, not_a_label, not_a_scope, not_greater, nud, object, ol,
    oldlace, olive, olivedrab, on, onevar, opacity, open, openURL, opera,
    optgroup, option, orange, orangered, orchid, outer, outline,
    "outline-color", "outline-style", "outline-width", output, overflow,
    "overflow-x", "overflow-y", p, padding, "padding-bottom",
    "padding-left", "padding-right", "padding-top", "page-break-after",
    "page-break-before", palegoldenrod, palegreen, paleturquoise,
    palevioletred, papayawhip, param, parameter_a_get_b, parameter_set_a,
    paren, parent, parseFloat, parseInt, passfail, pc, peachpuff, peru,
    pink, play, plum, plusplus, pop, popupMenu, position, postscript,
    powderblue, pre, predef, preferenceGroups, preferences, prev, print,
    process, progress, projection, prompt, prototype, pt, purple, push, px,
    q, querystring, quit, quote, quotes, radix, random, range, raw,
    readFile, readUrl, read_only, reason, red, redefinition_a, regexp,
    reloadWidget, replace, report, require, reserved, reserved_a,
    resolvePath, resumeUpdates, rhino, right, rosybrown, royalblue, rp, rt,
    ruby, runCommand, runCommandInBg, saddlebrown, safe, salmon, samp,
    sandybrown, saveAs, savePreferences, scanned_a_b, screen, script,
    scrollbar, seagreen, seal, search, seashell, second, section, select,
    serialize, setInterval, setTimeout, shift, showWidgetPreferences,
    sienna, silver, skyblue, slash_equal, slateblue, slategray, sleep,
    slice, small, snow, sort, source, span, spawn, speak, speech, split,
    springgreen, src, stack, statement_block, steelblue, stopping,
    strange_loop, strict, strong, style, styleproperty, sub, subscript,
    substr, sup, supplant, suppressUpdates, sync, system, table,
    "table-layout", tag_a_in_b, tan, tbody, td, teal, tellWidget, test,
    "text-align", "text-decoration", "text-indent", "text-shadow",
    "text-transform", textarea, tfoot, th, thead, third, thistle,
    threeddarkshadow, threedface, threedhighlight, threedlightshadow,
    threedshadow, thru, time, title, toLowerCase, toString, toUpperCase,
    toint32, token, tomato, too_long, too_many, top, tr, trailing_decimal_a,
    tree, tt, tty, turquoise, tv, type, typeof, u, ul, unclosed,
    unclosed_comment, unclosed_regexp, undef, unescape, unescaped_a,
    unexpected_a, unexpected_char_a_b, unexpected_comment,
    unexpected_property_a, unexpected_space_a_b, "unicode-bidi",
    unnecessary_initialize, unnecessary_use, unreachable_a_b,
    unrecognized_style_attribute_a, unrecognized_tag_a, unsafe, unused,
    unwatch, updateNow, url, urls, use_array, use_braces, use_object,
    used_before_a, util, value, valueOf, var, var_a_not, version,
    "vertical-align", video, violet, visibility, was, watch,
    weird_assignment, weird_condition, weird_new, weird_program,
    weird_relation, weird_ternary, wheat, white, "white-space", whitesmoke,
    widget, width, window, windowframe, windows, windowtext, "word-spacing",
    "word-wrap", wrap, wrap_immediate, wrap_regexp, write_is_wrong,
    yahooCheckLogin, yahooLogin, yahooLogout, yellow, yellowgreen,
    "z-index", "|", "~"
 */

// The global directive is used to declare global variables that can
// be accessed by the program. If a declaration is true, then the variable
// is writeable. Otherwise, it is read-only.

// We build the application inside a function so that we produce only a single
// global variable. That function will be invoked immediately, and its return
// value is the JSLINT function itself. That function is also an object that
// can contain data and other functions.

var JSLINT = (function () {
    "use strict";

    var adsafe_id,      // The widget's ADsafe id.
        adsafe_infix = {
            '-': true,
            '*': true,
            '/': true,
            '%': true,
            '&': true,
            '|': true,
            '^': true,
            '<<': true,
            '>>': true,
            '>>>': true
        },
        adsafe_prefix = {
            '-': true,
            '+': true,
            '~': true,
            'typeof': true
        },
        adsafe_may,     // The widget may load approved scripts.
        adsafe_top,     // At the top of the widget script.
        adsafe_went,    // ADSAFE.go has been called.
        anonname,       // The guessed name for anonymous functions.
        approved,       // ADsafe approved urls.

// These are operators that should not be used with the ! operator.

        bang = {
            '<'  : true,
            '<=' : true,
            '==' : true,
            '===': true,
            '!==': true,
            '!=' : true,
            '>'  : true,
            '>=' : true,
            '+'  : true,
            '-'  : true,
            '*'  : true,
            '/'  : true,
            '%'  : true
        },

// These are property names that should not be permitted in the safe subset.

        banned = {
            'arguments' : true,
            callee      : true,
            caller      : true,
            constructor : true,
            'eval'      : true,
            prototype   : true,
            stack       : true,
            unwatch     : true,
            valueOf     : true,
            watch       : true
        },
        begin,          // The root token

// browser contains a set of global names that are commonly provided by a
// web browser environment.

        browser = {
            clearInterval  : false,
            clearTimeout   : false,
            document       : false,
            event          : false,
            frames         : false,
            history        : false,
            Image          : false,
            location       : false,
            name           : false,
            navigator      : false,
            Option         : false,
            parent         : false,
            screen         : false,
            setInterval    : false,
            setTimeout     : false,
            window         : false,
            XMLHttpRequest : false
        },

// bundle contains the text messages.

        bundle = {
            a_function: "'{a}' is a function.",
            a_label: "'{a}' is a statement label.",
            a_not_allowed: "'{a}' is not allowed.",
            a_not_defined: "'{a}' is not defined.",
            a_scope: "'{a}' used out of scope.",
            adsafe: "ADsafe violation.",
            adsafe_a: "ADsafe violation: '{a}'.",
            adsafe_autocomplete: "ADsafe autocomplete violation.",
            adsafe_bad_id: "ADSAFE violation: bad id.",
            adsafe_div: "ADsafe violation: Wrap the widget in a div.",
            adsafe_fragment: "ADSAFE: Use the fragment option.",
            adsafe_go: "ADsafe violation: Misformed ADSAFE.go.",
            adsafe_html: "Currently, ADsafe does not operate on whole HTML documents. It operates on <div> fragments and .js files.",
            adsafe_id: "ADsafe violation: id does not match.",
            adsafe_id_go: "ADsafe violation: Missing ADSAFE.id or ADSAFE.go.",
            adsafe_lib: "ADsafe lib violation.",
            adsafe_lib_second: "ADsafe: The second argument to lib must be a function.",
            adsafe_missing_id: "ADSAFE violation: missing ID_.",
            adsafe_name_a: "ADsafe name violation: '{a}'.",
            adsafe_placement: "ADsafe script placement violation.",
            adsafe_prefix_a: "ADsafe violation: An id must have a '{a}' prefix",
            adsafe_script: "ADsafe script violation.",
            adsafe_source: "ADsafe unapproved script source.",
            adsafe_subscript_a: "ADsafe subscript '{a}'.",
            adsafe_tag: "ADsafe violation: Disallowed tag '{a}'.",
            already_defined: "'{a}' is already defined.",
            and: "The '&&' subexpression should be wrapped in parens.",
            assign_exception: "Do not assign to the exception parameter.",
            assignment_function_expression: "Expected an assignment or function call and instead saw an expression.",
            attribute_case_a: "Attribute '{a}' not all lower case.",
            avoid_a: "Avoid '{a}'.",
            bad_assignment: "Bad assignment.",
            bad_color_a: "Bad hex color '{a}'.",
            bad_constructor: "Bad constructor.",
            bad_entity: "Bad entity.",
            bad_html: "Bad HTML string",
            bad_id_a: "Bad id: '{a}'.",
            bad_in_a: "Bad for in variable '{a}'.",
            bad_invocation: "Bad invocation.",
            bad_name_a: "Bad name: '{a}'.",
            bad_new: "Do not use 'new' for side effects.",
            bad_number: "Bad number '{a}'.",
            bad_operand: "Bad operand.",
            bad_type: "Bad type.",
            bad_url: "Bad url string.",
            bad_wrap: "Do not wrap function literals in parens unless they are to be immediately invoked.",
            combine_var: "Combine this with the previous 'var' statement.",
            conditional_assignment: "Expected a conditional expression and instead saw an assignment.",
            confusing_a: "Confusing use of '{a}'.",
            confusing_regexp: "Confusing regular expression.",
            constructor_name_a: "A constructor name '{a}' should start with an uppercase letter.",
            control_a: "Unexpected control character '{a}'.",
            css: "A css file should begin with @charset 'UTF-8';",
            dangling_a: "Unexpected dangling '_' in '{a}'.",
            dangerous_comment: "Dangerous comment.",
            deleted: "Only properties should be deleted.",
            duplicate_a: "Duplicate '{a}'.",
            empty_block: "Empty block.",
            empty_case: "Empty case.",
            empty_class: "Empty class.",
            evil: "eval is evil.",
            expected_a: "Expected '{a}'.",
            expected_a_b: "Expected '{a}' and instead saw '{b}'.",
            expected_a_b_from_c_d: "Expected '{a}' to match '{b}' from line {c} and instead saw '{d}'.",
            expected_at_a: "Expected an at-rule, and instead saw @{a}.",
            expected_a_at_b_c: "Expected '{a}' at column {b}, not column {c}.",
            expected_attribute_a: "Expected an attribute, and instead saw [{a}].",
            expected_attribute_value_a: "Expected an attribute value and instead saw '{a}'.",
            expected_class_a: "Expected a class, and instead saw .{a}.",
            expected_fraction_a: "Expected a number between 0 and 1 and instead saw '{a}'",
            expected_id_a: "Expected an id, and instead saw #{a}.",
            expected_identifier_a: "Expected an identifier and instead saw '{a}'.",
            expected_identifier_a_reserved: "Expected an identifier and instead saw '{a}' (a reserved word).",
            expected_linear_a: "Expected a linear unit and instead saw '{a}'.",
            expected_lang_a: "Expected a lang code, and instead saw :{a}.",
            expected_media_a: "Expected a CSS media type, and instead saw '{a}'.",
            expected_name_a: "Expected a name and instead saw '{a}'.",
            expected_nonstandard_style_attribute: "Expected a non-standard style attribute and instead saw '{a}'.",
            expected_number_a: "Expected a number and instead saw '{a}'.",
            expected_operator_a: "Expected an operator and instead saw '{a}'.",
            expected_percent_a: "Expected a percentage and instead saw '{a}'",
            expected_positive_a: "Expected a positive number and instead saw '{a}'",
            expected_pseudo_a: "Expected a pseudo, and instead saw :{a}.",
            expected_selector_a: "Expected a CSS selector, and instead saw {a}.",
            expected_small_a: "Expected a small number and instead saw '{a}'",
            expected_space_a_b: "Expected exactly one space between '{a}' and '{b}'.",
            expected_string_a: "Expected a string and instead saw {a}.",
            expected_style_attribute: "Excepted a style attribute, and instead saw '{a}'.",
            expected_style_pattern: "Expected a style pattern, and instead saw '{a}'.",
            expected_tagname_a: "Expected a tagName, and instead saw {a}.",
            for_if: "The body of a for in should be wrapped in an if statement to filter unwanted properties from the prototype.",
            function_block: "Function statements should not be placed in blocks. " +
                "Use a function expression or move the statement to the top of " +
                "the outer function.",
            function_eval: "The Function constructor is eval.",
            function_loop: "Don't make functions within a loop.",
            function_statement: "Function statements are not invocable. " +
                "Wrap the whole function invocation in parens.",
            function_strict: "Use the function form of \"use strict\".",
            get_set: "get/set are ES5 features.",
            html_confusion_a: "HTML confusion in regular expression '<{a}'.",
            html_handlers: "Avoid HTML event handlers.",
            identifier_function: "Expected an identifier in an assignment and instead saw a function invocation.",
            implied_evil: "Implied eval is evil. Pass a function instead of a string.",
            infix_in: "Unexpected 'in'. Compare with undefined, or use the hasOwnProperty method instead.",
            insecure_a: "Insecure '{a}'.",
            isNaN: "Use the isNaN function to compare with NaN.",
            label_a_b: "Label '{a}' on '{b}' statement.",
            lang: "lang is deprecated.",
            leading_decimal_a: "A leading decimal point can be confused with a dot: '.{a}'.",
            missing_a: "Missing '{a}'.",
            missing_a_after_b: "Missing '{a}' after '{b}'.",
            missing_option: "Missing option value.",
            missing_property: "Missing property name.",
            missing_space_a_b: "Missing space between '{a}' and '{b}'.",
            missing_url: "Missing url.",
            missing_use_strict: "Missing \"use strict\" statement.",
            mixed: "Mixed spaces and tabs.",
            move_invocation: "Move the invocation into the parens that contain the function.",
            move_var: "Move 'var' declarations to the top of the function.",
            name_function: "Missing name in function statement.",
            nested_comment: "Nested comment.",
            not: "Nested not.",
            not_a_constructor: "Do not use {a} as a constructor.",
            not_a_defined: "'{a}' has not been fully defined yet.",
            not_a_function: "'{a}' is not a function.",
            not_a_label: "'{a}' is not a label.",
            not_a_scope: "'{a}' is out of scope.",
            not_greater: "'{a}' should not be greater than '{b}'.",
            parameter_a_get_b: "Unexpected parameter '{a}' in get {b} function.",
            parameter_set_a: "Expected parameter (value) in set {a} function.",
            radix: "Missing radix parameter.",
            read_only: "Read only.",
            redefinition_a: "Redefinition of '{a}'.",
            reserved_a: "Reserved name '{a}'.",
            scanned_a_b: "{a} ({b}% scanned).",
            slash_equal: "A regular expression literal can be confused with '/='.",
            statement_block: "Expected to see a statement and instead saw a block.",
            stopping: "Stopping. ",
            strange_loop: "Strange loop.",
            strict: "Strict violation.",
            subscript: "['{a}'] is better written in dot notation.",
            tag_a_in_b: "A '<{a}>' must be within '<{b}>'.",
            too_long: "Line too long.",
            too_many: "Too many errors.",
            trailing_decimal_a: "A trailing decimal point can be confused with a dot: '.{a}'.",
            type: "type is unnecessary.",
            unclosed: "Unclosed string.",
            unclosed_comment: "Unclosed comment.",
            unclosed_regexp: "Unclosed regular expression.",
            unescaped_a: "Unescaped '{a}'.",
            unexpected_a: "Unexpected '{a}'.",
            unexpected_char_a_b: "Unexpected character '{a}' in {b}.",
            unexpected_comment: "Unexpected comment.",
            unexpected_property_a: "Unexpected /*property*/ '{a}'.",
            unexpected_space_a_b: "Unexpected space between '{a}' and '{b}'.",
            unnecessary_initialize: "It is not necessary to initialize '{a}' to 'undefined'.",
            unnecessary_use: "Unnecessary \"use strict\".",
            unreachable_a_b: "Unreachable '{a}' after '{b}'.",
            unrecognized_style_attribute_a: "Unrecognized style attribute '{a}'.",
            unrecognized_tag_a: "Unrecognized tag '<{a}>'.",
            unsafe: "Unsafe character.",
            url: "JavaScript URL.",
            use_array: "Use the array literal notation [].",
            use_braces: "Spaces are hard to count. Use {{a}}.",
            use_object: "Use the object literal notation {}.",
            used_before_a: "'{a}' was used before it was defined.",
            var_a_not: "Variable {a} was not declared correctly.",
            weird_assignment: "Weird assignment.",
            weird_condition: "Weird condition.",
            weird_new: "Weird construction. Delete 'new'.",
            weird_program: "Weird program.",
            weird_relation: "Weird relation.",
            weird_ternary: "Weird ternary.",
            wrap_immediate: "Wrap an immediate function invocation in parentheses " +
                "to assist the reader in understanding that the expression " +
                "is the result of a function, and not the function itself.",
            wrap_regexp: "Wrap the /regexp/ literal in parens to disambiguate the slash operator.",
            write_is_wrong: "document.write can be a form of eval."
        },
        comments_off,
        css_attribute_data,
        css_any,

        css_colorData = {
            "aliceblue"             : true,
            "antiquewhite"          : true,
            "aqua"                  : true,
            "aquamarine"            : true,
            "azure"                 : true,
            "beige"                 : true,
            "bisque"                : true,
            "black"                 : true,
            "blanchedalmond"        : true,
            "blue"                  : true,
            "blueviolet"            : true,
            "brown"                 : true,
            "burlywood"             : true,
            "cadetblue"             : true,
            "chartreuse"            : true,
            "chocolate"             : true,
            "coral"                 : true,
            "cornflowerblue"        : true,
            "cornsilk"              : true,
            "crimson"               : true,
            "cyan"                  : true,
            "darkblue"              : true,
            "darkcyan"              : true,
            "darkgoldenrod"         : true,
            "darkgray"              : true,
            "darkgreen"             : true,
            "darkkhaki"             : true,
            "darkmagenta"           : true,
            "darkolivegreen"        : true,
            "darkorange"            : true,
            "darkorchid"            : true,
            "darkred"               : true,
            "darksalmon"            : true,
            "darkseagreen"          : true,
            "darkslateblue"         : true,
            "darkslategray"         : true,
            "darkturquoise"         : true,
            "darkviolet"            : true,
            "deeppink"              : true,
            "deepskyblue"           : true,
            "dimgray"               : true,
            "dodgerblue"            : true,
            "firebrick"             : true,
            "floralwhite"           : true,
            "forestgreen"           : true,
            "fuchsia"               : true,
            "gainsboro"             : true,
            "ghostwhite"            : true,
            "gold"                  : true,
            "goldenrod"             : true,
            "gray"                  : true,
            "green"                 : true,
            "greenyellow"           : true,
            "honeydew"              : true,
            "hotpink"               : true,
            "indianred"             : true,
            "indigo"                : true,
            "ivory"                 : true,
            "khaki"                 : true,
            "lavender"              : true,
            "lavenderblush"         : true,
            "lawngreen"             : true,
            "lemonchiffon"          : true,
            "lightblue"             : true,
            "lightcoral"            : true,
            "lightcyan"             : true,
            "lightgoldenrodyellow"  : true,
            "lightgreen"            : true,
            "lightpink"             : true,
            "lightsalmon"           : true,
            "lightseagreen"         : true,
            "lightskyblue"          : true,
            "lightslategray"        : true,
            "lightsteelblue"        : true,
            "lightyellow"           : true,
            "lime"                  : true,
            "limegreen"             : true,
            "linen"                 : true,
            "magenta"               : true,
            "maroon"                : true,
            "mediumaquamarine"      : true,
            "mediumblue"            : true,
            "mediumorchid"          : true,
            "mediumpurple"          : true,
            "mediumseagreen"        : true,
            "mediumslateblue"       : true,
            "mediumspringgreen"     : true,
            "mediumturquoise"       : true,
            "mediumvioletred"       : true,
            "midnightblue"          : true,
            "mintcream"             : true,
            "mistyrose"             : true,
            "moccasin"              : true,
            "navajowhite"           : true,
            "navy"                  : true,
            "oldlace"               : true,
            "olive"                 : true,
            "olivedrab"             : true,
            "orange"                : true,
            "orangered"             : true,
            "orchid"                : true,
            "palegoldenrod"         : true,
            "palegreen"             : true,
            "paleturquoise"         : true,
            "palevioletred"         : true,
            "papayawhip"            : true,
            "peachpuff"             : true,
            "peru"                  : true,
            "pink"                  : true,
            "plum"                  : true,
            "powderblue"            : true,
            "purple"                : true,
            "red"                   : true,
            "rosybrown"             : true,
            "royalblue"             : true,
            "saddlebrown"           : true,
            "salmon"                : true,
            "sandybrown"            : true,
            "seagreen"              : true,
            "seashell"              : true,
            "sienna"                : true,
            "silver"                : true,
            "skyblue"               : true,
            "slateblue"             : true,
            "slategray"             : true,
            "snow"                  : true,
            "springgreen"           : true,
            "steelblue"             : true,
            "tan"                   : true,
            "teal"                  : true,
            "thistle"               : true,
            "tomato"                : true,
            "turquoise"             : true,
            "violet"                : true,
            "wheat"                 : true,
            "white"                 : true,
            "whitesmoke"            : true,
            "yellow"                : true,
            "yellowgreen"           : true,

            "activeborder"          : true,
            "activecaption"         : true,
            "appworkspace"          : true,
            "background"            : true,
            "buttonface"            : true,
            "buttonhighlight"       : true,
            "buttonshadow"          : true,
            "buttontext"            : true,
            "captiontext"           : true,
            "graytext"              : true,
            "highlight"             : true,
            "highlighttext"         : true,
            "inactiveborder"        : true,
            "inactivecaption"       : true,
            "inactivecaptiontext"   : true,
            "infobackground"        : true,
            "infotext"              : true,
            "menu"                  : true,
            "menutext"              : true,
            "scrollbar"             : true,
            "threeddarkshadow"      : true,
            "threedface"            : true,
            "threedhighlight"       : true,
            "threedlightshadow"     : true,
            "threedshadow"          : true,
            "window"                : true,
            "windowframe"           : true,
            "windowtext"            : true
        },

        css_border_style,
        css_break,

        css_lengthData = {
            '%': true,
            'cm': true,
            'em': true,
            'ex': true,
            'in': true,
            'mm': true,
            'pc': true,
            'pt': true,
            'px': true
        },

        css_media,
        css_overflow,

        devel = {
            alert           : false,
            confirm         : false,
            console         : false,
            Debug           : false,
            opera           : false,
            prompt          : false
        },

        escapes = {
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '/' : '\\/',
            '\\': '\\\\'
        },

        funct,          // The current function

        functionicity = [
            'closure', 'exception', 'global', 'label', 'outer', 'unused', 'var'
        ],

        functions,      // All of the functions
        global,         // The global scope
        html_tag = {
            a:        {},
            abbr:     {},
            acronym:  {},
            address:  {},
            applet:   {},
            area:     {empty: true, parent: ' map '},
            article:  {},
            aside:    {},
            audio:    {},
            b:        {},
            base:     {empty: true, parent: ' head '},
            bdo:      {},
            big:      {},
            blockquote: {},
            body:     {parent: ' html noframes '},
            br:       {empty: true},
            button:   {},
            canvas:   {parent: ' body p div th td '},
            caption:  {parent: ' table '},
            center:   {},
            cite:     {},
            code:     {},
            col:      {empty: true, parent: ' table colgroup '},
            colgroup: {parent: ' table '},
            command:  {parent: ' menu '},
            datalist: {},
            dd:       {parent: ' dl '},
            del:      {},
            details:  {},
            dialog:   {},
            dfn:      {},
            dir:      {},
            div:      {},
            dl:       {},
            dt:       {parent: ' dl '},
            em:       {},
            embed:    {},
            fieldset: {},
            figure:   {},
            font:     {},
            footer:   {},
            form:     {},
            frame:    {empty: true, parent: ' frameset '},
            frameset: {parent: ' html frameset '},
            h1:       {},
            h2:       {},
            h3:       {},
            h4:       {},
            h5:       {},
            h6:       {},
            head:     {parent: ' html '},
            header:   {},
            hgroup:   {},
            hr:       {empty: true},
            'hta:application':
                      {empty: true, parent: ' head '},
            html:     {parent: '*'},
            i:        {},
            iframe:   {},
            img:      {empty: true},
            input:    {empty: true},
            ins:      {},
            kbd:      {},
            keygen:   {},
            label:    {},
            legend:   {parent: ' details fieldset figure '},
            li:       {parent: ' dir menu ol ul '},
            link:     {empty: true, parent: ' head '},
            map:      {},
            mark:     {},
            menu:     {},
            meta:     {empty: true, parent: ' head noframes noscript '},
            meter:    {},
            nav:      {},
            noframes: {parent: ' html body '},
            noscript: {parent: ' body head noframes '},
            object:   {},
            ol:       {},
            optgroup: {parent: ' select '},
            option:   {parent: ' optgroup select '},
            output:   {},
            p:        {},
            param:    {empty: true, parent: ' applet object '},
            pre:      {},
            progress: {},
            q:        {},
            rp:       {},
            rt:       {},
            ruby:     {},
            samp:     {},
            script:   {empty: true, parent: ' body div frame head iframe p pre span '},
            section:  {},
            select:   {},
            small:    {},
            span:     {},
            source:   {},
            strong:   {},
            style:    {parent: ' head ', empty: true},
            sub:      {},
            sup:      {},
            table:    {},
            tbody:    {parent: ' table '},
            td:       {parent: ' tr '},
            textarea: {},
            tfoot:    {parent: ' table '},
            th:       {parent: ' tr '},
            thead:    {parent: ' table '},
            time:     {},
            title:    {parent: ' head '},
            tr:       {parent: ' table tbody thead tfoot '},
            tt:       {},
            u:        {},
            ul:       {},
            'var':    {},
            video:    {}
        },

        ids,            // HTML ids
        implied,        // Implied globals
        in_block,
        indent,
        json_mode,
        lines,
        lookahead,
        member,
        node = {
            Buffer       : false,
            clearInterval: false,
            clearTimeout : false,
            console      : false,
            global       : false,
            module       : false,
            process      : false,
            querystring  : false,
            require      : false,
            setInterval  : false,
            setTimeout   : false,
            util         : false,
            __filename   : false,
            __dirname    : false
        },
        properties,
        next_token,
        older_token,
        option,
        predefined,     // Global variables defined by option
        prereg,
        prev_token,
        regexp_flag = {
            g: true,
            i: true,
            m: true
        },
        rhino = {
            defineClass : false,
            deserialize : false,
            gc          : false,
            help        : false,
            load        : false,
            loadClass   : false,
            print       : false,
            quit        : false,
            readFile    : false,
            readUrl     : false,
            runCommand  : false,
            seal        : false,
            serialize   : false,
            spawn       : false,
            sync        : false,
            toint32     : false,
            version     : false
        },

        scope,      // The current scope
        semicolon_coda = {
            ';' : true,
            '"' : true,
            '\'': true,
            ')' : true
        },
        src,
        stack,

// standard contains the global names that are provided by the
// ECMAScript standard.

        standard = {
            Array               : false,
            Boolean             : false,
            Date                : false,
            decodeURI           : false,
            decodeURIComponent  : false,
            encodeURI           : false,
            encodeURIComponent  : false,
            Error               : false,
            'eval'              : false,
            EvalError           : false,
            Function            : false,
            hasOwnProperty      : false,
            isFinite            : false,
            isNaN               : false,
            JSON                : false,
            Math                : false,
            Number              : false,
            Object              : false,
            parseInt            : false,
            parseFloat          : false,
            RangeError          : false,
            ReferenceError      : false,
            RegExp              : false,
            String              : false,
            SyntaxError         : false,
            TypeError           : false,
            URIError            : false
        },

        standard_property = {
            E                   : true,
            LN2                 : true,
            LN10                : true,
            LOG2E               : true,
            LOG10E              : true,
            MAX_VALUE           : true,
            MIN_VALUE           : true,
            NEGATIVE_INFINITY   : true,
            PI                  : true,
            POSITIVE_INFINITY   : true,
            SQRT1_2             : true,
            SQRT2               : true
        },

        strict_mode,
        syntax = {},
        tab,
        token,
        urls,
        var_mode,
        warnings,

// widget contains the global names which are provided to a Yahoo
// (fna Konfabulator) widget.

        widget = {
            alert                   : true,
            animator                : true,
            appleScript             : true,
            beep                    : true,
            bytesToUIString         : true,
            Canvas                  : true,
            chooseColor             : true,
            chooseFile              : true,
            chooseFolder            : true,
            closeWidget             : true,
            COM                     : true,
            convertPathToHFS        : true,
            convertPathToPlatform   : true,
            CustomAnimation         : true,
            escape                  : true,
            FadeAnimation           : true,
            filesystem              : true,
            Flash                   : true,
            focusWidget             : true,
            form                    : true,
            FormField               : true,
            Frame                   : true,
            HotKey                  : true,
            Image                   : true,
            include                 : true,
            isApplicationRunning    : true,
            iTunes                  : true,
            konfabulatorVersion     : true,
            log                     : true,
            md5                     : true,
            MenuItem                : true,
            MoveAnimation           : true,
            openURL                 : true,
            play                    : true,
            Point                   : true,
            popupMenu               : true,
            preferenceGroups        : true,
            preferences             : true,
            print                   : true,
            prompt                  : true,
            random                  : true,
            Rectangle               : true,
            reloadWidget            : true,
            ResizeAnimation         : true,
            resolvePath             : true,
            resumeUpdates           : true,
            RotateAnimation         : true,
            runCommand              : true,
            runCommandInBg          : true,
            saveAs                  : true,
            savePreferences         : true,
            screen                  : true,
            ScrollBar               : true,
            showWidgetPreferences   : true,
            sleep                   : true,
            speak                   : true,
            Style                   : true,
            suppressUpdates         : true,
            system                  : true,
            tellWidget              : true,
            Text                    : true,
            TextArea                : true,
            Timer                   : true,
            unescape                : true,
            updateNow               : true,
            URL                     : true,
            Web                     : true,
            widget                  : true,
            Window                  : true,
            XMLDOM                  : true,
            XMLHttpRequest          : true,
            yahooCheckLogin         : true,
            yahooLogin              : true,
            yahooLogout             : true
        },

        windows = {
            ActiveXObject: false,
            CScript      : false,
            Debug        : false,
            Enumerator   : false,
            System       : false,
            VBArray      : false,
            WScript      : false
        },

//  xmode is used to adapt to the exceptions in html parsing.
//  It can have these states:
//      false   .js script file
//      html
//      outer
//      script
//      style
//      scriptstring
//      styleproperty

        xmode,
        xquote,

// Regular expressions. Some of these are stupidly long.

// unsafe comment or string
        ax = /@cc|<\/?|script|\]\s*\]|<\s*!|&lt/i,
// unsafe characters that are silently deleted by one or more browsers
        cx = /[\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/,
// query characters for ids
        dx = /[\[\]\/\\"'*<>.&:(){}+=#]/,
// html token
        hx = /^\s*(['"=>\/&#]|<(?:\/|\!(?:--)?)?|[a-zA-Z][a-zA-Z0-9_\-:]*|[0-9]+|--)/,
// identifier
        ix = /^([a-zA-Z_$][a-zA-Z0-9_$]*)$/,
// javascript url
        jx = /^(?:javascript|jscript|ecmascript|vbscript|mocha|livescript)\s*:/i,
// star slash
        lx = /\*\/|\/\*/,
// characters in strings that need escapement
        nx = /[\u0000-\u001f"\\\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
// outer html token
        ox = /[>&]|<[\/!]?|--/,
// attributes characters
        qx = /[^a-zA-Z0-9+\-_\/ ]/,
// style
        sx = /^\s*([{:#%.=,>+\[\]@()"';]|\*=?|\$=|\|=|\^=|~=|[a-zA-Z_][a-zA-Z0-9_\-]*|[0-9]+|<\/|\/\*)/,
        ssx = /^\s*([@#!"'};:\-%.=,+\[\]()*_]|[a-zA-Z][a-zA-Z0-9._\-]*|\/\*?|\d+(?:\.\d+)?|<\/)/,
// token
        tx = /^\s*([(){}\[.,:;'"~\?\]#@]|==?=?|\/(\*(jslint|properties|property|members?|globals?)?|=|\/)?|\*[\/=]?|\+(?:=|\++)?|-(?:=|-+)?|%=?|&[&=]?|\|[|=]?|>>?>?=?|<([\/=!]|\!(\[|--)?|<=?)?|\^=?|\!=?=?|[a-zA-Z_$][a-zA-Z0-9_$]*|[0-9]+([xX][0-9a-fA-F]+|\.[0-9]*)?([eE][+\-]?[0-9]+)?)/,
// url badness
        ux = /&|\+|\u00AD|\.\.|\/\*|%[^;]|base64|url|expression|data|mailto/i,

        rx = {
            outer: hx,
            html: hx,
            style: sx,
            styleproperty: ssx
        };


    function return_this() {
        return this;
    }

    function F() {}     // Used by Object.create

// Provide critical ES5 functions to ES3.

    if (typeof Array.prototype.filter !== 'function') {
        Array.prototype.filter = function (f) {
            var i, length = this.length, result = [];
            for (i = 0; i < length; i += 1) {
                try {
                    result.push(f(this[i]));
                } catch (ignore) {
                }
            }
            return result;
        };
    }

    if (typeof Array.isArray !== 'function') {
        Array.isArray = function (o) {
            return Object.prototype.toString.apply(o) === '[object Array]';
        };
    }

    if (!Object.hasOwnProperty('create')) {
        Object.create = function (o) {
            F.prototype = o;
            return new F();
        };
    }

    if (typeof Object.keys !== 'function') {
        Object.keys = function (o) {
            var array = [], key;
            for (key in o) {
                if (Object.prototype.hasOwnProperty.call(o, key)) {
                    array.push(key);
                }
            }
            return array;
        };
    }

// Substandard methods

    if (typeof String.prototype.entityify !== 'function') {
        String.prototype.entityify = function () {
            return this
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        };
    }

    if (typeof String.prototype.isAlpha !== 'function') {
        String.prototype.isAlpha = function () {
            return (this >= 'a' && this <= 'z\uffff') ||
                (this >= 'A' && this <= 'Z\uffff');
        };
    }

    if (typeof String.prototype.isDigit !== 'function') {
        String.prototype.isDigit = function () {
            return (this >= '0' && this <= '9');
        };
    }

    if (typeof String.prototype.supplant !== 'function') {
        String.prototype.supplant = function (o) {
            return this.replace(/\{([^{}]*)\}/g, function (a, b) {
                var replacement = o[b];
                return typeof replacement === 'string' ||
                    typeof replacement === 'number' ? replacement : a;
            });
        };
    }


    function sanitize(a) {

//  Escapify a troublesome character.

        return escapes[a] ? escapes[a] :
            '\\u' + ('0000' + a.charCodeAt().toString(16)).slice(-4);
    }


    function combine(a, b) {
        var name;
        for (name in b) {
            if (Object.prototype.hasOwnProperty.call(b, name)) {
                a[name] = b[name];
            }
        }
    }

    function assume() {
        if (!option.safe) {
            if (option.rhino) {
                combine(predefined, rhino);
            }
            if (option.devel) {
                combine(predefined, devel);
            }
            if (option.browser) {
                combine(predefined, browser);
            }
            if (option.windows) {
                combine(predefined, windows);
            }
            if (option.node) {
                combine(predefined, node);
            }
            if (option.widget) {
                combine(predefined, widget);
            }
        }
    }


// Produce an error warning.

    function quit(message, line, character) {
        throw {
            name: 'JSLintError',
            line: line,
            character: character,
            message: bundle.scanned_a_b.supplant({
                a: message,
                b: Math.floor((line / lines.length) * 100)
            })
        };
    }

    function warn(message, offender, a, b, c, d) {
        var character, line, warning;
        offender = offender || next_token;  // `~
        line = offender.line || 0;
        character = offender.from || 0;
        warning = {
            id: '(error)',
            raw: bundle[message] || message,
            evidence: lines[line - 1] || '',
            line: line,
            character: character,
            a: a || offender.value,
            b: b,
            c: c,
            d: d
        };
        warning.reason = warning.raw.supplant(warning);
        JSLINT.errors.push(warning);
        if (option.passfail) {
            quit(bundle.stopping, line, character);
        }
        warnings += 1;
        if (warnings >= option.maxerr) {
            quit(bundle.too_many, line, character);
        }
        return warning;
    }

    function warn_at(message, line, character, a, b, c, d) {
        return warn(message, {
            line: line,
            from: character
        }, a, b, c, d);
    }

    function stop(message, offender, a, b, c, d) {
        var warning = warn(message, offender, a, b, c, d);
        quit(bundle.stopping, warning.line, warning.character);
    }

    function stop_at(message, line, character, a, b, c, d) {
        return stop(message, {
            line: line,
            from: character
        }, a, b, c, d);
    }

    function expected_at(at) {
        if (option.white && next_token.from !== at) {
            warn('expected_a_at_b_c', next_token, next_token.value, at,
                next_token.from);
        }
    }

    function aint(it, name, expected) {
        if (it[name] !== expected) {
            warn('expected_a_b', it, expected, it[name]);
            return true;
        } else {
            return false;
        }
    }


// lexical analysis and token construction

    var lex = (function lex() {
        var character, from, line, source_row;

// Private lex methods

        function collect_comment(comment, quote, line, at) {
            var comment_object = {
                comment: comment,
                quote: quote,
                at: at,
                line: line
            };
            if (comments_off || src || (xmode && xmode !== 'script' &&
                    xmode !== 'style' && xmode !== 'styleproperty')) {
                warn_at('unexpected_comment', line, character);
            } else if (xmode === 'script' && /<\//i.test(source_row)) {
                warn_at('unexpected_a', line, character, '<\/');
            } else if (option.safe && ax.test(comment)) {
                warn_at('dangerous_comment', line, at);
            }
            if (older_token.comments) {
                older_token.comments.push(comment_object);
            } else {
                older_token.comments = [comment_object];
            }
            JSLINT.comments.push(comment_object);
        }

        function next_line() {
            var at;
            if (line >= lines.length) {
                return false;
            }
            character = 1;
            source_row = lines[line];
            line += 1;
            at = source_row.search(/ \t/);
            if (at >= 0) {
                warn_at('mixed', line, at + 1);
            }
            source_row = source_row.replace(/\t/g, tab);
            at = source_row.search(cx);
            if (at >= 0) {
                warn_at('unsafe', line, at);
            }
            if (option.maxlen && option.maxlen < source_row.length) {
                warn_at('too_long', line, source_row.length);
            }
            return true;
        }

// Produce a token object.  The token inherits from a syntax symbol.

        function it(type, value, quote) {
            var id, the_token;
            if (type === '(string)' || type === '(range)') {
                if (jx.test(value)) {
                    warn_at('url', line, from);
                }
            }
            the_token = Object.create(syntax[(
                type === '(punctuator)' ||
                    (type === '(identifier)' &&
                    Object.prototype.hasOwnProperty.call(syntax, value)) ?
                value :
                type
            )] || syntax['(error)']);
            if (type === '(identifier)') {
                the_token.identifier = true;
                if (value === '__iterator__' || value === '__proto__') {
                    stop_at('reserved_a', line, from, value);
                } else if (option.nomen &&
                        (value.charAt(0) === '_' ||
                        value.charAt(value.length - 1) === '_')) {
                    warn_at('dangling_a', line, from, value);
                }
            }
            if (value !== undefined) {
                the_token.value = value;
            }
            if (quote) {
                the_token.quote = quote;
            }
            the_token.line = line;
            the_token.from = from;
            the_token.thru = character;
            the_token.prev = older_token;
            id = the_token.id;
            prereg = id && (
                ('(,=:[!&|?{};'.indexOf(id.charAt(id.length - 1)) >= 0) ||
                id === 'return'
            );
            older_token.next = the_token;
            older_token = the_token;
            return the_token;
        }

// Public lex methods

        return {
            init: function (source) {
                if (typeof source === 'string') {
                    lines = source
                        .replace(/\r\n/g, '\n')
                        .replace(/\r/g, '\n')
                        .split('\n');
                } else {
                    lines = source;
                }
                line = 0;
                next_line();
                from = 1;
            },

            range: function (begin, end) {
                var c, value = '';
                from = character;
                if (source_row.charAt(0) !== begin) {
                    stop_at('expected_a_b', line, character, begin,
                        source_row.charAt(0));
                }
                for (;;) {
                    source_row = source_row.slice(1);
                    character += 1;
                    c = source_row.charAt(0);
                    switch (c) {
                    case '':
                        stop_at('missing_a', line, character, c);
                        break;
                    case end:
                        source_row = source_row.slice(1);
                        character += 1;
                        return it('(range)', value);
                    case xquote:
                    case '\\':
                        warn_at('unexpected_a', line, character, c);
                        break;
                    }
                    value += c;
                }
            },

// token -- this is called by advance to get the next token.

            token: function () {
                var b, c, captures, digit, depth, flag, high, i, j, length, low, quote, symbol;

                function match(x) {
                    var exec = x.exec(source_row), first;
                    if (exec) {
                        length = exec[0].length;
                        first = exec[1];
                        c = first.charAt(0);
                        source_row = source_row.substr(length);
                        from = character + length - first.length;
                        character += length;
                        return first;
                    }
                }

                function string(x) {
                    var c, j, r = '';

                    function hex(n) {
                        var i = parseInt(source_row.substr(j + 1, n), 16);
                        j += n;
                        if (i >= 32 && i <= 126 &&
                                i !== 34 && i !== 92 && i !== 39) {
                            warn_at('unexpected_a', line, character, '\\');
                        }
                        character += n;
                        c = String.fromCharCode(i);
                    }

                    if (json_mode && x !== '"') {
                        warn_at('expected_a', line, character, '"');
                    }

                    if (xquote === x || (xmode === 'scriptstring' && !xquote)) {
                        return it('(punctuator)', x);
                    }

                    j = 0;
                    for (;;) {
                        while (j >= source_row.length) {
                            j = 0;
                            if (xmode !== 'html' || !next_line()) {
                                stop_at('unclosed', line, from);
                            }
                        }
                        c = source_row.charAt(j);
                        if (c === x) {
                            character += 1;
                            source_row = source_row.substr(j + 1);
                            return it('(string)', r, x);
                        }
                        if (c < ' ') {
                            if (c === '\n' || c === '\r') {
                                break;
                            }
                            warn_at('control_a',
                                line, character + j, source_row.slice(0, j));
                        } else if (c === xquote) {
                            warn_at('bad_html', line, character + j);
                        } else if (c === '<') {
                            if (option.safe && xmode === 'html') {
                                warn_at('adsafe_a', line, character + j, c);
                            } else if (source_row.charAt(j + 1) === '/' && (xmode || option.safe)) {
                                warn_at('expected_a_b', line, character,
                                    '<\\/', '</');
                            } else if (source_row.charAt(j + 1) === '!' && (xmode || option.safe)) {
                                warn_at('unexpected_a', line, character, '<!');
                            }
                        } else if (c === '\\') {
                            if (xmode === 'html') {
                                if (option.safe) {
                                    warn_at('adsafe_a', line, character + j, c);
                                }
                            } else if (xmode === 'styleproperty') {
                                j += 1;
                                character += 1;
                                c = source_row.charAt(j);
                                if (c !== x) {
                                    warn_at('unexpected_a', line, character, '\\');
                                }
                            } else {
                                j += 1;
                                character += 1;
                                c = source_row.charAt(j);
                                switch (c) {
                                case xquote:
                                    warn_at('bad_html', line, character + j);
                                    break;
                                case '\\':
                                case '"':
                                case '/':
                                    break;
                                case '\'':
                                    if (json_mode) {
                                        warn_at('unexpected_a', line, character, '\\\'');
                                    }
                                    break;
                                case 'b':
                                    c = '\b';
                                    break;
                                case 'f':
                                    c = '\f';
                                    break;
                                case 'n':
                                    c = '\n';
                                    break;
                                case 'r':
                                    c = '\r';
                                    break;
                                case 't':
                                    c = '\t';
                                    break;
                                case 'u':
                                    hex(4);
                                    break;
                                case 'v':
                                    if (json_mode) {
                                        warn_at('unexpected_a', line, character, '\\v');
                                    }
                                    c = '\v';
                                    break;
                                case 'x':
                                    if (json_mode) {
                                        warn_at('unexpected_a', line, character, '\\x');
                                    }
                                    hex(2);
                                    break;
                                default:
                                    warn_at('unexpected_a', line, character, '\\');
                                }
                            }
                        }
                        r += c;
                        character += 1;
                        j += 1;
                    }
                }

                for (;;) {
                    while (!source_row) {
                        if (!next_line()) {
                            return it('(end)');
                        }
                    }
                    while (xmode === 'outer') {
                        i = source_row.search(ox);
                        if (i === 0) {
                            break;
                        } else if (i > 0) {
                            character += 1;
                            source_row = source_row.slice(i);
                            break;
                        } else {
                            if (!next_line()) {
                                return it('(end)', '');
                            }
                        }
                    }
                    symbol = match(rx[xmode] || tx);
                    if (!symbol) {
                        symbol = '';
                        c = '';
                        while (source_row && source_row < '!') {
                            source_row = source_row.substr(1);
                        }
                        if (source_row) {
                            if (xmode === 'html') {
                                return it('(error)', source_row.charAt(0));
                            } else {
                                stop_at('unexpected_a',
                                    line, character, source_row.substr(0, 1));
                            }
                        }
                    } else {

//      identifier

                        if (c.isAlpha() || c === '_' || c === '$') {
                            return it('(identifier)', symbol);
                        }

//      number

                        if (c.isDigit()) {
                            if (xmode !== 'style' &&
                                    xmode !== 'styleproperty' &&
                                    source_row.substr(0, 1).isAlpha()) {
                                warn_at('expected_space_a_b',
                                    line, character, c, source_row.charAt(0));
                            }
                            if (c === '0') {
                                digit = symbol.substr(1, 1);
                                if (digit.isDigit()) {
                                    if (token.id !== '.' && xmode !== 'styleproperty') {
                                        warn_at('unexpected_a',
                                            line, character, symbol);
                                    }
                                } else if (json_mode && (digit === 'x' || digit === 'X')) {
                                    warn_at('unexpected_a', line, character, '0x');
                                }
                            }
                            if (symbol.substr(symbol.length - 1) === '.') {
                                warn_at('trailing_decimal_a', line,
                                    character, symbol);
                            }
                            if (xmode !== 'style') {
                                digit = +symbol;
                                if (!isFinite(digit)) {
                                    warn_at('bad_number', line, character, symbol);
                                }
                                symbol = digit;
                            }
                            return it('(number)', symbol);
                        }
                        switch (symbol) {

//      string

                        case '"':
                        case "'":
                            return string(symbol);

//      // comment

                        case '//':
                            collect_comment(source_row, '//', line, character);
                            source_row = '';
                            break;

//      /* comment

                        case '/*':
                            quote = '/*';
                            for (;;) {
                                i = source_row.search(lx);
                                if (i >= 0) {
                                    break;
                                }
                                collect_comment(source_row, quote, line, character);
                                quote = '';
                                if (!next_line()) {
                                    stop_at('unclosed_comment', line, character);
                                }
                            }
                            collect_comment(source_row.slice(0, i), quote, character, line);
                            character += i + 2;
                            if (source_row.substr(i, 1) === '/') {
                                stop_at('nested_comment', line, character);
                            }
                            source_row = source_row.substr(i + 2);
                            break;

                        case '':
                            break;
//      /
                        case '/':
                            if (token.id === '/=') {
                                stop_at(
                                    bundle.slash_equal,
                                    line,
                                    from
                                );
                            }
                            if (prereg) {
                                depth = 0;
                                captures = 0;
                                length = 0;
                                for (;;) {
                                    b = true;
                                    c = source_row.charAt(length);
                                    length += 1;
                                    switch (c) {
                                    case '':
                                        stop_at('unclosed_regexp', line, from);
                                        return;
                                    case '/':
                                        if (depth > 0) {
                                            warn_at('unescaped_a',
                                                line, from + length, '/');
                                        }
                                        c = source_row.substr(0, length - 1);
                                        flag = Object.create(regexp_flag);
                                        while (flag[source_row.charAt(length)] === true) {
                                            flag[source_row.charAt(length)] = false;
                                            length += 1;
                                        }
                                        if (source_row.charAt(length).isAlpha()) {
                                            stop_at('unexpected_a',
                                                line, from, source_row.charAt(length));
                                        }
                                        character += length;
                                        source_row = source_row.substr(length);
                                        quote = source_row.charAt(0);
                                        if (quote === '/' || quote === '*') {
                                            stop_at('confusing_regexp',
                                                line, from);
                                        }
                                        return it('(regexp)', c);
                                    case '\\':
                                        c = source_row.charAt(length);
                                        if (c < ' ') {
                                            warn_at('control_a',
                                                line, from + length, String(c));
                                        } else if (c === '<') {
                                            warn_at(
                                                bundle.unexpected_a,
                                                line,
                                                from + length,
                                                '\\'
                                            );
                                        }
                                        length += 1;
                                        break;
                                    case '(':
                                        depth += 1;
                                        b = false;
                                        if (source_row.charAt(length) === '?') {
                                            length += 1;
                                            switch (source_row.charAt(length)) {
                                            case ':':
                                            case '=':
                                            case '!':
                                                length += 1;
                                                break;
                                            default:
                                                warn_at(
                                                    bundle.expected_a_b,
                                                    line,
                                                    from + length,
                                                    ':',
                                                    source_row.charAt(length)
                                                );
                                            }
                                        } else {
                                            captures += 1;
                                        }
                                        break;
                                    case '|':
                                        b = false;
                                        break;
                                    case ')':
                                        if (depth === 0) {
                                            warn_at('unescaped_a',
                                                line, from + length, ')');
                                        } else {
                                            depth -= 1;
                                        }
                                        break;
                                    case ' ':
                                        j = 1;
                                        while (source_row.charAt(length) === ' ') {
                                            length += 1;
                                            j += 1;
                                        }
                                        if (j > 1) {
                                            warn_at('use_braces',
                                                line, from + length, j);
                                        }
                                        break;
                                    case '[':
                                        c = source_row.charAt(length);
                                        if (c === '^') {
                                            length += 1;
                                            if (option.regexp) {
                                                warn_at('insecure_a',
                                                    line, from + length, c);
                                            } else if (source_row.charAt(length) === ']') {
                                                stop_at('unescaped_a',
                                                    line, from + length, '^');
                                            }
                                        }
                                        quote = false;
                                        if (c === ']') {
                                            warn_at('empty_class', line,
                                                from + length - 1);
                                            quote = true;
                                        }
klass:                                  do {
                                            c = source_row.charAt(length);
                                            length += 1;
                                            switch (c) {
                                            case '[':
                                            case '^':
                                                warn_at('unescaped_a',
                                                    line, from + length, c);
                                                quote = true;
                                                break;
                                            case '-':
                                                if (quote) {
                                                    quote = false;
                                                } else {
                                                    warn_at('unescaped_a',
                                                        line, from + length, '-');
                                                    quote = true;
                                                }
                                                break;
                                            case ']':
                                                if (!quote) {
                                                    warn_at('unescaped_a',
                                                        line, from + length - 1, '-');
                                                }
                                                break klass;
                                            case '\\':
                                                c = source_row.charAt(length);
                                                if (c < ' ') {
                                                    warn_at(
                                                        bundle.control_a,
                                                        line,
                                                        from + length,
                                                        String(c)
                                                    );
                                                } else if (c === '<') {
                                                    warn_at(
                                                        bundle.unexpected_a,
                                                        line,
                                                        from + length,
                                                        '\\'
                                                    );
                                                }
                                                length += 1;
                                                quote = true;
                                                break;
                                            case '/':
                                                warn_at('unescaped_a',
                                                    line, from + length - 1, '/');
                                                quote = true;
                                                break;
                                            case '<':
                                                if (xmode === 'script') {
                                                    c = source_row.charAt(length);
                                                    if (c === '!' || c === '/') {
                                                        warn_at(
                                                            bundle.html_confusion_a,
                                                            line,
                                                            from + length,
                                                            c
                                                        );
                                                    }
                                                }
                                                quote = true;
                                                break;
                                            default:
                                                quote = true;
                                            }
                                        } while (c);
                                        break;
                                    case '.':
                                        if (option.regexp) {
                                            warn_at('insecure_a', line,
                                                from + length, c);
                                        }
                                        break;
                                    case ']':
                                    case '?':
                                    case '{':
                                    case '}':
                                    case '+':
                                    case '*':
                                        warn_at('unescaped_a', line,
                                            from + length, c);
                                        break;
                                    case '<':
                                        if (xmode === 'script') {
                                            c = source_row.charAt(length);
                                            if (c === '!' || c === '/') {
                                                warn_at(
                                                    bundle.html_confusion_a,
                                                    line,
                                                    from + length,
                                                    c
                                                );
                                            }
                                        }
                                        break;
                                    }
                                    if (b) {
                                        switch (source_row.charAt(length)) {
                                        case '?':
                                        case '+':
                                        case '*':
                                            length += 1;
                                            if (source_row.charAt(length) === '?') {
                                                length += 1;
                                            }
                                            break;
                                        case '{':
                                            length += 1;
                                            c = source_row.charAt(length);
                                            if (c < '0' || c > '9') {
                                                warn_at(
                                                    bundle.expected_number_a,
                                                    line,
                                                    from + length,
                                                    c
                                                );
                                            }
                                            length += 1;
                                            low = +c;
                                            for (;;) {
                                                c = source_row.charAt(length);
                                                if (c < '0' || c > '9') {
                                                    break;
                                                }
                                                length += 1;
                                                low = +c + (low * 10);
                                            }
                                            high = low;
                                            if (c === ',') {
                                                length += 1;
                                                high = Infinity;
                                                c = source_row.charAt(length);
                                                if (c >= '0' && c <= '9') {
                                                    length += 1;
                                                    high = +c;
                                                    for (;;) {
                                                        c = source_row.charAt(length);
                                                        if (c < '0' || c > '9') {
                                                            break;
                                                        }
                                                        length += 1;
                                                        high = +c + (high * 10);
                                                    }
                                                }
                                            }
                                            if (source_row.charAt(length) !== '}') {
                                                warn_at(
                                                    bundle.expected_a_b,
                                                    line,
                                                    from + length,
                                                    '}',
                                                    c
                                                );
                                            } else {
                                                length += 1;
                                            }
                                            if (source_row.charAt(length) === '?') {
                                                length += 1;
                                            }
                                            if (low > high) {
                                                warn_at(
                                                    bundle.not_greater,
                                                    line,
                                                    from + length,
                                                    low,
                                                    high
                                                );
                                            }
                                            break;
                                        }
                                    }
                                }
                                c = source_row.substr(0, length - 1);
                                character += length;
                                source_row = source_row.substr(length);
                                return it('(regexp)', c);
                            }
                            return it('(punctuator)', symbol);

//      punctuator

                        case '<!--':
                            length = line;
                            c = character;
                            for (;;) {
                                i = source_row.indexOf('--');
                                if (i >= 0) {
                                    break;
                                }
                                i = source_row.indexOf('<!');
                                if (i >= 0) {
                                    stop_at('nested_comment',
                                        line, character + i);
                                }
                                if (!next_line()) {
                                    stop_at('unclosed_comment', length, c);
                                }
                            }
                            length = source_row.indexOf('<!');
                            if (length >= 0 && length < i) {
                                stop_at('nested_comment',
                                    line, character + length);
                            }
                            character += i;
                            if (source_row.charAt(i + 2) !== '>') {
                                stop_at('expected_a', line, character, '-->');
                            }
                            character += 3;
                            source_row = source_row.slice(i + 3);
                            break;
                        case '#':
                            if (xmode === 'html' || xmode === 'styleproperty') {
                                for (;;) {
                                    c = source_row.charAt(0);
                                    if ((c < '0' || c > '9') &&
                                            (c < 'a' || c > 'f') &&
                                            (c < 'A' || c > 'F')) {
                                        break;
                                    }
                                    character += 1;
                                    source_row = source_row.substr(1);
                                    symbol += c;
                                }
                                if (symbol.length !== 4 && symbol.length !== 7) {
                                    warn_at('bad_color_a', line,
                                        from + length, symbol);
                                }
                                return it('(color)', symbol);
                            }
                            return it('(punctuator)', symbol);

                        default:
                            if (xmode === 'outer' && c === '&') {
                                character += 1;
                                source_row = source_row.substr(1);
                                for (;;) {
                                    c = source_row.charAt(0);
                                    character += 1;
                                    source_row = source_row.substr(1);
                                    if (c === ';') {
                                        break;
                                    }
                                    if (!((c >= '0' && c <= '9') ||
                                            (c >= 'a' && c <= 'z') ||
                                            c === '#')) {
                                        stop_at('bad_entity', line, from + length,
                                            character);
                                    }
                                }
                                break;
                            }
                            return it('(punctuator)', symbol);
                        }
                    }
                }
            }
        };
    }());


    function add_label(symbol, type) {

        if (option.safe && funct['(global)'] &&
                typeof predefined[symbol] !== 'boolean') {
            warn('adsafe_a', token, symbol);
        } else if (symbol === 'hasOwnProperty') {
            warn('bad_name_a', token, symbol);
        }

// Define symbol in the current function in the current scope.

        if (Object.prototype.hasOwnProperty.call(funct, symbol) && !funct['(global)']) {
            warn(funct[symbol] === true ?
                bundle.used_before_a :
                bundle.already_defined,
                next_token, symbol);
        }
        funct[symbol] = type;
        if (funct['(global)']) {
            if (global[symbol] === false) {
                warn('read_only');
            }
            global[symbol] = true;
            if (Object.prototype.hasOwnProperty.call(implied, symbol)) {
                warn('used_before_a', next_token, symbol);
                delete implied[symbol];
            }
        } else {
            scope[symbol] = funct;
        }
    }


    function peek(distance) {

// Peek ahead to a future token. The distance is how far ahead to look. The
// default is the next token.

        var found, slot = 0;

        distance = distance || 0;
        while (slot <= distance) {
            found = lookahead[slot];
            if (!found) {
                found = lookahead[slot] = lex.token();
            }
            slot += 1;
        }
        return found;
    }


    function discard(it) {

// The token will not be included in the parse tree, so move the comments
// that are attached to the token to tokens that are in the tree.

        it = it || token;
        if (it.comments) {
            var prev = it.prev;
            while (prev.comments === null) {
                prev = prev.prev;
            }
            if (prev.comments) {
                prev.comments = prev.comments.concat(it.comments);
            } else {
                prev.comments = it.comments;
            }
        }
        it.comments = null;
    }


    function advance(id, match) {

// Produce the next token, also looking for programming errors.

        if (indent) {

// In indentation checking was requested, then inspect all of the line breakings.
// The var statement is tricky because the names might be aligned or not. We
// look at the first line break after the var to determine the programmer's
// intention.

            if (var_mode && next_token.line !== token.line) {
                if ((var_mode !== indent || !next_token.edge) &&
                        next_token.from === indent.at -
                        (next_token.edge ? option.indent : 0)) {
                    var dent = indent;
                    for (;;) {
                        dent.at -= option.indent;
                        if (dent === var_mode) {
                            break;
                        }
                        dent = dent.was;
                    }
                    dent.open = false;
                }
                var_mode = false;
            }
            if (indent.open) {

// If the token is an edge.

                if (next_token.edge) {
                    if (next_token.edge === 'label') {
                        expected_at(1);
                    } else if (next_token.edge === 'case') {
                        expected_at(indent.at - option.indent);
                    } else if (indent.mode !== 'array' || next_token.line !== token.line) {
                        expected_at(indent.at);
                    }

// If the token is not an edge, but is the first token on the line.

                } else if (next_token.line !== token.line) {
                    if (next_token.from < indent.at + (indent.mode ===
                            'expression' ? 0 : option.indent)) {
                        expected_at(indent.at + option.indent);
                    }
                    indent.wrap = true;
                }
            } else if (next_token.line !== token.line) {
                if (next_token.edge) {
                    expected_at(indent.at);
                } else {
                    indent.wrap = true;
                    if (indent.mode === 'statement' || indent.mode === 'var') {
                        expected_at(indent.at + option.indent);
                    } else if (next_token.from < indent.at + (indent.mode ===
                            'expression' ? 0 : option.indent)) {
                        expected_at(indent.at + option.indent);
                    }
                }
            }
        }

        switch (token.id) {
        case '(number)':
            if (next_token.id === '.') {
                warn('trailing_decimal_a');
            }
            break;
        case '-':
            if (next_token.id === '-' || next_token.id === '--') {
                warn('confusing_a');
            }
            break;
        case '+':
            if (next_token.id === '+' || next_token.id === '++') {
                warn('confusing_a');
            }
            break;
        }
        if (token.arity === 'string' || token.identifier) {
            anonname = token.value;
        }

        if (id && next_token.id !== id) {
            if (match) {
                warn('expected_a_b_from_c_d', next_token, id,
                    match.id, match.line, next_token.value);
            } else if (!next_token.identifier || next_token.value !== id) {
                warn('expected_a_b', next_token, id, next_token.value);
            }
        }
        prev_token = token;
        token = next_token;
        next_token = lookahead.shift() || lex.token();
        if (token.id === '(end)') {
            discard();
        }
    }


    function directive() {
        var command = this.id,
            name,
            old_comments_off = comments_off,
            old_option_white = option.white,
            value;
        if (next_token.line === token.line && next_token.from === token.thru) {
            warn('missing_space_a_b', next_token, token.value, next_token.value);
        }
        comments_off = true;
        option.white = false;
        if (lookahead.length > 0 || next_token.comments) {
            warn('unexpected_a', this);
        }
        switch (command) {
        case '/*properties':
        case '/*property':
        case '/*members':
        case '/*member':
            command = '/*properties';
            if (!properties) {
                properties = {};
            }
            break;
        case '/*jslint':
            if (option.safe) {
                warn('adsafe_a', this);
            }
            break;
        case '/*globals':
        case '/*global':
            command = '/*global';
            if (option.safe) {
                warn('adsafe_a', this);
            }
            break;
        default:
            stop('unpexpected_a', this);
        }
loop:   for (;;) {
            for (;;) {
                if (next_token.id === '*/') {
                    break loop;
                }
                if (next_token.id !== ',') {
                    break;
                }
                advance();
            }
            if (next_token.arity !== 'string' && !next_token.identifier) {
                stop('unexpected_a', next_token);
            }
            name = next_token.value;
            advance();
            switch (command) {
            case '/*global':
                if (next_token.id === ':') {
                    advance(':');
                    switch (next_token.id) {
                    case 'true':
                        if (typeof scope[name] === 'object' ||
                                global[name] === false) {
                            stop('unexpected_a');
                        }
                        global[name] = true;
                        advance('true');
                        break;
                    case 'false':
                        if (typeof scope[name] === 'object') {
                            stop('unexpected_a');
                        }
                        global[name] = false;
                        advance('false');
                        break;
                    default:
                        stop('unexpected_a');
                    }
                } else {
                    if (typeof scope[name] === 'object') {
                        stop('unexpected_a');
                    }
                    global[name] = false;
                }
                break;
            case '/*jslint':
                if (next_token.id !== ':') {
                    stop('expected_a_b', next_token, ':', next_token.value);
                }
                advance(':');
                switch (name) {
                case 'indent':
                    value = +next_token.value;
                    if (typeof value !== 'number' ||
                            !isFinite(value) || value < 0 ||
                            Math.floor(value) !== value) {
                        stop('expected_small_a');
                    }
                    if (value > 0) {
                        old_option_white = true;
                    }
                    option.indent = value;
                    break;
                case 'maxerr':
                    value = +next_token.value;
                    if (typeof value !== 'number' ||
                            !isFinite(value) ||
                            value <= 0 ||
                            Math.floor(value) !== value) {
                        stop('expected_small_a', next_token);
                    }
                    option.maxerr = value;
                    break;
                case 'maxlen':
                    value = +next_token.value;
                    if (typeof value !== 'number' || !isFinite(value) || value < 0 ||
                            Math.floor(value) !== value) {
                        stop('expected_small_a');
                    }
                    option.maxlen = value;
                    break;
                case 'white':
                    if (next_token.id === 'true') {
                        old_option_white = true;
                    } else if (next_token.id === 'false') {
                        old_option_white = false;
                    } else {
                        stop('unexpected_a');
                    }
                    break;
                default:
                    if (next_token.id === 'true') {
                        option[name] = true;
                    } else if (next_token.id === 'false') {
                        option[name] = false;
                    } else {
                        stop('unexpected_a');
                    }
                }
                advance();
                break;
            case '/*properties':
                properties[name] = true;
                break;
            default:
                stop('unexpected_a');
            }
        }
        if (command === '/*jslint') {
            assume();
        }
        comments_off = old_comments_off;
        advance('*/');
        option.white = old_option_white;
    }


// Indentation intention

    function edge(mode) {
        next_token.edge = !indent || (indent.open && (mode || true));
    }


    function step_in(mode) {
        var open, was;
        if (typeof mode === 'number') {
            indent = {
                at: mode,
                open: true,
                was: was
            };
        } else if (!indent) {
            indent = {
                at: 1,
                mode: 'statement',
                open: true
            };
        } else {
            was = indent;
            open = mode === 'var' ||
                (next_token.line !== token.line && mode !== 'statement');
            indent = {
                at: (open || mode === 'control' ?
                    was.at + option.indent : was.at) +
                    (was.wrap ? option.indent : 0),
                mode: mode,
                open: open,
                was: was
            };
            if (mode === 'var' && open) {
                var_mode = indent;
            }
        }
    }

    function step_out(id, symbol) {
        if (id) {
            if (indent && indent.open) {
                indent.at -= option.indent;
                edge();
            }
            advance(id, symbol);
        }
        if (indent) {
            indent = indent.was;
        }
    }

// Functions for conformance of whitespace.

    function one_space(left, right) {
        left = left || token;
        right = right || next_token;
        if (right.id !== '(end)' && option.white &&
                (token.line !== right.line ||
                token.thru + 1 !== right.from)) {
            warn('expected_space_a_b', right, token.value, right.value);
        }
    }

    function one_space_only(left, right) {
        left = left || token;
        right = right || next_token;
        if (right.id !== '(end)' && (left.line !== right.line ||
                (option.white && left.thru + 1 !== right.from))) {
            warn('expected_space_a_b', right, left.value, right.value);
        }
    }

    function no_space(left, right) {
        left = left || token;
        right = right || next_token;
        if ((option.white || xmode === 'styleproperty' || xmode === 'style') &&
                left.thru !== right.from && left.line === right.line) {
            warn('unexpected_space_a_b', right, left.value, right.value);
        }
    }

    function no_space_only(left, right) {
        left = left || token;
        right = right || next_token;
        if (right.id !== '(end)' && (left.line !== right.line ||
                (option.white && left.thru !== right.from))) {
            warn('unexpected_space_a_b', right, left.value, right.value);
        }
    }

    function spaces(left, right) {
        if (option.white) {
            left = left || token;
            right = right || next_token;
            if (left.thru === right.from && left.line === right.line) {
                warn('missing_space_a_b', right, left.value, right.value);
            }
        }
    }

    function comma() {
        if (next_token.id !== ',') {
            warn_at('expected_a_b', token.line, token.thru, ',', next_token.value);
        } else {
            if (option.white) {
                no_space_only();
            }
            advance(',');
            discard();
            spaces();
        }
    }


    function semicolon() {
        if (next_token.id !== ';') {
            warn_at('expected_a_b', token.line, token.thru, ';', next_token.value);
        } else {
            if (option.white) {
                no_space_only();
            }
            advance(';');
            discard();
            if (semicolon_coda[next_token.id] !== true) {
                spaces();
            }
        }
    }

    function use_strict() {
        if (next_token.value === 'use strict') {
            if (strict_mode) {
                warn('unnecessary_use');
            }
            edge();
            advance();
            semicolon();
            strict_mode = true;
            option.newcap = true;
            option.undef = true;
            return true;
        } else {
            return false;
        }
    }


    function are_similar(a, b) {
        if (a === b) {
            return true;
        }
        if (Array.isArray(a)) {
            if (Array.isArray(b) && a.length === b.length) {
                var i;
                for (i = 0; i < a.length; i += 1) {
                    if (!are_similar(a[i], b[i])) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
        if (Array.isArray(b)) {
            return false;
        }
        if (a.arity === b.arity && a.value === b.value) {
            switch (a.arity) {
            case 'prefix':
            case 'suffix':
            case undefined:
                return are_similar(a.first, b.first);
            case 'infix':
                return are_similar(a.first, b.first) &&
                    are_similar(a.second, b.second);
            case 'ternary':
                return are_similar(a.first, b.first) &&
                    are_similar(a.second, b.second) &&
                    are_similar(a.third, b.third);
            case 'function':
            case 'regexp':
                return false;
            default:
                return true;
            }
        } else {
            if (a.id === '.' && b.id === '[' && b.arity === 'infix') {
                return a.second.value === b.second.value && b.second.arity === 'string';
            } else if (a.id === '[' && a.arity === 'infix' && b.id === '.') {
                return a.second.value === b.second.value && a.second.arity === 'string';
            }
        }
        return false;
    }


// This is the heart of JSLINT, the Pratt parser. In addition to parsing, it
// is looking for ad hoc lint patterns. We add .fud to Pratt's model, which is
// like .nud except that it is only used on the first token of a statement.
// Having .fud makes it much easier to define statement-oriented languages like
// JavaScript. I retained Pratt's nomenclature.

// .nud     Null denotation
// .fud     First null denotation
// .led     Left denotation
//  lbp     Left binding power
//  rbp     Right binding power

// They are elements of the parsing method called Top Down Operator Precedence.

    function expression(rbp, initial) {

// rbp is the right binding power.
// initial indicates that this is the first expression of a statement.

        var left;
        if (next_token.id === '(end)') {
            stop('unexpected_a', token, next_token.id);
        }
        advance();
        if (option.safe && typeof predefined[token.value] === 'boolean' &&
                (next_token.id !== '(' && next_token.id !== '.')) {
            warn('adsafe', token);
        }
        if (initial) {
            anonname = 'anonymous';
            funct['(verb)'] = token.value;
        }
        if (initial === true && token.fud) {
            left = token.fud();
        } else {
            if (token.nud) {
                left = token.nud();
            } else {
                if (next_token.arity === 'number' && token.id === '.') {
                    warn('leading_decimal_a', token,
                        next_token.value);
                    advance();
                    return token;
                } else {
                    stop('expected_identifier_a', token, token.id);
                }
            }
            while (rbp < next_token.lbp) {
                advance();
                if (token.led) {
                    left = token.led(left);
                } else {
                    stop('expected_operator_a', token, token.id);
                }
            }
        }
        return left;
    }


// Functional constructors for making the symbols that will be inherited by
// tokens.

    function symbol(s, p) {
        var x = syntax[s];
        if (!x || typeof x !== 'object') {
            syntax[s] = x = {
                id: s,
                lbp: p,
                value: s
            };
        }
        return x;
    }


    function delim(s) {
        return symbol(s, 0);
    }


    function postscript(x) {
        x.postscript = true;
        return x;
    }

    function ultimate(s) {
        var x = symbol(s, 0);
        x.from = 1;
        x.thru = 1;
        x.line = 0;
        x.edge = true;
        s.value = s;
        return postscript(x);
    }


    function stmt(s, f) {
        var x = delim(s);
        x.identifier = x.reserved = true;
        x.fud = f;
        return x;
    }

    function labeled_stmt(s, f) {
        var x = stmt(s, f);
        x.labeled = true;
    }

    function disrupt_stmt(s, f) {
        var x = stmt(s, f);
        x.disrupt = true;
    }


    function reserve_name(x) {
        var c = x.id.charAt(0);
        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
            x.identifier = x.reserved = true;
        }
        return x;
    }


    function prefix(s, f) {
        var x = symbol(s, 150);
        reserve_name(x);
        x.nud = (typeof f === 'function') ? f : function () {
            if (s === 'typeof') {
                one_space();
            } else {
                no_space_only();
            }
            this.first = expression(150);
            this.arity = 'prefix';
            if (this.id === '++' || this.id === '--') {
                if (option.plusplus) {
                    warn('unexpected_a', this);
                } else if ((!this.first.identifier || this.first.reserved) &&
                        this.first.id !== '.' && this.first.id !== '[') {
                    warn('bad_operand', this);
                }
            }
            return this;
        };
        return x;
    }


    function type(s, arity, nud) {
        var x = delim(s);
        x.arity = arity;
        if (nud) {
            x.nud = nud;
        }
        return x;
    }


    function reserve(s, f) {
        var x = delim(s);
        x.identifier = x.reserved = true;
        if (typeof f === 'function') {
            x.nud = f;
        }
        return x;
    }


    function reservevar(s, v) {
        return reserve(s, function () {
            if (typeof v === 'function') {
                v(this);
            }
            return this;
        });
    }


    function infix(s, p, f, w) {
        var x = symbol(s, p);
        reserve_name(x);
        x.led = function (left) {
            this.arity = 'infix';
            if (!w) {
                spaces(prev_token, token);
                spaces();
            }
            if (typeof f === 'function') {
                return f(left, this);
            } else {
                this.first = left;
                this.second = expression(p);
                return this;
            }
        };
        return x;
    }

    function expected_relation(node, message) {
        if (node.assign) {
            warn(message || bundle.conditional_assignment, node);
        }
        return node;
    }

    function expected_condition(node, message) {
        switch (node.id) {
        case '[':
        case '-':
            if (node.arity !== 'infix') {
                warn(message || bundle.weird_condition, node);
            }
            break;
        case 'false':
        case 'function':
        case 'Infinity':
        case 'NaN':
        case 'null':
        case 'true':
        case 'undefined':
        case 'void':
        case '(number)':
        case '(regexp)':
        case '(string)':
        case '{':
            warn(message || bundle.weird_condition, node);
            break;
        }
        return node;
    }

    function check_relation(node) {
        switch (node.arity) {
        case 'prefix':
            switch (node.id) {
            case '{':
            case '[':
                warn('unexpected_a', node);
                break;
            case '!':
                warn('confusing_a', node);
                break;
            }
            break;
        case 'function':
        case 'regexp':
            warn('unexpected_a', node);
            break;
        default:
            if (node.id  === 'NaN') {
                warn('isnan', node);
            }
        }
        return node;
    }


    function relation(s, eqeq) {
        var x = infix(s, 100, function (left, that) {
            check_relation(left);
            if (eqeq) {
                warn('expected_a_b', that, eqeq, that.id);
            }
            var right = expression(100);
            if (are_similar(left, right) ||
                    ((left.arity === 'string' || left.arity === 'number') &&
                    (right.arity === 'string' || right.arity === 'number'))) {
                warn('weird_relation', that);
            }
            that.first = left;
            that.second = check_relation(right);
            return that;
        });
        return x;
    }


    function assignop(s, bit) {
        var x = infix(s, 20, function (left, that) {
            var l;
            if (option.bitwise && bit) {
                warn('unexpected_a', that);
            }
            that.first = left;
            if (funct[left.value] === false) {
                warn('read_only', left);
            } else if (left['function']) {
                warn('a_function', left);
            }
            if (option.safe) {
                l = left;
                do {
                    if (typeof predefined[l.value] === 'boolean') {
                        warn('adsafe', l);
                    }
                    l = l.first;
                } while (l);
            }
            if (left) {
                if (left === syntax['function']) {
                    warn('identifier_function', token);
                }
                if (left.id === '.' || left.id === '[') {
                    if (!left.first || left.first.value === 'arguments') {
                        warn('bad_assignment', that);
                    }
                    that.second = expression(19);
                    if (that.id === '=' && are_similar(that.first, that.second)) {
                        warn('weird_assignment', that);
                    }
                    return that;
                } else if (left.identifier && !left.reserved) {
                    if (funct[left.value] === 'exception') {
                        warn('assign_exception', left);
                    }
                    that.second = expression(19);
                    if (that.id === '=' && are_similar(that.first, that.second)) {
                        warn('weird_assignment', that);
                    }
                    return that;
                }
            }
            stop('bad_assignment', that);
        });
        x.assign = true;
        return x;
    }


    function bitwise(s, p) {
        return infix(s, p, function (left, that) {
            if (option.bitwise) {
                warn('unexpected_a', that);
            }
            that.first = left;
            that.second = expression(p);
            return that;
        });
    }


    function suffix(s, f) {
        var x = symbol(s, 150);
        x.led = function (left) {
            no_space_only(prev_token, token);
            if (option.plusplus) {
                warn('unexpected_a', this);
            } else if ((!left.identifier || left.reserved) &&
                    left.id !== '.' && left.id !== '[') {
                warn('bad_operand', this);
            }
            this.first = left;
            this.arity = 'suffix';
            return this;
        };
        return x;
    }


    function optional_identifier() {
        if (next_token.identifier) {
            advance();
            if (option.safe && banned[token.value]) {
                warn('adsafe_a', token);
            } else if (token.reserved && !option.es5) {
                warn('expected_identifier_a_reserved', token);
            }
            return token.value;
        }
    }


    function identifier() {
        var i = optional_identifier();
        if (i) {
            return i;
        }
        if (token.id === 'function' && next_token.id === '(') {
            warn('name_function');
        } else {
            stop('expected_identifier_a');
        }
    }


    function statement(no_indent) {

// Usually a statement starts a line. Exceptions include the var statement in the
// initialization part of a for statement, and an if after an else.

        var label, old_scope = scope, the_statement;

// We don't like the empty statement.

        if (next_token.id === ';') {
            warn('unexpected_a');
            semicolon();
            return;
        }

// Is this a labeled statement?

        if (next_token.identifier && !next_token.reserved && peek().id === ':') {
            edge('label');
            label = next_token;
            advance();
            discard();
            advance(':');
            discard();
            scope = Object.create(old_scope);
            add_label(label.value, 'label');
            if (next_token.labeled !== true) {
                warn('label_a_b', next_token, label.value, next_token.value);
            }
            if (jx.test(label.value + ':')) {
                warn('url', label);
            }
            next_token.label = label;
        }

// Parse the statement.

        edge();
        step_in('statement');
        the_statement = expression(0, true);
        if (the_statement) {

// Look for the final semicolon.

            if (the_statement.arity === 'statement') {
                if (the_statement.id === 'switch' ||
                        (the_statement.block && the_statement.id !== 'do')) {
                    spaces();
                } else {
                    semicolon();
                }
            } else {

// If this is an expression statement, determine if it is acceptble.
// We do not like
//      new Blah();
// statments. If it is to be used at all, new should only be used to make
// objects, not side effects. The expression statements we do like do
// assignment or invocation or delete.

                if (the_statement.id === '(') {
                    if (the_statement.first.id === 'new') {
                        warn('bad_new');
                    }
                } else if (!the_statement.assign &&
                        the_statement.id !== 'delete' &&
                        the_statement.id !== '++' &&
                        the_statement.id !== '--') {
                    warn('assignment_function_expression', token);
                }
                semicolon();
            }
        }
        step_out();
        scope = old_scope;
        return the_statement;
    }


    function statements() {
        var array = [], disruptor, the_statement;

// A disrupt statement may not be followed by any other statement.
// If the last statement is disrupt, then the sequence is disrupt.

        while (next_token.postscript !== true) {
            if (next_token.id === ';') {
                warn('unexpected_a', next_token);
                semicolon();
            } else {
                if (disruptor) {
                    warn('unreachable_a_b', next_token, next_token.value,
                        disruptor.value);
                    disruptor = null;
                }
                the_statement = statement();
                if (the_statement) {
                    array.push(the_statement);
                    if (the_statement.disrupt) {
                        disruptor = the_statement;
                        array.disrupt = true;
                    }
                }
            }
        }
        return array;
    }


    function block(ordinary) {

// array block is array sequence of statements wrapped in braces.
// ordinary is false for function bodies and try blocks.
// ordinary is true for if statements, while, etc.

        var array,
            curly = next_token,
            old_inblock = in_block,
            old_scope = scope,
            old_strict_mode = strict_mode;

        in_block = ordinary;
        scope = Object.create(scope);
        spaces();
        if (next_token.id === '{') {
            advance('{');
            step_in();
            if (!ordinary && !use_strict() && !old_strict_mode &&
                    option.strict && funct['(context)']['(global)']) {
                warn('missing_use_strict');
            }
            array = statements();
            strict_mode = old_strict_mode;
            step_out('}', curly);
            discard();
        } else if (!ordinary) {
            stop('expected_a_b', next_token, '{', next_token.value);
        } else {
            warn('expected_a_b', next_token, '{', next_token.value);
            array = [statement()];
            array.disrupt = array[0].disrupt;
        }
        funct['(verb)'] = null;
        scope = old_scope;
        in_block = old_inblock;
        if (ordinary && array.length === 0) {
            warn('empty_block');
        }
        return array;
    }


    function tally_property(name) {
        if (properties && typeof properties[name] !== 'boolean') {
            warn('unexpected_property_a', token, name);
        }
        if (typeof member[name] === 'number') {
            member[name] += 1;
        } else {
            member[name] = 1;
        }
    }


    function note_implied(token) {
        var name = token.value, line = token.line, a = implied[name];
        if (typeof a === 'function') {
            a = false;
        }
        if (!a) {
            a = [line];
            implied[name] = a;
        } else if (a[a.length - 1] !== line) {
            a.push(line);
        }
    }


// ECMAScript parser

    syntax['(identifier)'] = {
        type: '(identifier)',
        lbp: 0,
        identifier: true,
        nud: function () {
            var variable = this.value,
                site = scope[variable];
            if (typeof site === 'function') {
                site = undefined;
            }

// The name is in scope and defined in the current function.

            if (funct === site) {

//      Change 'unused' to 'var', and reject labels.

                switch (funct[variable]) {
                case 'error':
                    warn('unexpected_a', token);
                    funct[variable] = 'var';
                    break;
                case 'unused':
                    funct[variable] = 'var';
                    break;
                case 'unction':
                    funct[variable] = 'function';
                    this['function'] = true;
                    break;
                case 'function':
                    this['function'] = true;
                    break;
                case 'label':
                    warn('a_label', token, variable);
                    break;
                }

// The name is not defined in the function.  If we are in the global scope,
// then we have an undefined variable.

            } else if (funct['(global)']) {
                if (typeof global[variable] === 'boolean') {
                    funct[variable] = global[variable];
                } else {
                    if (option.undef) {
                        warn('not_a_defined', token, variable);
                    } else {
                        note_implied(token);
                    }
                }

// If the name is already defined in the current
// function, but not as outer, then there is a scope error.

            } else {
                switch (funct[variable]) {
                case 'closure':
                case 'function':
                case 'var':
                case 'unused':
                    warn('a_scope', token, variable);
                    break;
                case 'label':
                    warn('a_label', token, variable);
                    break;
                case 'outer':
                case true:
                case false:
                    break;
                default:

// If the name is defined in an outer function, make an outer entry, and if
// it was unused, make it var.

                    if (typeof site === 'boolean') {
                        funct[variable] = site;
                        functions[0][variable] = true;
                    } else if (site === null) {
                        warn('a_not_allowed', token, variable);
                        note_implied(token);
                    } else if (typeof site !== 'object') {
                        if (option.undef) {
                            warn('a_not_defined', token, variable);
                        } else {
                            funct[variable] = true;
                        }
                        note_implied(token);
                    } else {
                        switch (site[variable]) {
                        case 'function':
                        case 'unction':
                            this['function'] = true;
                            site[variable] = 'closure';
                            funct[variable] = site['(global)'] ? false : 'outer';
                            break;
                        case 'var':
                        case 'unused':
                            site[variable] = 'closure';
                            funct[variable] = site['(global)'] ? true : 'outer';
                            break;
                        case 'closure':
                        case 'parameter':
                            funct[variable] = site['(global)'] ? true : 'outer';
                            break;
                        case 'error':
                            warn('not_a_defined', token);
                            break;
                        case 'label':
                            warn('a_label', token, variable);
                            break;
                        }
                    }
                }
            }
            return this;
        },
        led: function () {
            stop('expected_operator_a');
        }
    };

// Build the syntax table by declaring the syntactic elements.

    type('(color)', 'color');
    type('(number)', 'number', return_this);
    type('(string)', 'string', return_this);
    type('(range)', 'range');
    type('(regexp)', 'regexp', return_this);

    ultimate('(begin)');
    ultimate('(end)');
    ultimate('(error)');
    postscript(delim('</'));
    delim('<!');
    delim('<!--');
    delim('-->');
    postscript(delim('}'));
    delim(')');
    delim(']');
    postscript(delim('"'));
    postscript(delim('\''));
    delim(';');
    delim(':');
    delim(',');
    delim('#');
    delim('@');
    delim('*/');
    postscript(reserve('case'));
    reserve('catch');
    postscript(reserve('default'));
    reserve('else');
    reserve('finally');

    reservevar('arguments', function (x) {
        if (strict_mode && funct['(global)']) {
            warn('strict', x);
        } else if (option.safe) {
            warn('adsafe', x);
        }
    });
    reservevar('eval', function (x) {
        if (option.safe) {
            warn('adsafe', x);
        }
    });
    reservevar('false');
    reservevar('Infinity');
    reservevar('NaN');
    reservevar('null');
    reservevar('this', function (x) {
        if (strict_mode && ((funct['(statement)'] &&
                funct['(name)'].charAt(0) > 'Z') || funct['(global)'])) {
            warn('strict', x);
        } else if (option.safe) {
            warn('adsafe', x);
        }
    });
    reservevar('true');
    reservevar('undefined');

    assignop('=');
    assignop('+=');
    assignop('-=');
    assignop('*=');
    assignop('/=').nud = function () {
        stop('slash_equal');
    };
    assignop('%=');
    assignop('&=', true);
    assignop('|=', true);
    assignop('^=', true);
    assignop('<<=', true);
    assignop('>>=', true);
    assignop('>>>=', true);

    infix('?', 30, function (left, that) {
        that.first = expected_condition(expected_relation(left));
        that.second = expression(0);
        spaces();
        advance(':');
        discard();
        spaces();
        that.third = expression(10);
        that.arity = 'ternary';
        if (are_similar(that.second, that.third)) {
            warn('weird_ternary', that);
        }
        return that;
    });

    infix('||', 40, function (left, that) {
        function paren_check(that) {
            if (that.id === '&&' && !that.paren) {
                warn('and', that);
            }
            return that;
        }

        that.first = paren_check(expected_condition(expected_relation(left)));
        that.second = paren_check(expected_relation(expression(40)));
        if (are_similar(that.first, that.second)) {
            warn('weird_condition', that);
        }
        return that;
    });

    infix('&&', 50, function (left, that) {
        that.first = expected_condition(expected_relation(left));
        that.second = expected_relation(expression(50));
        if (are_similar(that.first, that.second)) {
            warn('weird_condition', that);
        }
        return that;
    });

    prefix('void', function () {
        this.first = expression(0);
        if (this.first.arity !== 'number' || this.first.value) {
            warn('unexpected_a', this);
            return this;
        }
        return this;
    });

    bitwise('|', 70);
    bitwise('^', 80);
    bitwise('&', 90);

    relation('==', '===');
    relation('===');
    relation('!=', '!==');
    relation('!==');
    relation('<');
    relation('>');
    relation('<=');
    relation('>=');

    bitwise('<<', 120);
    bitwise('>>', 120);
    bitwise('>>>', 120);

    infix('in', 120, function (left, that) {
        warn('infix_in', that);
        that.left = left;
        that.right = expression(130);
        return that;
    });
    infix('instanceof', 120);
    infix('+', 130, function (left, that) {
        if (!left.value) {
            if (left.arity === 'number') {
                warn('unexpected_a', left);
            } else if (left.arity === 'string') {
                warn('expected_a_b', left, 'String', '\'\'');
            }
        }
        var right = expression(130);
        if (!right.value) {
            if (right.arity === 'number') {
                warn('unexpected_a', right);
            } else if (right.arity === 'string') {
                warn('expected_a_b', right, 'String', '\'\'');
            }
        }
        if (left.arity === right.arity &&
                (left.arity === 'string' || left.arity === 'number')) {
            left.value += right.value;
            left.thru = right.thru;
            if (left.arity === 'string' && jx.test(left.value)) {
                warn('url', left);
            }
            discard(right);
            discard(that);
            return left;
        }
        that.first = left;
        that.second = right;
        return that;
    });
    prefix('+', 'num');
    prefix('+++', function () {
        warn('confusing_a', token);
        this.first = expression(150);
        this.arity = 'prefix';
        return this;
    });
    infix('+++', 130, function (left) {
        warn('confusing_a', token);
        this.first = left;
        this.second = expression(130);
        return this;
    });
    infix('-', 130, function (left, that) {
        if ((left.arity === 'number' && left.value === 0) || left.arity === 'string') {
            warn('unexpected_a', left);
        }
        var right = expression(130);
        if ((right.arity === 'number' && right.value === 0) || right.arity === 'string') {
            warn('unexpected_a', left);
        }
        if (left.arity === right.arity && left.arity === 'number') {
            left.value -= right.value;
            left.thru = right.thru;
            discard(right);
            discard(that);
            return left;
        }
        that.first = left;
        that.second = right;
        return that;
    });
    prefix('-');
    prefix('---', function () {
        warn('confusing_a', token);
        this.first = expression(150);
        this.arity = 'prefix';
        return this;
    });
    infix('---', 130, function (left) {
        warn('confusing_a', token);
        this.first = left;
        this.second = expression(130);
        return this;
    });
    infix('*', 140, function (left, that) {
        if ((left.arity === 'number' && (left.value === 0 || left.value === 1)) || left.arity === 'string') {
            warn('unexpected_a', left);
        }
        var right = expression(140);
        if ((right.arity === 'number' && (right.value === 0 || right.value === 1)) || right.arity === 'string') {
            warn('unexpected_a', right);
        }
        if (left.arity === right.arity && left.arity === 'number') {
            left.value *= right.value;
            left.thru = right.thru;
            discard(right);
            discard(that);
            return left;
        }
        that.first = left;
        that.second = right;
        return that;
    });
    infix('/', 140, function (left, that) {
        if ((left.arity === 'number' && left.value === 0) || left.arity === 'string') {
            warn('unexpected_a', left);
        }
        var right = expression(140);
        if ((right.arity === 'number' && (right.value === 0 || right.value === 1)) || right.arity === 'string') {
            warn('unexpected_a', right);
        }
        if (left.arity === right.arity && left.arity === 'number') {
            left.value /= right.value;
            left.thru = right.thru;
            discard(right);
            discard(that);
            return left;
        }
        that.first = left;
        that.second = right;
        return that;
    });
    infix('%', 140, function (left, that) {
        if ((left.arity === 'number' && (left.value === 0 || left.value === 1)) || left.arity === 'string') {
            warn('unexpected_a', left);
        }
        var right = expression(140);
        if ((right.arity === 'number' && (right.value === 0 || right.value === 1)) || right.arity === 'string') {
            warn('unexpected_a', right);
        }
        if (left.arity === right.arity && left.arity === 'number') {
            left.value %= right.value;
            left.thru = right.thru;
            discard(right);
            discard(that);
            return left;
        }
        that.first = left;
        that.second = right;
        return that;
    });

    suffix('++');
    prefix('++');

    suffix('--');
    prefix('--');
    prefix('delete', function () {
        one_space();
        var p = expression(0);
        if (!p || (p.id !== '.' && p.id !== '[')) {
            warn('deleted');
        }
        this.first = p;
        return this;
    });


    prefix('~', function () {
        no_space_only();
        if (option.bitwise) {
            warn('unexpected_a', this);
        }
        expression(150);
        return this;
    });
    prefix('!', function () {
        no_space_only();
        this.first = expression(150);
        this.arity = 'prefix';
        if (bang[this.first.id] === true) {
            warn('confusing_a', this);
        }
        return this;
    });
    prefix('typeof');
    prefix('new', function () {
        one_space();
        var c = expression(160), i, p;
        this.first = c;
        if (c.id !== 'function') {
            if (c.identifier) {
                switch (c.value) {
                case 'Object':
                    warn('use_object', token);
                    break;
                case 'Array':
                    if (next_token.id === '(') {
                        p = next_token;
                        p.first = this;
                        advance('(');
                        if (next_token.id !== ')') {
                            p.second = expression(0);
                            if (p.second.arity !== 'number' || !p.second.value) {
                                expected_condition(p.second,  bundle.use_array);
                                i = false;
                            } else {
                                i = true;
                            }
                            while (next_token.id !== ')' && next_token.id !== '(end)') {
                                if (i) {
                                    warn('use_array', p);
                                    i = false;
                                }
                                advance();
                            }
                        } else {
                            warn('use_array', token);
                        }
                        advance(')', p);
                        discard();
                        return p;
                    }
                    warn('use_array', token);
                    break;
                case 'Number':
                case 'String':
                case 'Boolean':
                case 'Math':
                case 'JSON':
                    warn('not_a_constructor', c);
                    break;
                case 'Function':
                    if (!option.evil) {
                        warn('function_eval');
                    }
                    break;
                case 'Date':
                case 'RegExp':
                    break;
                default:
                    if (c.id !== 'function') {
                        i = c.value.substr(0, 1);
                        if (option.newcap && (i < 'A' || i > 'Z')) {
                            warn('constructor_name_a', token);
                        }
                    }
                }
            } else {
                if (c.id !== '.' && c.id !== '[' && c.id !== '(') {
                    warn('bad_constructor', token);
                }
            }
        } else {
            warn('weird_new', this);
        }
        if (next_token.id !== '(') {
            warn('missing_a', next_token, '()');
        }
        return this;
    });

    infix('(', 160, function (left, that) {
        if (indent && indent.mode === 'expression') {
            no_space(prev_token, token);
        } else {
            no_space_only(prev_token, token);
        }
        if (!left.immed && left.id === 'function') {
            warn('wrap_immediate');
        }
        var p = [];
        if (left) {
            if (left.identifier) {
                if (left.value.match(/^[A-Z]([A-Z0-9_$]*[a-z][A-Za-z0-9_$]*)?$/)) {
                    if (left.value !== 'Number' && left.value !== 'String' &&
                            left.value !== 'Boolean' && left.value !== 'Date') {
                        if (left.value === 'Math' || left.value === 'JSON') {
                            warn('not_a_function', left);
                        } else if (left.value === 'Object') {
                            warn('use_object', token);
                        } else if (left.value === 'Array' || option.newcap) {
                            warn('missing_a', left, 'new');
                        }
                    }
                }
            } else if (left.id === '.') {
                if (option.safe && left.first.value === 'Math' &&
                        left.second === 'random') {
                    warn('adsafe', left);
                }
            }
        }
        step_in();
        if (next_token.id !== ')') {
            no_space();
            for (;;) {
                edge();
                p.push(expression(10));
                if (next_token.id !== ',') {
                    break;
                }
                comma();
            }
        }
        no_space();
        step_out(')', that);
        if (typeof left === 'object') {
            if (left.value === 'parseInt' && p.length === 1) {
                warn('radix', left);
            }
            if (!option.evil) {
                if (left.value === 'eval' || left.value === 'Function' ||
                        left.value === 'execScript') {
                    warn('evil', left);
                } else if (p[0] && p[0].arity === 'string' &&
                        (left.value === 'setTimeout' ||
                        left.value === 'setInterval')) {
                    warn('implied_evil', left);
                }
            }
            if (!left.identifier && left.id !== '.' && left.id !== '[' &&
                    left.id !== '(' && left.id !== '&&' && left.id !== '||' &&
                    left.id !== '?') {
                warn('bad_invocation', left);
            }
        }
        that.first = left;
        that.second = p;
        return that;
    }, true);

    prefix('(', function () {
        step_in('expression');
        discard();
        no_space();
        edge();
        if (next_token.id === 'function') {
            next_token.immed = true;
        }
        var value = expression(0);
        value.paren = true;
        no_space();
        step_out(')', this);
        discard();
        if (value.id === 'function') {
            if (next_token.id === '(') {
                warn('move_invocation');
            } else {
                warn('bad_wrap', this);
            }
        }
        return value;
    });

    infix('.', 170, function (left, that) {
        no_space(prev_token, token);
        no_space();
        var name = identifier();
        if (typeof name === 'string') {
            tally_property(name);
        }
        that.first = left;
        that.second = token;
        if (left && left.value === 'arguments' &&
                (name === 'callee' || name === 'caller')) {
            warn('avoid_a', left, 'arguments.' + name);
        } else if (!option.evil && left && left.value === 'document' &&
                (name === 'write' || name === 'writeln')) {
            warn('write_is_wrong', left);
        } else if (option.adsafe) {
            if (!adsafe_top && left.value === 'ADSAFE') {
                if (name === 'id' || name === 'lib') {
                    warn('adsafe', that);
                } else if (name === 'go') {
                    if (xmode !== 'script') {
                        warn('adsafe', that);
                    } else if (adsafe_went || next_token.id !== '(' ||
                            peek(0).arity !== 'string' ||
                            peek(0).value !== adsafe_id ||
                            peek(1).id !== ',') {
                        stop('adsafe_a', that, 'go');
                    }
                    adsafe_went = true;
                    adsafe_may = false;
                }
            }
            adsafe_top = false;
        }
        if (!option.evil && (name === 'eval' || name === 'execScript')) {
            warn('evil');
        } else if (option.safe) {
            for (;;) {
                if (banned[name] === true) {
                    warn('adsafe_a', token, name);
                }
                if (typeof predefined[left.value] !== 'boolean' ||
                        next_token.id === '(') {
                    break;
                }
                if (standard_property[name] === true) {
                    if (next_token.id === '.') {
                        warn('adsafe', that);
                    }
                    break;
                }
                if (next_token.id !== '.') {
                    warn('adsafe', that);
                    break;
                }
                advance('.');
                token.first = that;
                token.second = name;
                that = token;
                name = identifier();
                if (typeof name === 'string') {
                    tally_property(name);
                }
            }
        }
        return that;
    }, true);

    infix('[', 170, function (left, that) {
        no_space_only(prev_token, token);
        no_space();
        step_in();
        edge();
        var e = expression(0), s;
        if (e.arity === 'string') {
            if (option.safe && (banned[e.value] ||
                    e.value.charAt(0) === '_' || e.value.slice(-1) === '_')) {
                warn('adsafe_subscript_a', e);
            } else if (!option.evil &&
                    (e.value === 'eval' || e.value === 'execScript')) {
                warn('evil', e);
            }
            tally_property(e.value);
            if (!option.sub && ix.test(e.value)) {
                s = syntax[e.value];
                if (!s || !s.reserved) {
                    warn('subscript', e);
                }
            }
        } else if (e.arity !== 'number' && option.safe) {
            if (!((e.arity === 'prefix' && adsafe_prefix[e.id] === true) ||
                    (e.arity === 'infix' && adsafe_infix[e.id] === true))) {
                warn('adsafe_subscript_a', e);
            }
        }
        step_out(']', that);
        discard();
        no_space(prev_token, token);
        that.first = left;
        that.second = e;
        return that;
    }, true);

    prefix('[', function () {
        this.arity = 'prefix';
        this.first = [];
        step_in('array');
        while (next_token.id !== '(end)') {
            while (next_token.id === ',') {
                warn('unexpected_a', next_token);
                advance(',');
                discard();
            }
            if (next_token.id === ']') {
                break;
            }
            indent.wrap = false;
            edge();
            this.first.push(expression(10));
            if (next_token.id === ',') {
                comma();
                if (next_token.id === ']' && !option.es5) {
                    warn('unexpected_a', token);
                    break;
                }
            } else {
                break;
            }
        }
        step_out(']', this);
        discard();
        return this;
    }, 170);


    function property_name() {
        var id = optional_identifier(true);
        if (!id) {
            if (next_token.arity === 'string') {
                id = next_token.value;
                if (option.safe) {
                    if (banned[id]) {
                        warn('adsafe_a');
                    } else if (id.charAt(0) === '_' ||
                            id.charAt(id.length - 1) === '_') {
                        warn('dangling_a');
                    }
                }
                advance();
            } else if (next_token.arity === 'number') {
                id = next_token.value.toString();
                advance();
            }
        }
        return id;
    }


    function function_params() {
        var id, paren = next_token, params = [];
        advance('(');
        step_in();
        discard();
        no_space();
        if (next_token.id === ')') {
            no_space();
            step_out(')', paren);
            discard();
            return;
        }
        for (;;) {
            edge();
            id = identifier();
            params.push(token);
            add_label(id, 'parameter');
            if (next_token.id === ',') {
                comma();
            } else {
                no_space();
                step_out(')', paren);
                discard();
                return params;
            }
        }
    }


    function do_function(func, name) {
        var old_properties = properties,
            old_option     = option,
            old_global     = global,
            old_scope      = scope;
        funct = {
            '(name)'     : name || '"' + anonname + '"',
            '(line)'     : next_token.line,
            '(context)'  : funct,
            '(breakage)' : 0,
            '(loopage)'  : 0,
            '(scope)'    : scope,
            '(token)'    : func
        };
        properties  = old_properties && Object.create(old_properties);
        option      = Object.create(old_option);
        global      = Object.create(old_global);
        scope       = Object.create(old_scope);
        token.funct = funct;
        functions.push(funct);
        if (name) {
            add_label(name, 'function');
        }
        func.name = name || '';
        func.first = funct['(params)'] = function_params();
        one_space();
        func.block = block(false);
        funct      = funct['(context)'];
        properties = old_properties;
        option     = old_option;
        global     = old_global;
        scope      = old_scope;
    }


    prefix('{', function () {
        var get, i, j, name, p, set, seen = {};
        this.arity = 'prefix';
        this.first = [];
        step_in();
        while (next_token.id !== '}') {
            indent.wrap = false;

// JSLint recognizes the ES5 extension for get/set in object literals,
// but requires that they be used in pairs.

            edge();
            if (next_token.value === 'get' && peek().id !== ':') {
                if (!option.es5) {
                    warn('get_set');
                }
                get = next_token;
                advance('get');
                one_space_only();
                name = next_token;
                i = property_name();
                if (!i) {
                    stop('missing_property');
                }
                do_function(get, '');
                if (funct['(loopage)']) {
                    warn('function_loop', get);
                }
                p = get.first;
                if (p) {
                    warn('parameter_a_get_b', p[0], p[0].value, i);
                }
                comma();
                set = next_token;
                spaces();
                edge();
                advance('set');
                one_space_only();
                j = property_name();
                if (i !== j) {
                    stop('expected_a_b', token, i, j || next_token.value);
                }
                do_function(set, '');
                p = set.first;
                if (!p || p.length !== 1) {
                    stop('parameter_set_a', set, 'value');
                } else if (p[0].value !== 'value') {
                    stop('expected_a_b', p[0], 'value', p[0].value);
                }
                name.first = [get, set];
            } else {
                name = next_token;
                i = property_name();
                if (typeof i !== 'string') {
                    stop('missing_property');
                }
                advance(':');
                discard();
                spaces();
                name.first = expression(10);
            }
            this.first.push(name);
            if (seen[i] === true) {
                warn('duplicate_a', next_token, i);
            }
            seen[i] = true;
            tally_property(i);
            if (next_token.id !== ',') {
                break;
            }
            for (;;) {
                comma();
                if (next_token.id !== ',') {
                    break;
                }
                warn('unexpected_a', next_token);
            }
            if (next_token.id === '}' && !option.es5) {
                warn('unexpected_a', token);
            }
        }
        step_out('}', this);
        discard();
        return this;
    });

    stmt('{', function () {
        discard();
        warn('statement_block');
        this.arity = 'statement';
        this.block = statements();
        this.disrupt = this.block.disrupt;
        advance('}', this);
        discard();
        return this;
    });

    stmt('/*global', directive);
    stmt('/*globals', directive);
    stmt('/*jslint', directive);
    stmt('/*member', directive);
    stmt('/*members', directive);
    stmt('/*property', directive);
    stmt('/*properties', directive);

    stmt('var', function () {

// JavaScript does not have block scope. It only has function scope. So,
// declaring a variable in a block can have unexpected consequences.

// var.first will contain an array, the array containing name tokens
// and assignment tokens.

        var assign, id, name;

        if (funct['(onevar)'] && option.onevar) {
            warn('combine_var');
        } else if (!funct['(global)']) {
            funct['(onevar)'] = true;
        }
        this.arity = 'statement';
        this.first = [];
        step_in('var');
        for (;;) {
            name = next_token;
            id = identifier();
            if (funct['(global)'] && predefined[id] === false) {
                warn('redefinition_a', token, id);
            }
            add_label(id, 'error');

            if (next_token.id === '=') {
                assign = next_token;
                assign.first = name;
                spaces();
                advance('=');
                spaces();
                if (next_token.id === 'undefined') {
                    warn('unnecessary_initialize', token, id);
                }
                if (peek(0).id === '=' && next_token.identifier) {
                    stop('var_a_not');
                }
                assign.second = expression(0);
                assign.arity = 'infix';
                this.first.push(assign);
            } else {
                this.first.push(name);
            }
            funct[id] = 'unused';
            if (next_token.id !== ',') {
                break;
            }
            comma();
            if (var_mode && next_token.line === token.line &&
                    this.first.length === 1) {
                var_mode = false;
                indent.open = false;
                indent.at -= option.indent;
            }
            spaces();
            edge();
        }
        var_mode = false;
        step_out();
        return this;
    });

    stmt('function', function () {
        one_space();
        if (in_block) {
            warn('function_block', token);
        }
        var i = identifier();
        if (i) {
            add_label(i, 'unction');
            no_space();
        }
        do_function(this, i, true);
        if (next_token.id === '(' && next_token.line === token.line) {
            stop('function_statement');
        }
        this.arity = 'statement';
        return this;
    });

    prefix('function', function () {
        one_space();
        var i = optional_identifier();
        if (i) {
            no_space();
        }
        do_function(this, i);
        if (funct['(loopage)']) {
            warn('function_loop');
        }
        this.arity = 'function';
        return this;
    });

    stmt('if', function () {
        var paren = next_token;
        one_space();
        advance('(');
        step_in('control');
        discard();
        no_space();
        edge();
        this.arity = 'statement';
        this.first = expected_condition(expected_relation(expression(0)));
        no_space();
        step_out(')', paren);
        discard();
        one_space();
        this.block = block(true);
        if (next_token.id === 'else') {
            one_space();
            advance('else');
            discard();
            one_space();
            this['else'] = next_token.id === 'if' || next_token.id === 'switch' ?
                statement(true) : block(true);
            if (this['else'].disrupt && this.block.disrupt) {
                this.disrupt = true;
            }
        }
        return this;
    });

    stmt('try', function () {

// try.first    The catch variable
// try.second   The catch clause
// try.third    The finally clause
// try.block    The try block

        var exception_variable, old_scope, paren;
        if (option.adsafe) {
            warn('adsafe_a', this);
        }
        one_space();
        this.arity = 'statement';
        this.block = block(false);
        if (next_token.id === 'catch') {
            one_space();
            advance('catch');
            discard();
            one_space();
            paren = next_token;
            advance('(');
            step_in('control');
            discard();
            no_space();
            edge();
            old_scope = scope;
            scope = Object.create(old_scope);
            exception_variable = next_token.value;
            this.first = exception_variable;
            if (!next_token.identifier) {
                warn('expected_identifier_a', next_token);
            } else {
                add_label(exception_variable, 'exception');
            }
            advance();
            no_space();
            step_out(')', paren);
            discard();
            one_space();
            this.second = block(false);
            scope = old_scope;
        }
        if (next_token.id === 'finally') {
            discard();
            one_space();
            advance('finally');
            discard();
            one_space();
            this.third = block(false);
        } else if (!this.second) {
            stop('expected_a_b', next_token, 'catch', next_token.value);
        }
        return this;
    });

    labeled_stmt('while', function () {
        one_space();
        var paren = next_token;
        funct['(breakage)'] += 1;
        funct['(loopage)'] += 1;
        advance('(');
        step_in('control');
        discard();
        no_space();
        edge();
        this.arity = 'statement';
        this.first = expected_relation(expression(0));
        if (this.first.id !== 'true') {
            expected_condition(this.first, bundle.unexpected_a);
        }
        no_space();
        step_out(')', paren);
        discard();
        one_space();
        this.block = block(true);
        if (this.block.disrupt) {
            warn('strange_loop', prev_token);
        }
        funct['(breakage)'] -= 1;
        funct['(loopage)'] -= 1;
        return this;
    });

    reserve('with');

    labeled_stmt('switch', function () {

// switch.first             the switch expression
// switch.second            the array of cases. A case is 'case' or 'default' token:
//    case.first            the array of case expressions
//    case.second           the array of statements
// If all of the arrays of statements are disrupt, then the switch is disrupt.

        var particular,
            the_case = next_token,
            unbroken = true;
        funct['(breakage)'] += 1;
        one_space();
        advance('(');
        discard();
        no_space();
        step_in();
        this.arity = 'statement';
        this.first = expected_condition(expected_relation(expression(0)));
        no_space();
        step_out(')', the_case);
        discard();
        one_space();
        advance('{');
        step_in();
        this.second = [];
        while (next_token.id === 'case') {
            the_case = next_token;
            the_case.first = [];
            spaces();
            edge('case');
            advance('case');
            for (;;) {
                one_space();
                particular = expression(0);
                the_case.first.push(particular);
                if (particular.id === 'NaN') {
                    warn('unexpected_a', particular);
                }
                no_space_only();
                advance(':');
                discard();
                if (next_token.id !== 'case') {
                    break;
                }
                spaces();
                edge('case');
                advance('case');
                discard();
            }
            spaces();
            the_case.second = statements();
            if (the_case.second && the_case.second.length > 0) {
                particular = the_case.second[the_case.second.length - 1];
                if (particular.disrupt) {
                    if (particular.id === 'break') {
                        unbroken = false;
                    }
                } else {
                    warn('missing_a_after_b', next_token, 'break', 'case');
                }
            } else {
                warn('empty_case');
            }
            this.second.push(the_case);
        }
        if (this.second.length === 0) {
            warn('missing_a', next_token, 'case');
        }
        if (next_token.id === 'default') {
            spaces();
            the_case = next_token;
            edge('case');
            advance('default');
            discard();
            no_space_only();
            advance(':');
            discard();
            spaces();
            the_case.second = statements();
            if (the_case.second && the_case.second.length > 0) {
                particular = the_case.second[the_case.second.length - 1];
                if (unbroken && particular.disrupt && particular.id !== 'break') {
                    this.disrupt = true;
                }
            }
            this.second.push(the_case);
        }
        funct['(breakage)'] -= 1;
        spaces();
        step_out('}', this);
        return this;
    });

    stmt('debugger', function () {
        if (!option.debug) {
            warn('unexpected_a', this);
        }
        this.arity = 'statement';
        return this;
    });

    labeled_stmt('do', function () {
        funct['(breakage)'] += 1;
        funct['(loopage)'] += 1;
        one_space();
        this.arity = 'statement';
        this.block = block(true);
        if (this.block.disrupt) {
            warn('strange_loop', prev_token);
        }
        one_space();
        advance('while');
        discard();
        var paren = next_token;
        one_space();
        advance('(');
        step_in();
        discard();
        no_space();
        edge();
        this.first = expected_condition(expected_relation(expression(0)), bundle.unexpected_a);
        no_space();
        step_out(')', paren);
        discard();
        funct['(breakage)'] -= 1;
        funct['(loopage)'] -= 1;
        return this;
    });

    labeled_stmt('for', function () {
        var blok, filter, ok = false, paren = next_token, the_in, value;
        this.arity = 'statement';
        funct['(breakage)'] += 1;
        funct['(loopage)'] += 1;
        advance('(');
        step_in('control');
        discard();
        spaces(this, paren);
        no_space();
        if (next_token.id === 'var') {
            stop('move_var');
        }
        edge();
        if (peek(0).id === 'in') {
            value = next_token;
            switch (funct[value.value]) {
            case 'unused':
                funct[value.value] = 'var';
                break;
            case 'var':
                break;
            default:
                warn('bad_in_a', value);
            }
            advance();
            the_in = next_token;
            advance('in');
            the_in.first = value;
            the_in.second = expression(20);
            step_out(')', paren);
            discard();
            this.first = the_in;
            blok = block(true);
            if (!option.forin) {
                if (blok.length === 1 && typeof blok[0] === 'object' &&
                        blok[0].value === 'if' && !blok[0]['else']) {
                    filter = blok[0].first;
                    while (filter.id === '&&') {
                        filter = filter.first;
                    }
                    switch (filter.id) {
                    case '===':
                    case '!==':
                        ok = filter.first.id === '[' ? (
                            filter.first.first.value === the_in.second.value &&
                            filter.first.second.value === the_in.first.value
                        ) : (
                            filter.first.id === 'typeof' &&
                            filter.first.first.id === '[' &&
                            filter.first.first.first.value === the_in.second.value &&
                            filter.first.first.second.value === the_in.first.value
                        );
                        break;
                    case '(':
                        ok = filter.first.id === '.' && ((
                            filter.first.first.value === the_in.second.value &&
                            filter.first.second.value === 'hasOwnProperty' &&
                            filter.second[0].value === the_in.first.value
                        ) || (
                            filter.first.first.value === 'ADSAFE' &&
                            filter.first.second.value === 'has' &&
                            filter.second[0].value === the_in.second.value &&
                            filter.second[1].value === the_in.first.value
                        ) || (
                            filter.first.first.id === '.' &&
                            filter.first.first.first.id === '.' &&
                            filter.first.first.first.first.value === 'Object' &&
                            filter.first.first.first.second.value === 'prototype' &&
                            filter.first.first.second.value === 'hasOwnProperty' &&
                            filter.first.second.value === 'call' &&
                            filter.second[0].value === the_in.second.value &&
                            filter.second[1].value === the_in.first.value
                        ));
                        break;
                    }
                }
                if (!ok) {
                    warn('for_if', this);
                }
            }
        } else {
            if (next_token.id !== ';') {
                edge();
                this.first = [];
                for (;;) {
                    this.first.push(expression(0, 'for'));
                    if (next_token.id !== ',') {
                        break;
                    }
                    comma();
                }
            }
            semicolon();
            if (next_token.id !== ';') {
                edge();
                this.second = expected_relation(expression(0));
                if (this.second.id !== 'true') {
                    expected_condition(this.second, bundle.unexpected_a);
                }
            }
            semicolon(token);
            if (next_token.id === ';') {
                stop('expected_a_b', next_token, ')', ';');
            }
            if (next_token.id !== ')') {
                this.third = [];
                edge();
                for (;;) {
                    this.third.push(expression(0, 'for'));
                    if (next_token.id !== ',') {
                        break;
                    }
                    comma();
                }
            }
            no_space();
            step_out(')', paren);
            discard();
            one_space();
            blok = block(true);
        }
        if (blok.disrupt) {
            warn('strange_loop', prev_token);
        }
        this.block = blok;
        funct['(breakage)'] -= 1;
        funct['(loopage)'] -= 1;
        return this;
    });

    disrupt_stmt('break', function () {
        var label = next_token.value;
        this.arity = 'statement';
        if (funct['(breakage)'] === 0) {
            warn('unexpected_a', this);
        }
        if (next_token.identifier && token.line === next_token.line) {
            one_space_only();
            if (funct[label] !== 'label') {
                warn('not_a_label', next_token);
            } else if (scope[label] !== funct) {
                warn('not_a_scope', next_token);
            }
            this.first = next_token;
            advance();
        }
        return this;
    });

    disrupt_stmt('continue', function () {
        if (!option['continue']) {
            warn('unexpected_a', this);
        }
        var label = next_token.value;
        this.arity = 'statement';
        if (funct['(breakage)'] === 0) {
            warn('unexpected_a', this);
        }
        if (next_token.identifier && token.line === next_token.line) {
            one_space_only();
            if (funct[label] !== 'label') {
                warn('not_a_label', next_token);
            } else if (scope[label] !== funct) {
                warn('not_a_scope', next_token);
            }
            this.first = next_token;
            advance();
        }
        return this;
    });

    disrupt_stmt('return', function () {
        this.arity = 'statement';
        if (next_token.id !== ';' && next_token.line === token.line) {
            one_space_only();
            if (next_token.id === '/' || next_token.id === '(regexp)') {
                warn('wrap_regexp');
            }
            this.first = expression(20);
        }
        return this;
    });

    disrupt_stmt('throw', function () {
        this.arity = 'statement';
        one_space_only();
        this.first = expression(20);
        return this;
    });


//  Superfluous reserved words

    reserve('class');
    reserve('const');
    reserve('enum');
    reserve('export');
    reserve('extends');
    reserve('import');
    reserve('super');

// Harmony reserved words

    reserve('let');
    reserve('yield');
    reserve('implements');
    reserve('interface');
    reserve('package');
    reserve('private');
    reserve('protected');
    reserve('public');
    reserve('static');


// Parse JSON

    function json_value() {

        function json_object() {
            var brace = next_token, object = {};
            advance('{');
            if (next_token.id !== '}') {
                while (next_token.id !== '(end)') {
                    while (next_token.id === ',') {
                        warn('unexpected_a', next_token);
                        comma();
                    }
                    if (next_token.arity !== 'string') {
                        warn('expected_string_a');
                    }
                    if (object[next_token.value] === true) {
                        warn('duplicate_a');
                    } else if (next_token.value === '__proto__') {
                        warn('dangling_a');
                    } else {
                        object[next_token.value] = true;
                    }
                    advance();
                    advance(':');
                    json_value();
                    if (next_token.id !== ',') {
                        break;
                    }
                    comma();
                    if (next_token.id === '}') {
                        warn('unexpected_a', token);
                        break;
                    }
                }
            }
            advance('}', brace);
        }

        function json_array() {
            var bracket = next_token;
            advance('[');
            if (next_token.id !== ']') {
                while (next_token.id !== '(end)') {
                    while (next_token.id === ',') {
                        warn('unexpected_a', next_token);
                        comma();
                    }
                    json_value();
                    if (next_token.id !== ',') {
                        break;
                    }
                    comma();
                    if (next_token.id === ']') {
                        warn('unexpected_a', token);
                        break;
                    }
                }
            }
            advance(']', bracket);
        }

        switch (next_token.id) {
        case '{':
            json_object();
            break;
        case '[':
            json_array();
            break;
        case 'true':
        case 'false':
        case 'null':
        case '(number)':
        case '(string)':
            advance();
            break;
        case '-':
            advance('-');
            no_space_only();
            advance('(number)');
            break;
        default:
            stop('unexpected_a');
        }
    }


// CSS parsing.

    function css_name() {
        if (next_token.identifier) {
            advance();
            return true;
        }
    }


    function css_number() {
        if (next_token.id === '-') {
            advance('-');
            no_space_only();
        }
        if (next_token.arity === 'number') {
            advance('(number)');
            return true;
        }
    }


    function css_string() {
        if (next_token.arity === 'string') {
            advance();
            return true;
        }
    }

    function css_color() {
        var i, number, paren, value;
        if (next_token.identifier) {
            value = next_token.value;
            if (value === 'rgb' || value === 'rgba') {
                advance();
                paren = next_token;
                advance('(');
                for (i = 0; i < 3; i += 1) {
                    if (i) {
                        comma();
                    }
                    number = next_token.value;
                    if (next_token.arity !== 'number' || number < 0) {
                        warn('expected_positive_a', next_token);
                        advance();
                    } else {
                        advance();
                        if (next_token.id === '%') {
                            advance('%');
                            if (number > 100) {
                                warn('expected_percent_a', token, number);
                            }
                        } else {
                            if (number > 255) {
                                warn('expected_small_a', token, number);
                            }
                        }
                    }
                }
                if (value === 'rgba') {
                    comma();
                    number = +next_token.value;
                    if (next_token.arity !== 'number' || number < 0 || number > 1) {
                        warn('expected_fraction_a', next_token);
                    }
                    advance();
                    if (next_token.id === '%') {
                        warn('unexpected_a');
                        advance('%');
                    }
                }
                advance(')', paren);
                return true;
            } else if (css_colorData[next_token.value] === true) {
                advance();
                return true;
            }
        } else if (next_token.id === '(color)') {
            advance();
            return true;
        }
        return false;
    }


    function css_length() {
        if (next_token.id === '-') {
            advance('-');
            no_space_only();
        }
        if (next_token.arity === 'number') {
            advance();
            if (next_token.arity !== 'string' &&
                    css_lengthData[next_token.value] === true) {
                no_space_only();
                advance();
            } else if (+token.value !== 0) {
                warn('expected_linear_a');
            }
            return true;
        }
        return false;
    }


    function css_line_height() {
        if (next_token.id === '-') {
            advance('-');
            no_space_only();
        }
        if (next_token.arity === 'number') {
            advance();
            if (next_token.arity !== 'string' &&
                    css_lengthData[next_token.value] === true) {
                no_space_only();
                advance();
            }
            return true;
        }
        return false;
    }


    function css_width() {
        if (next_token.identifier) {
            switch (next_token.value) {
            case 'thin':
            case 'medium':
            case 'thick':
                advance();
                return true;
            }
        } else {
            return css_length();
        }
    }


    function css_margin() {
        if (next_token.identifier) {
            if (next_token.value === 'auto') {
                advance();
                return true;
            }
        } else {
            return css_length();
        }
    }

    function css_attr() {
        if (next_token.identifier && next_token.value === 'attr') {
            advance();
            advance('(');
            if (!next_token.identifier) {
                warn('expected_name_a');
            }
            advance();
            advance(')');
            return true;
        }
        return false;
    }


    function css_comma_list() {
        while (next_token.id !== ';') {
            if (!css_name() && !css_string()) {
                warn('expected_name_a');
            }
            if (next_token.id !== ',') {
                return true;
            }
            comma();
        }
    }


    function css_counter() {
        if (next_token.identifier && next_token.value === 'counter') {
            advance();
            advance('(');
            advance();
            if (next_token.id === ',') {
                comma();
                if (next_token.arity !== 'string') {
                    warn('expected_string_a');
                }
                advance();
            }
            advance(')');
            return true;
        }
        if (next_token.identifier && next_token.value === 'counters') {
            advance();
            advance('(');
            if (!next_token.identifier) {
                warn('expected_name_a');
            }
            advance();
            if (next_token.id === ',') {
                comma();
                if (next_token.arity !== 'string') {
                    warn('expected_string_a');
                }
                advance();
            }
            if (next_token.id === ',') {
                comma();
                if (next_token.arity !== 'string') {
                    warn('expected_string_a');
                }
                advance();
            }
            advance(')');
            return true;
        }
        return false;
    }


    function css_shape() {
        var i;
        if (next_token.identifier && next_token.value === 'rect') {
            advance();
            advance('(');
            for (i = 0; i < 4; i += 1) {
                if (!css_length()) {
                    warn('expected_number_a');
                    break;
                }
            }
            advance(')');
            return true;
        }
        return false;
    }


    function css_url() {
        var c, url;
        if (next_token.identifier && next_token.value === 'url') {
            next_token = lex.range('(', ')');
            url = next_token.value;
            c = url.charAt(0);
            if (c === '"' || c === '\'') {
                if (url.slice(-1) !== c) {
                    warn('bad_url');
                } else {
                    url = url.slice(1, -1);
                    if (url.indexOf(c) >= 0) {
                        warn('bad_url');
                    }
                }
            }
            if (!url) {
                warn('missing_url');
            }
            if (option.safe && ux.test(url)) {
                stop('adsafe_a', next_token, url);
            }
            urls.push(url);
            advance();
            return true;
        }
        return false;
    }


    css_any = [css_url, function () {
        for (;;) {
            if (next_token.identifier) {
                switch (next_token.value.toLowerCase()) {
                case 'url':
                    css_url();
                    break;
                case 'expression':
                    warn('unexpected_a');
                    advance();
                    break;
                default:
                    advance();
                }
            } else {
                if (next_token.id === ';' || next_token.id === '!'  ||
                        next_token.id === '(end)' || next_token.id === '}') {
                    return true;
                }
                advance();
            }
        }
    }];


    css_border_style = [
        'none', 'dashed', 'dotted', 'double', 'groove',
        'hidden', 'inset', 'outset', 'ridge', 'solid'
    ];

    css_break = [
        'auto', 'always', 'avoid', 'left', 'right'
    ];

    css_media = {
        'all': true,
        'braille': true,
        'embossed': true,
        'handheld': true,
        'print': true,
        'projection': true,
        'screen': true,
        'speech': true,
        'tty': true,
        'tv': true
    };

    css_overflow = [
        'auto', 'hidden', 'scroll', 'visible'
    ];

    css_attribute_data = {
        background: [
            true, 'background-attachment', 'background-color',
            'background-image', 'background-position', 'background-repeat'
        ],
        'background-attachment': ['scroll', 'fixed'],
        'background-color': ['transparent', css_color],
        'background-image': ['none', css_url],
        'background-position': [
            2, [css_length, 'top', 'bottom', 'left', 'right', 'center']
        ],
        'background-repeat': [
            'repeat', 'repeat-x', 'repeat-y', 'no-repeat'
        ],
        'border': [true, 'border-color', 'border-style', 'border-width'],
        'border-bottom': [
            true, 'border-bottom-color', 'border-bottom-style',
            'border-bottom-width'
        ],
        'border-bottom-color': css_color,
        'border-bottom-style': css_border_style,
        'border-bottom-width': css_width,
        'border-collapse': ['collapse', 'separate'],
        'border-color': ['transparent', 4, css_color],
        'border-left': [
            true, 'border-left-color', 'border-left-style', 'border-left-width'
        ],
        'border-left-color': css_color,
        'border-left-style': css_border_style,
        'border-left-width': css_width,
        'border-right': [
            true, 'border-right-color', 'border-right-style',
            'border-right-width'
        ],
        'border-right-color': css_color,
        'border-right-style': css_border_style,
        'border-right-width': css_width,
        'border-spacing': [2, css_length],
        'border-style': [4, css_border_style],
        'border-top': [
            true, 'border-top-color', 'border-top-style', 'border-top-width'
        ],
        'border-top-color': css_color,
        'border-top-style': css_border_style,
        'border-top-width': css_width,
        'border-width': [4, css_width],
        bottom: [css_length, 'auto'],
        'caption-side' : ['bottom', 'left', 'right', 'top'],
        clear: ['both', 'left', 'none', 'right'],
        clip: [css_shape, 'auto'],
        color: css_color,
        content: [
            'open-quote', 'close-quote', 'no-open-quote', 'no-close-quote',
            css_string, css_url, css_counter, css_attr
        ],
        'counter-increment': [
            css_name, 'none'
        ],
        'counter-reset': [
            css_name, 'none'
        ],
        cursor: [
            css_url, 'auto', 'crosshair', 'default', 'e-resize', 'help', 'move',
            'n-resize', 'ne-resize', 'nw-resize', 'pointer', 's-resize',
            'se-resize', 'sw-resize', 'w-resize', 'text', 'wait'
        ],
        direction: ['ltr', 'rtl'],
        display: [
            'block', 'compact', 'inline', 'inline-block', 'inline-table',
            'list-item', 'marker', 'none', 'run-in', 'table', 'table-caption',
            'table-cell', 'table-column', 'table-column-group',
            'table-footer-group', 'table-header-group', 'table-row',
            'table-row-group'
        ],
        'empty-cells': ['show', 'hide'],
        'float': ['left', 'none', 'right'],
        font: [
            'caption', 'icon', 'menu', 'message-box', 'small-caption',
            'status-bar', true, 'font-size', 'font-style', 'font-weight',
            'font-family'
        ],
        'font-family': css_comma_list,
        'font-size': [
            'xx-small', 'x-small', 'small', 'medium', 'large', 'x-large',
            'xx-large', 'larger', 'smaller', css_length
        ],
        'font-size-adjust': ['none', css_number],
        'font-stretch': [
            'normal', 'wider', 'narrower', 'ultra-condensed',
            'extra-condensed', 'condensed', 'semi-condensed',
            'semi-expanded', 'expanded', 'extra-expanded'
        ],
        'font-style': [
            'normal', 'italic', 'oblique'
        ],
        'font-variant': [
            'normal', 'small-caps'
        ],
        'font-weight': [
            'normal', 'bold', 'bolder', 'lighter', css_number
        ],
        height: [css_length, 'auto'],
        left: [css_length, 'auto'],
        'letter-spacing': ['normal', css_length],
        'line-height': ['normal', css_line_height],
        'list-style': [
            true, 'list-style-image', 'list-style-position', 'list-style-type'
        ],
        'list-style-image': ['none', css_url],
        'list-style-position': ['inside', 'outside'],
        'list-style-type': [
            'circle', 'disc', 'square', 'decimal', 'decimal-leading-zero',
            'lower-roman', 'upper-roman', 'lower-greek', 'lower-alpha',
            'lower-latin', 'upper-alpha', 'upper-latin', 'hebrew', 'katakana',
            'hiragana-iroha', 'katakana-oroha', 'none'
        ],
        margin: [4, css_margin],
        'margin-bottom': css_margin,
        'margin-left': css_margin,
        'margin-right': css_margin,
        'margin-top': css_margin,
        'marker-offset': [css_length, 'auto'],
        'max-height': [css_length, 'none'],
        'max-width': [css_length, 'none'],
        'min-height': css_length,
        'min-width': css_length,
        opacity: css_number,
        outline: [true, 'outline-color', 'outline-style', 'outline-width'],
        'outline-color': ['invert', css_color],
        'outline-style': [
            'dashed', 'dotted', 'double', 'groove', 'inset', 'none',
            'outset', 'ridge', 'solid'
        ],
        'outline-width': css_width,
        overflow: css_overflow,
        'overflow-x': css_overflow,
        'overflow-y': css_overflow,
        padding: [4, css_length],
        'padding-bottom': css_length,
        'padding-left': css_length,
        'padding-right': css_length,
        'padding-top': css_length,
        'page-break-after': css_break,
        'page-break-before': css_break,
        position: ['absolute', 'fixed', 'relative', 'static'],
        quotes: [8, css_string],
        right: [css_length, 'auto'],
        'table-layout': ['auto', 'fixed'],
        'text-align': ['center', 'justify', 'left', 'right'],
        'text-decoration': [
            'none', 'underline', 'overline', 'line-through', 'blink'
        ],
        'text-indent': css_length,
        'text-shadow': ['none', 4, [css_color, css_length]],
        'text-transform': ['capitalize', 'uppercase', 'lowercase', 'none'],
        top: [css_length, 'auto'],
        'unicode-bidi': ['normal', 'embed', 'bidi-override'],
        'vertical-align': [
            'baseline', 'bottom', 'sub', 'super', 'top', 'text-top', 'middle',
            'text-bottom', css_length
        ],
        visibility: ['visible', 'hidden', 'collapse'],
        'white-space': [
            'normal', 'nowrap', 'pre', 'pre-line', 'pre-wrap', 'inherit'
        ],
        width: [css_length, 'auto'],
        'word-spacing': ['normal', css_length],
        'word-wrap': ['break-word', 'normal'],
        'z-index': ['auto', css_number]
    };

    function style_attribute() {
        var v;
        while (next_token.id === '*' || next_token.id === '#' ||
                next_token.value === '_') {
            if (!option.css) {
                warn('unexpected_a');
            }
            advance();
        }
        if (next_token.id === '-') {
            if (!option.css) {
                warn('unexpected_a');
            }
            advance('-');
            if (!next_token.identifier) {
                warn('expected_nonstandard_style_attribute');
            }
            advance();
            return css_any;
        } else {
            if (!next_token.identifier) {
                warn('expected_style_attribute');
            } else {
                if (Object.prototype.hasOwnProperty.call(css_attribute_data, next_token.value)) {
                    v = css_attribute_data[next_token.value];
                } else {
                    v = css_any;
                    if (!option.css) {
                        warn('unrecognized_style_attribute_a');
                    }
                }
            }
            advance();
            return v;
        }
    }


    function style_value(v) {
        var i = 0,
            n,
            once,
            match,
            round,
            start = 0,
            vi;
        switch (typeof v) {
        case 'function':
            return v();
        case 'string':
            if (next_token.identifier && next_token.value === v) {
                advance();
                return true;
            }
            return false;
        }
        for (;;) {
            if (i >= v.length) {
                return false;
            }
            vi = v[i];
            i += 1;
            if (vi === true) {
                break;
            } else if (typeof vi === 'number') {
                n = vi;
                vi = v[i];
                i += 1;
            } else {
                n = 1;
            }
            match = false;
            while (n > 0) {
                if (style_value(vi)) {
                    match = true;
                    n -= 1;
                } else {
                    break;
                }
            }
            if (match) {
                return true;
            }
        }
        start = i;
        once = [];
        for (;;) {
            round = false;
            for (i = start; i < v.length; i += 1) {
                if (!once[i]) {
                    if (style_value(css_attribute_data[v[i]])) {
                        match = true;
                        round = true;
                        once[i] = true;
                        break;
                    }
                }
            }
            if (!round) {
                return match;
            }
        }
    }

    function style_child() {
        if (next_token.arity === 'number') {
            advance();
            if (next_token.value === 'n' && next_token.identifier) {
                no_space_only();
                advance();
                if (next_token.id === '+') {
                    no_space_only();
                    advance('+');
                    no_space_only();
                    advance('(number)');
                }
            }
            return;
        } else {
            if (next_token.identifier &&
                    (next_token.value === 'odd' || next_token.value === 'even')) {
                advance();
                return;
            }
        }
        warn('unexpected_a');
    }

    function substyle() {
        var v;
        for (;;) {
            if (next_token.id === '}' || next_token.id === '(end)' ||
                    (xquote && next_token.id === xquote)) {
                return;
            }
            while (next_token.id === ';') {
                warn('unexpected_a');
                semicolon();
            }
            v = style_attribute();
            advance(':');
            if (next_token.identifier && next_token.value === 'inherit') {
                advance();
            } else {
                if (!style_value(v)) {
                    warn('unexpected_a');
                    advance();
                }
            }
            if (next_token.id === '!') {
                advance('!');
                no_space_only();
                if (next_token.identifier && next_token.value === 'important') {
                    advance();
                } else {
                    warn('expected_a_b',
                        next_token, 'important', next_token.value);
                }
            }
            if (next_token.id === '}' || next_token.id === xquote) {
                warn('expected_a_b', next_token, ';', next_token.value);
            } else {
                semicolon();
            }
        }
    }

    function style_selector() {
        if (next_token.identifier) {
            if (!Object.prototype.hasOwnProperty.call(html_tag, option.cap ?
                    next_token.value.toLowerCase() : next_token.value)) {
                warn('expected_tagname_a');
            }
            advance();
        } else {
            switch (next_token.id) {
            case '>':
            case '+':
                advance();
                style_selector();
                break;
            case ':':
                advance(':');
                switch (next_token.value) {
                case 'active':
                case 'after':
                case 'before':
                case 'checked':
                case 'disabled':
                case 'empty':
                case 'enabled':
                case 'first-child':
                case 'first-letter':
                case 'first-line':
                case 'first-of-type':
                case 'focus':
                case 'hover':
                case 'last-child':
                case 'last-of-type':
                case 'link':
                case 'only-of-type':
                case 'root':
                case 'target':
                case 'visited':
                    advance();
                    break;
                case 'lang':
                    advance();
                    advance('(');
                    if (!next_token.identifier) {
                        warn('expected_lang_a');
                    }
                    advance(')');
                    break;
                case 'nth-child':
                case 'nth-last-child':
                case 'nth-last-of-type':
                case 'nth-of-type':
                    advance();
                    advance('(');
                    style_child();
                    advance(')');
                    break;
                case 'not':
                    advance();
                    advance('(');
                    if (next_token.id === ':' && peek(0).value === 'not') {
                        warn('not');
                    }
                    style_selector();
                    advance(')');
                    break;
                default:
                    warn('expected_pseudo_a');
                }
                break;
            case '#':
                advance('#');
                if (!next_token.identifier) {
                    warn('expected_id_a');
                }
                advance();
                break;
            case '*':
                advance('*');
                break;
            case '.':
                advance('.');
                if (!next_token.identifier) {
                    warn('expected_class_a');
                }
                advance();
                break;
            case '[':
                advance('[');
                if (!next_token.identifier) {
                    warn('expected_attribute_a');
                }
                advance();
                if (next_token.id === '=' || next_token.value === '~=' ||
                        next_token.value === '$=' ||
                        next_token.value === '|=' ||
                        next_token.id === '*=' ||
                        next_token.id === '^=') {
                    advance();
                    if (next_token.arity !== 'string') {
                        warn('expected_string_a');
                    }
                    advance();
                }
                advance(']');
                break;
            default:
                stop('expected_selector_a');
            }
        }
    }

    function style_pattern() {
        if (next_token.id === '{') {
            warn('expected_style_pattern');
        }
        for (;;) {
            style_selector();
            if (next_token.id === '</' || next_token.id === '{' ||
                    next_token.id === '(end)') {
                return '';
            }
            if (next_token.id === ',') {
                comma();
            }
        }
    }

    function style_list() {
        while (next_token.id !== '</' && next_token.id !== '(end)') {
            style_pattern();
            xmode = 'styleproperty';
            if (next_token.id === ';') {
                semicolon();
            } else {
                advance('{');
                substyle();
                xmode = 'style';
                advance('}');
            }
        }
    }

    function styles() {
        var i;
        while (next_token.id === '@') {
            i = peek();
            advance('@');
            if (next_token.identifier) {
                switch (next_token.value) {
                case 'import':
                    advance();
                    if (!css_url()) {
                        warn('expected_a_b',
                            next_token, 'url', next_token.value);
                        advance();
                    }
                    semicolon();
                    break;
                case 'media':
                    advance();
                    for (;;) {
                        if (!next_token.identifier || css_media[next_token.value] === true) {
                            stop('expected_media_a');
                        }
                        advance();
                        if (next_token.id !== ',') {
                            break;
                        }
                        comma();
                    }
                    advance('{');
                    style_list();
                    advance('}');
                    break;
                default:
                    warn('expected_at_a');
                }
            } else {
                warn('expected_at_a');
            }
        }
        style_list();
    }


// Parse HTML

    function do_begin(n) {
        if (n !== 'html' && !option.fragment) {
            if (n === 'div' && option.adsafe) {
                stop('adsafe_fragment');
            } else {
                stop('expected_a_b', token, 'html', n);
            }
        }
        if (option.adsafe) {
            if (n === 'html') {
                stop('adsafe_html', token);
            }
            if (option.fragment) {
                if (n !== 'div') {
                    stop('adsafe_div', token);
                }
            } else {
                stop('adsafe_fragment', token);
            }
        }
        option.browser = true;
        assume();
    }

    function do_attribute(n, a, v) {
        var u, x;
        if (a === 'id') {
            u = typeof v === 'string' ? v.toUpperCase() : '';
            if (ids[u] === true) {
                warn('duplicate_a', next_token, v);
            }
            if (!/^[A-Za-z][A-Za-z0-9._:\-]*$/.test(v)) {
                warn('bad_id_a', next_token, v);
            } else if (option.adsafe) {
                if (adsafe_id) {
                    if (v.slice(0, adsafe_id.length) !== adsafe_id) {
                        warn('adsafe_prefix_a', next_token, adsafe_id);
                    } else if (!/^[A-Z]+_[A-Z]+$/.test(v)) {
                        warn('adsafe_bad_id');
                    }
                } else {
                    adsafe_id = v;
                    if (!/^[A-Z]+_$/.test(v)) {
                        warn('adsafe_bad_id');
                    }
                }
            }
            x = v.search(dx);
            if (x >= 0) {
                warn('unexpected_char_a_b', token, v.charAt(x), a);
            }
            ids[u] = true;
        } else if (a === 'class' || a === 'type' || a === 'name') {
            x = v.search(qx);
            if (x >= 0) {
                warn('unexpected_char_a_b', token, v.charAt(x), a);
            }
            ids[u] = true;
        } else if (a === 'href' || a === 'background' ||
                a === 'content' || a === 'data' ||
                a.indexOf('src') >= 0 || a.indexOf('url') >= 0) {
            if (option.safe && ux.test(v)) {
                stop('bad_url', next_token, v);
            }
            urls.push(v);
        } else if (a === 'for') {
            if (option.adsafe) {
                if (adsafe_id) {
                    if (v.slice(0, adsafe_id.length) !== adsafe_id) {
                        warn('adsafe_prefix_a', next_token, adsafe_id);
                    } else if (!/^[A-Z]+_[A-Z]+$/.test(v)) {
                        warn('adsafe_bad_id');
                    }
                } else {
                    warn('adsafe_bad_id');
                }
            }
        } else if (a === 'name') {
            if (option.adsafe && v.indexOf('_') >= 0) {
                warn('adsafe_name_a', next_token, v);
            }
        }
    }

    function do_tag(name, attribute) {
        var i, tag = html_tag[name], script, x;
        src = false;
        if (!tag) {
            stop(
                bundle.unrecognized_tag_a,
                next_token,
                name === name.toLowerCase() ? name : name + ' (capitalization error)'
            );
        }
        if (stack.length > 0) {
            if (name === 'html') {
                stop('unexpected_a', token, name);
            }
            x = tag.parent;
            if (x) {
                if (x.indexOf(' ' + stack[stack.length - 1].name + ' ') < 0) {
                    stop('tag_a_in_b', token, name, x);
                }
            } else if (!option.adsafe && !option.fragment) {
                i = stack.length;
                do {
                    if (i <= 0) {
                        stop('tag_a_in_b', token, name, 'body');
                    }
                    i -= 1;
                } while (stack[i].name !== 'body');
            }
        }
        switch (name) {
        case 'div':
            if (option.adsafe && stack.length === 1 && !adsafe_id) {
                warn('adsafe_missing_id');
            }
            break;
        case 'script':
            xmode = 'script';
            advance('>');
            if (attribute.lang) {
                warn('lang', token);
            }
            if (option.adsafe && stack.length !== 1) {
                warn('adsafe_placement', token);
            }
            if (attribute.src) {
                if (option.adsafe && (!adsafe_may || !approved[attribute.src])) {
                    warn('adsafe_source', token);
                }
                if (attribute.type) {
                    warn('type', token);
                }
            } else {
                step_in(next_token.from);
                edge();
                use_strict();
                adsafe_top = true;
                script = statements();

// JSLint is also the static analyzer for ADsafe. See www.ADsafe.org.

                if (option.adsafe) {
                    if (adsafe_went) {
                        stop('adsafe_script', token);
                    }
                    if (script.length !== 1 ||
                            aint(script[0],             'id',    '(') ||
                            aint(script[0].first,       'id',    '.') ||
                            aint(script[0].first.first, 'value', 'ADSAFE') ||
                            aint(script[0].second[0],   'value', adsafe_id)) {
                        stop('adsafe_id_go');
                    }
                    switch (script[0].first.second.value) {
                    case 'id':
                        if (adsafe_may || adsafe_went ||
                                script[0].second.length !== 1) {
                            stop('adsafe_id', next_token);
                        }
                        adsafe_may = true;
                        break;
                    case 'go':
                        if (adsafe_went) {
                            stop('adsafe_go');
                        }
                        if (script[0].second.length !== 2 ||
                                aint(script[0].second[1], 'id', 'function') ||
                                !script[0].second[1].first ||
                                script[0].second[1].first.length !== 2 ||
                                aint(script[0].second[1].first[0], 'value', 'dom') ||
                                aint(script[0].second[1].first[1], 'value', 'lib')) {
                            stop('adsafe_go', next_token);
                        }
                        adsafe_went = true;
                        break;
                    default:
                        stop('adsafe_id_go');
                    }
                }
                indent = null;
            }
            xmode = 'html';
            advance('</');
            if (!next_token.identifier && next_token.value !== 'script') {
                warn('expected_a_b', next_token, 'script', next_token.value);
            }
            advance();
            xmode = 'outer';
            break;
        case 'style':
            xmode = 'style';
            advance('>');
            styles();
            xmode = 'html';
            advance('</');
            if (!next_token.identifier && next_token.value !== 'style') {
                warn('expected_a_b', next_token, 'style', next_token.value);
            }
            advance();
            xmode = 'outer';
            break;
        case 'input':
            switch (attribute.type) {
            case 'radio':
            case 'checkbox':
            case 'button':
            case 'reset':
            case 'submit':
                break;
            case 'text':
            case 'file':
            case 'password':
            case 'file':
            case 'hidden':
            case 'image':
                if (option.adsafe && attribute.autocomplete !== 'off') {
                    warn('adsafe_autocomplete');
                }
                break;
            default:
                warn('bad_type');
            }
            break;
        case 'applet':
        case 'body':
        case 'embed':
        case 'frame':
        case 'frameset':
        case 'head':
        case 'iframe':
        case 'noembed':
        case 'noframes':
        case 'object':
        case 'param':
            if (option.adsafe) {
                warn('adsafe_tag', next_token, name);
            }
            break;
        }
    }


    function closetag(name) {
        return '</' + name + '>';
    }

    function html() {
        var attribute, attributes, is_empty, name, old_white = option.white,
            quote, tag_name, tag, wmode;
        xmode = 'html';
        xquote = '';
        stack = null;
        for (;;) {
            switch (next_token.value) {
            case '<':
                xmode = 'html';
                advance('<');
                attributes = {};
                tag_name = next_token;
                if (!tag_name.identifier) {
                    warn('bad_name_a', tag_name);
                }
                name = tag_name.value;
                if (option.cap) {
                    name = name.toLowerCase();
                }
                tag_name.name = name;
                advance();
                if (!stack) {
                    stack = [];
                    do_begin(name);
                }
                tag = html_tag[name];
                if (typeof tag !== 'object') {
                    stop('unrecognized_tag_a', tag_name, name);
                }
                is_empty = tag.empty;
                tag_name.type = name;
                for (;;) {
                    if (next_token.id === '/') {
                        advance('/');
                        if (next_token.id !== '>') {
                            warn('expected_a_b', next_token, '>', next_token.value);
                        }
                        break;
                    }
                    if (next_token.id && next_token.id.substr(0, 1) === '>') {
                        break;
                    }
                    if (!next_token.identifier) {
                        if (next_token.id === '(end)' || next_token.id === '(error)') {
                            warn('expected_a_b', next_token, '>', next_token.value);
                        }
                        warn('bad_name_a');
                    }
                    option.white = true;
                    spaces();
                    attribute = next_token.value;
                    option.white = old_white;
                    advance();
                    if (!option.cap && attribute !== attribute.toLowerCase()) {
                        warn('attribute_case_a', token);
                    }
                    attribute = attribute.toLowerCase();
                    xquote = '';
                    if (Object.prototype.hasOwnProperty.call(attributes, attribute)) {
                        warn('duplicate_a', token, attribute);
                    }
                    if (attribute.slice(0, 2) === 'on') {
                        if (!option.on) {
                            warn('html_handlers');
                        }
                        xmode = 'scriptstring';
                        advance('=');
                        quote = next_token.id;
                        if (quote !== '"' && quote !== '\'') {
                            stop('expected_a_b', next_token, '"', next_token.value);
                        }
                        xquote = quote;
                        wmode = option.white;
                        option.white = false;
                        advance(quote);
                        use_strict();
                        statements();
                        option.white = wmode;
                        if (next_token.id !== quote) {
                            stop('expected_a_b', next_token, quote, next_token.value);
                        }
                        xmode = 'html';
                        xquote = '';
                        advance(quote);
                        tag = false;
                    } else if (attribute === 'style') {
                        xmode = 'scriptstring';
                        advance('=');
                        quote = next_token.id;
                        if (quote !== '"' && quote !== '\'') {
                            stop('expected_a_b', next_token, '"', next_token.value);
                        }
                        xmode = 'styleproperty';
                        xquote = quote;
                        advance(quote);
                        substyle();
                        xmode = 'html';
                        xquote = '';
                        advance(quote);
                        tag = false;
                    } else {
                        if (next_token.id === '=') {
                            advance('=');
                            tag = next_token.value;
                            if (!next_token.identifier &&
                                    next_token.id !== '"' &&
                                    next_token.id !== '\'' &&
                                    next_token.arity !== 'string' &&
                                    next_token.arity !== 'number' &&
                                    next_token.id !== '(color)') {
                                warn('expected_attribute_value_a', token, attribute);
                            }
                            advance();
                        } else {
                            tag = true;
                        }
                    }
                    attributes[attribute] = tag;
                    do_attribute(name, attribute, tag);
                }
                do_tag(name, attributes);
                if (!is_empty) {
                    stack.push(tag_name);
                }
                xmode = 'outer';
                advance('>');
                break;
            case '</':
                xmode = 'html';
                advance('</');
                if (!next_token.identifier) {
                    warn('bad_name_a');
                }
                name = next_token.value;
                if (option.cap) {
                    name = name.toLowerCase();
                }
                advance();
                if (!stack) {
                    stop('unexpected_a', next_token, closetag(name));
                }
                tag_name = stack.pop();
                if (!tag_name) {
                    stop('unexpected_a', next_token, closetag(name));
                }
                if (tag_name.name !== name) {
                    stop('expected_a_b',
                        next_token, closetag(tag_name.name), closetag(name));
                }
                if (next_token.id !== '>') {
                    stop('expected_a_b', next_token, '>', next_token.value);
                }
                xmode = 'outer';
                advance('>');
                break;
            case '<!':
                if (option.safe) {
                    warn('adsafe_a');
                }
                xmode = 'html';
                for (;;) {
                    advance();
                    if (next_token.id === '>' || next_token.id === '(end)') {
                        break;
                    }
                    if (next_token.value.indexOf('--') >= 0) {
                        stop('unexpected_a', next_token, '--');
                    }
                    if (next_token.value.indexOf('<') >= 0) {
                        stop('unexpected_a', next_token, '<');
                    }
                    if (next_token.value.indexOf('>') >= 0) {
                        stop('unexpected_a', next_token, '>');
                    }
                }
                xmode = 'outer';
                advance('>');
                break;
            case '(end)':
                return;
            default:
                if (next_token.id === '(end)') {
                    stop('missing_a', next_token,
                        '</' + stack[stack.length - 1].value + '>');
                } else {
                    advance();
                }
            }
            if (stack && stack.length === 0 && (option.adsafe ||
                    !option.fragment || next_token.id === '(end)')) {
                break;
            }
        }
        if (next_token.id !== '(end)') {
            stop('unexpected_a');
        }
    }


// The actual JSLINT function itself.

    var itself = function (the_source, the_option) {
        var i, keys, predef, tree;
        JSLINT.comments = [];
        JSLINT.errors = [];
        JSLINT.tree = '';
        begin = older_token = prev_token = token = next_token =
            Object.create(syntax['(begin)']);
        predefined = Object.create(standard);
        if (the_option) {
            option = Object.create(the_option);
            predef = option.predef;
            if (predef) {
                if (Array.isArray(predef)) {
                    for (i = 0; i < predef.length; i += 1) {
                        predefined[predef[i]] = true;
                    }
                } else if (typeof predef === 'object') {
                    keys = Object.keys(predef);
                    for (i = 0; i < keys.length; i += 1) {
                        predefined[keys[i]] = !!predef[keys];
                    }
                }
            }
            if (option.adsafe) {
                option.safe = true;
            }
            if (option.safe) {
                option.browser     =
                    option['continue'] =
                    option.css     =
                    option.debug   =
                    option.devel   =
                    option.evil    =
                    option.forin   =
                    option.on      =
                    option.rhino   =
                    option.sub     =
                    option.widget  =
                    option.windows = false;

                option.nomen       =
                    option.strict  =
                    option.undef   = true;

                predefined.Date         =
                    predefined['eval']  =
                    predefined.Function =
                    predefined.Object   = null;

                predefined.ADSAFE  =
                    predefined.lib = false;
            }
        } else {
            option = {};
        }
        option.indent = +option.indent || 0;
        option.maxerr = option.maxerr || 50;
        adsafe_id = '';
        adsafe_may = adsafe_top = adsafe_went = false;
        approved = {};
        if (option.approved) {
            for (i = 0; i < option.approved.length; i += 1) {
                approved[option.approved[i]] = option.approved[i];
            }
        } else {
            approved.test = 'test';
        }
        tab = '';
        for (i = 0; i < option.indent; i += 1) {
            tab += ' ';
        }
        global = Object.create(predefined);
        scope = global;
        funct = {
            '(global)': true,
            '(name)': '(global)',
            '(scope)': scope,
            '(breakage)': 0,
            '(loopage)': 0
        };
        functions = [funct];

        comments_off = false;
        ids = {};
        implied = {};
        in_block = false;
        indent = false;
        json_mode = false;
        lookahead = [];
        member = {};
        properties = null;
        prereg = true;
        src = false;
        stack = null;
        strict_mode = false;
        urls = [];
        var_mode = false;
        warnings = 0;
        xmode = false;
        lex.init(the_source);

        assume();

        try {
            advance();
            if (next_token.arity === 'number') {
                stop('unexpected_a');
            } else if (next_token.value.charAt(0) === '<') {
                html();
                if (option.adsafe && !adsafe_went) {
                    warn('adsafe_go', this);
                }
            } else {
                switch (next_token.id) {
                case '{':
                case '[':
                    json_mode = true;
                    json_value();
                    break;
                case '@':
                case '*':
                case '#':
                case '.':
                case ':':
                    xmode = 'style';
                    advance();
                    if (token.id !== '@' || !next_token.identifier ||
                            next_token.value !== 'charset' || token.line !== 1 ||
                            token.from !== 1) {
                        stop('css');
                    }
                    advance();
                    if (next_token.arity !== 'string' &&
                            next_token.value !== 'UTF-8') {
                        stop('css');
                    }
                    advance();
                    semicolon();
                    styles();
                    break;

                default:
                    if (option.adsafe && option.fragment) {
                        stop('expected_a_b',
                            next_token, '<div>', next_token.value);
                    }

// If the first token is predef semicolon, ignore it. This is sometimes used when
// files are intended to be appended to files that may be sloppy. predef sloppy
// file may be depending on semicolon insertion on its last line.

                    step_in(1);
                    if (next_token.id === ';') {
                        semicolon();
                    }
                    if (next_token.value === 'use strict') {
                        warn('function_strict');
                        use_strict();
                    }
                    adsafe_top = true;
                    tree = statements();
                    begin.first = tree;
                    JSLINT.tree = begin;
                    if (option.adsafe && (tree.length !== 1 ||
                            aint(tree[0], 'id', '(') ||
                            aint(tree[0].first, 'id', '.') ||
                            aint(tree[0].first.first, 'value', 'ADSAFE') ||
                            aint(tree[0].first.second, 'value', 'lib') ||
                            tree[0].second.length !== 2 ||
                            tree[0].second[0].arity !== 'string' ||
                            aint(tree[0].second[1], 'id', 'function'))) {
                        stop('adsafe_lib');
                    }
                    if (tree.disrupt) {
                        warn('weird_program', prev_token);
                    }
                }
            }
            indent = null;
            advance('(end)');
        } catch (e) {
            if (e) {        // `~
                JSLINT.errors.push({
                    reason    : e.message,
                    line      : e.line || next_token.line,
                    character : e.character || next_token.from
                }, null);
            }
        }
        return JSLINT.errors.length === 0;
    };


// Data summary.

    itself.data = function () {
        var data = {functions: []},
            function_data,
            globals,
            i,
            implieds = [],
            j,
            kind,
            members = [],
            name,
            the_function,
            unused = [];
        if (itself.errors.length) {
            data.errors = itself.errors;
        }

        if (json_mode) {
            data.json = true;
        }

        for (name in implied) {
            if (Object.prototype.hasOwnProperty.call(implied, name)) {
                implieds.push({
                    name: name,
                    line: implied[name]
                });
            }
        }
        if (implieds.length > 0) {
            data.implieds = implieds;
        }

        if (urls.length > 0) {
            data.urls = urls;
        }

        globals = Object.keys(functions[0]).filter(function (value) {
            return value.charAt(0) !== '(' ? value : undefined;
        });
        if (globals.length > 0) {
            data.globals = globals;
        }

        for (i = 1; i < functions.length; i += 1) {
            the_function = functions[i];
            function_data = {};
            for (j = 0; j < functionicity.length; j += 1) {
                function_data[functionicity[j]] = [];
            }
            for (name in the_function) {
                if (Object.prototype.hasOwnProperty.call(the_function, name)) {
                    if (name.charAt(0) !== '(') {
                        kind = the_function[name];
                        if (kind === 'unction') {
                            kind = 'unused';
                        } else if (typeof kind === 'boolean') {
                            kind = 'global';
                        }
                        if (Array.isArray(function_data[kind])) {
                            function_data[kind].push(name);
                            if (kind === 'unused') {
                                unused.push({
                                    name: name,
                                    line: the_function['(line)'],
                                    'function': the_function['(name)']
                                });
                            }
                        }
                    }
                }
            }
            for (j = 0; j < functionicity.length; j += 1) {
                if (function_data[functionicity[j]].length === 0) {
                    delete function_data[functionicity[j]];
                }
            }
            function_data.name = the_function['(name)'];
            function_data.param = the_function['(params)'];
            function_data.line = the_function['(line)'];
            data.functions.push(function_data);
        }

        if (unused.length > 0) {
            data.unused = unused;
        }

        members = [];
        for (name in member) {
            if (typeof member[name] === 'number') {
                data.member = member;
                break;
            }
        }

        return data;
    };


    itself.report = function (errors_only) {
        var data = itself.data();

        var err, evidence, i, j, key, keys, length, mem = '', name, names,
            output = [], snippets, the_function, warning;

        function detail(h, array) {
            var comma_needed, i, singularity;
            if (array) {
                output.push('<div><i>' + h + '</i> ');
                array = array.sort();
                for (i = 0; i < array.length; i += 1) {
                    if (array[i] !== singularity) {
                        singularity = array[i];
                        output.push((comma_needed ? ', ' : '') + singularity);
                        comma_needed = true;
                    }
                }
                output.push('</div>');
            }
        }

        if (data.errors || data.implieds || data.unused) {
            err = true;
            output.push('<div id=errors><i>Error:</i>');
            if (data.errors) {
                for (i = 0; i < data.errors.length; i += 1) {
                    warning = data.errors[i];
                    if (warning) {
                        evidence = warning.evidence || '';
                        output.push('<p>Problem' + (isFinite(warning.line) ? ' at line ' +
                            warning.line + ' character ' + warning.character : '') +
                            ': ' + warning.reason.entityify() +
                            '</p><p class=evidence>' +
                            (evidence && (evidence.length > 80 ? evidence.slice(0, 77) + '...' :
                            evidence).entityify()) + '</p>');
                    }
                }
            }

            if (data.implieds) {
                snippets = [];
                for (i = 0; i < data.implieds.length; i += 1) {
                    snippets[i] = '<code>' + data.implieds[i].name + '</code>&nbsp;<i>' +
                        data.implieds[i].line + '</i>';
                }
                output.push('<p><i>Implied global:</i> ' + snippets.join(', ') + '</p>');
            }

            if (data.unused) {
                snippets = [];
                for (i = 0; i < data.unused.length; i += 1) {
                    snippets[i] = '<code><u>' + data.unused[i].name + '</u></code>&nbsp;<i>' +
                        data.unused[i].line + ' </i> <small>' +
                        data.unused[i]['function'] + '</small>';
                }
                output.push('<p><i>Unused variable:</i> ' + snippets.join(', ') + '</p>');
            }
            if (data.json) {
                output.push('<p>JSON: bad.</p>');
            }
            output.push('</div>');
        }

        if (!errors_only) {

            output.push('<br><div id=functions>');

            if (data.urls) {
                detail("URLs<br>", data.urls, '<br>');
            }

            if (xmode === 'style') {
                output.push('<p>CSS.</p>');
            } else if (data.json && !err) {
                output.push('<p>JSON: good.</p>');
            } else if (data.globals) {
                output.push('<div><i>Global</i> ' +
                    data.globals.sort().join(', ') + '</div>');
            } else {
                output.push('<div><i>No new global variables introduced.</i></div>');
            }

            for (i = 0; i < data.functions.length; i += 1) {
                the_function = data.functions[i];
                names = [];
                if (the_function.param) {
                    for (j = 0; j < the_function.param.length; j += 1) {
                        names[j] = the_function.param[j].value;
                    }
                }
                output.push('<br><div class=function><i>' + the_function.line + '</i> ' +
                    (the_function.name || '') + '(' + names.join(', ') + ')</div>');
                detail('<big><b>Unused</b></big>', the_function.unused);
                detail('Closure', the_function.closure);
                detail('Variable', the_function['var']);
                detail('Exception', the_function.exception);
                detail('Outer', the_function.outer);
                detail('Global', the_function.global);
                detail('Label', the_function.label);
            }

            if (data.member) {
                keys = Object.keys(data.member);
                if (keys.length) {
                    keys = keys.sort();
                    mem = '<br><pre id=properties>/*properties ';
                    length = 13;
                    for (i = 0; i < keys.length; i += 1) {
                        key = keys[i];
                        name = ix.test(key) ? key :
                            '"' + key.entityify().replace(nx, sanitize) + '"';
                        if (length + name.length > 72) {
                            output.push(mem + '<br>');
                            mem = '    ';
                            length = 1;
                        }
                        length += name.length + 2;
                        if (data.member[key] === 1) {
                            name = '<i>' + name + '</i>';
                        }
                        if (i < keys.length - 1) {
                            name += ', ';
                        }
                        mem += name;
                    }
                    output.push(mem + '<br>*/</pre>');
                }
                output.push('</div>');
            }
        }
        return output.join('');
    };
    itself.jslint = itself;

    itself.edition = '2011-04-21';

    return itself;

}());

var input = 
"// jslint.js\n// 2011-04-21\n\n// Copyright (c) 2002 Douglas Crockford  (www.JSLint.com)\n\n// Permission is hereby granted, free of charge, to any person obtaining a copy\n// of this software and associated documentation files (the \"Software\"), to deal\n// in the Software without restriction, including without limitation the rights\n// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n// copies of the Software, and to permit persons to whom the Software is\n// furnished to do so, subject to the following conditions:\n\n// The above copyright notice and this permission notice shall be included in\n// all copies or substantial portions of the Software.\n\n// The Software shall be used for Good, not Evil.\n\n// THE SOFTWARE IS PROVIDED \"AS IS\", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\n// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\n// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\n// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\n// SOFTWARE.\n\n\n// JSLINT is a global function. It takes two parameters.\n\n//     var myResult = JSLINT(source, option);\n\n// The first parameter is either a string or an array of strings. If it is a\n// string, it will be split on '\\n' or '\\r'. If it is an array of strings, it\n// is assumed that each string represents one line. The source can be a\n// JavaScript text, or HTML text, or a JSON text, or a CSS text.\n\n// The second parameter is an optional object of options that control the\n// operation of JSLINT. Most of the options are booleans: They are all\n// optional and have a default value of false. One of the options, predef,\n// can be an array of names, which will be used to declare global variables,\n// or an object whose keys are used as global names, with a boolean value\n// that determines if they are assignable.\n\n// If it checks out, JSLINT returns true. Otherwise, it returns false.\n\n// If false, you can inspect JSLINT.errors to find out the problems.\n// JSLINT.errors is an array of objects containing these properties:\n\n//  {\n//      line      : The line (relative to 0) at which the lint was found\n//      character : The character (relative to 0) at which the lint was found\n//      reason    : The problem\n//      evidence  : The text line in which the problem occurred\n//      raw       : The raw message before the details were inserted\n//      a         : The first detail\n//      b         : The second detail\n//      c         : The third detail\n//      d         : The fourth detail\n//  }\n\n// If a stopping error was found, a null will be the last element of the\n// JSLINT.errors array. A stopping error means that JSLint was not confident\n// enough to continue. It does not necessarily mean that the error was\n// especailly heinous.\n\n// You can request a Function Report, which shows all of the functions\n// and the parameters and vars that they use. This can be used to find\n// implied global variables and other problems. The report is in HTML and\n// can be inserted in an HTML <body>.\n\n//     var myReport = JSLINT.report(errors_only);\n\n// If errors_only is true, then the report will be limited to only errors.\n\n// You can request a data structure that contains JSLint's results.\n\n//     var myData = JSLINT.data();\n\n// It returns a structure with this form:\n\n//     {\n//         errors: [\n//             {\n//                 line: NUMBER,\n//                 character: NUMBER,\n//                 reason: STRING,\n//                 evidence: STRING\n//             }\n//         ],\n//         functions: [\n//             name: STRING,\n//             line: NUMBER,\n//             last: NUMBER,\n//             param: [\n//                 TOKEN\n//             ],\n//             closure: [\n//                 STRING\n//             ],\n//             var: [\n//                 STRING\n//             ],\n//             exception: [\n//                 STRING\n//             ],\n//             outer: [\n//                 STRING\n//             ],\n//             unused: [\n//                 STRING\n//             ],\n//             global: [\n//                 STRING\n//             ],\n//             label: [\n//                 STRING\n//             ]\n//         ],\n//         globals: [\n//             STRING\n//         ],\n//         member: {\n//             STRING: NUMBER\n//         },\n//         unuseds: [\n//             {\n//                 name: STRING,\n//                 line: NUMBER\n//             }\n//         ],\n//         implieds: [\n//             {\n//                 name: STRING,\n//                 line: NUMBER\n//             }\n//         ],\n//         urls: [\n//             STRING\n//         ],\n//         json: BOOLEAN\n//     }\n\n// Empty arrays will not be included.\n\n// You can obtain the parse tree that JSLint constructed while parsing. The\n// latest tree is kept in JSLINT.tree. A nice stringication can be produced\n// with\n\n//     JSON.stringify(JSLINT.tree, [\n//         'value',  'arity', 'name',  'first',\n//         'second', 'third', 'block', 'else'\n//     ], 4));\n\n// JSLint provides three directives. They look like slashstar comments, and\n// allow for setting options, declaring global variables, and establishing a\n// set of allowed property names.\n\n// These directives respect function scope.\n\n// The jslint directive is a special comment that can set one or more options.\n// The current option set is\n\n//     adsafe     true, if ADsafe rules should be enforced\n//     bitwise    true, if bitwise operators should not be allowed\n//     browser    true, if the standard browser globals should be predefined\n//     cap        true, if upper case HTML should be allowed\n//     'continue' true, if the continuation statement should be tolerated\n//     css        true, if CSS workarounds should be tolerated\n//     debug      true, if debugger statements should be allowed\n//     devel      true, if logging should be allowed (console, alert, etc.)\n//     es5        true, if ES5 syntax should be allowed\n//     evil       true, if eval should be allowed\n//     forin      true, if for in statements need not filter\n//     fragment   true, if HTML fragments should be allowed\n//     indent     the indentation factor\n//     maxerr     the maximum number of errors to allow\n//     maxlen     the maximum length of a source line\n//     newcap     true, if constructor names must be capitalized\n//     node       true, if Node.js globals should be predefined\n//     nomen      true, if names should be checked\n//     on         true, if HTML event handlers should be allowed\n//     onevar     true, if only one var statement per function should be allowed\n//     passfail   true, if the scan should stop on first error\n//     plusplus   true, if increment/decrement should not be allowed\n//     regexp     true, if the . should not be allowed in regexp literals\n//     rhino      true, if the Rhino environment globals should be predefined\n//     undef      true, if variables should be declared before used\n//     safe       true, if use of some browser features should be restricted\n//     windows    true, if MS Windows-specific globals should be predefined\n//     strict     true, require the \"use strict\"; pragma\n//     sub        true, if all forms of subscript notation are tolerated\n//     white      true, if strict whitespace rules apply\n//     widget     true  if the Yahoo Widgets globals should be predefined\n\n// For example:\n\n/*jslint\n    evil: true, nomen: false, onevar: false, regexp: false, strict: true\n*/\n\n// The properties directive declares an exclusive list of property names.\n// Any properties named in the program that are not in the list will\n// produce a warning.\n\n// For example:\n\n/*properties \"\\b\", \"\\t\", \"\\n\", \"\\f\", \"\\r\", \"!=\", \"!==\", \"\\\"\", \"%\",\n    \"&\", \"'\", \"(begin)\", \"(breakage)\", \"(context)\", \"(error)\",\n    \"(global)\", \"(identifier)\", \"(line)\", \"(loopage)\", \"(name)\", \"(onevar)\",\n    \"(params)\", \"(scope)\", \"(statement)\", \"(token)\", \"(verb)\", \")\", \"*\",\n    \"+\", \"-\", \"/\", \";\", \"<\", \"<<\", \"<=\", \"==\", \"===\",\n    \">\", \">=\", \">>\", \">>>\", ADSAFE, ActiveXObject, Array, Boolean, Buffer,\n    COM, CScript, Canvas, CustomAnimation, Date, Debug, E, Enumerator,\n    Error, EvalError, FadeAnimation, Flash, FormField, Frame, Function,\n    HotKey, Image, JSON, LN10, LN2, LOG10E, LOG2E, MAX_VALUE, MIN_VALUE,\n    Math, MenuItem, MoveAnimation, NEGATIVE_INFINITY, Number, Object,\n    Option, PI, POSITIVE_INFINITY, Point, RangeError, Rectangle,\n    ReferenceError, RegExp, ResizeAnimation, RotateAnimation, SQRT1_2,\n    SQRT2, ScrollBar, String, Style, SyntaxError, System, Text, TextArea,\n    Timer, TypeError, URIError, URL, VBArray, WScript, Web, Window, XMLDOM,\n    XMLHttpRequest, \"\\\\\", \"^\", __dirname, __filename, a, a_function,\n    a_label, a_not_allowed, a_not_defined, a_scope, abbr, acronym,\n    activeborder, activecaption, address, adsafe, adsafe_a,\n    adsafe_autocomplete, adsafe_bad_id, adsafe_div, adsafe_fragment,\n    adsafe_go, adsafe_html, adsafe_id, adsafe_id_go, adsafe_lib,\n    adsafe_lib_second, adsafe_missing_id, adsafe_name_a, adsafe_placement,\n    adsafe_prefix_a, adsafe_script, adsafe_source, adsafe_subscript_a,\n    adsafe_tag, alert, aliceblue, all, already_defined, and, animator,\n    antiquewhite, appleScript, applet, apply, approved, appworkspace, aqua,\n    aquamarine, area, arguments, arity, article, aside, assign,\n    assign_exception, assignment_function_expression, at, attribute_case_a,\n    audio, autocomplete, avoid_a, azure, b, background,\n    \"background-attachment\", \"background-color\", \"background-image\",\n    \"background-position\", \"background-repeat\", bad_assignment, bad_color_a,\n    bad_constructor, bad_entity, bad_html, bad_id_a, bad_in_a,\n    bad_invocation, bad_name_a, bad_new, bad_number, bad_operand, bad_type,\n    bad_url, bad_wrap, base, bdo, beep, beige, big, bisque, bitwise, black,\n    blanchedalmond, block, blockquote, blue, blueviolet, body, border,\n    \"border-bottom\", \"border-bottom-color\", \"border-bottom-style\",\n    \"border-bottom-width\", \"border-collapse\", \"border-color\", \"border-left\",\n    \"border-left-color\", \"border-left-style\", \"border-left-width\",\n    \"border-right\", \"border-right-color\", \"border-right-style\",\n    \"border-right-width\", \"border-spacing\", \"border-style\", \"border-top\",\n    \"border-top-color\", \"border-top-style\", \"border-top-width\",\n    \"border-width\", bottom, br, braille, brown, browser, burlywood, button,\n    buttonface, buttonhighlight, buttonshadow, buttontext, bytesToUIString,\n    c, cadetblue, call, callee, caller, canvas, cap, caption,\n    \"caption-side\", captiontext, center, charAt, charCodeAt, character,\n    chartreuse, chocolate, chooseColor, chooseFile, chooseFolder, cite,\n    clear, clearInterval, clearTimeout, clip, closeWidget,\n    closure, cm, code, col, colgroup, color, combine_var, command, comment,\n    comments, concat, conditional_assignment, confirm, confusing_a,\n    confusing_regexp, console, constructor, constructor_name_a, content,\n    continue, control_a, convertPathToHFS, convertPathToPlatform, coral,\n    cornflowerblue, cornsilk, \"counter-increment\", \"counter-reset\", create,\n    crimson, css, cursor, cyan, d, dangerous_comment, dangling_a, darkblue,\n    darkcyan, darkgoldenrod, darkgray, darkgreen, darkkhaki, darkmagenta,\n    darkolivegreen, darkorange, darkorchid, darkred, darksalmon,\n    darkseagreen, darkslateblue, darkslategray, darkturquoise, darkviolet,\n    data, datalist, dd, debug, decodeURI, decodeURIComponent, deeppink,\n    deepskyblue, defineClass, del, deleted, deserialize, details, devel,\n    dfn, dialog, dimgray, dir, direction, display, disrupt, div, dl,\n    document, dodgerblue, dt, duplicate_a, edge, edition, else, em, embed,\n    embossed, empty, \"empty-cells\", empty_block, empty_case, empty_class,\n    encodeURI, encodeURIComponent, entityify, errors, es5, escape, eval,\n    event, evidence, evil, ex, exception, exec, expected_a,\n    expected_a_at_b_c, expected_a_b, expected_a_b_from_c_d, expected_at_a,\n    expected_attribute_a, expected_attribute_value_a, expected_class_a,\n    expected_fraction_a, expected_id_a, expected_identifier_a,\n    expected_identifier_a_reserved, expected_lang_a, expected_linear_a,\n    expected_media_a, expected_name_a, expected_nonstandard_style_attribute,\n    expected_number_a, expected_operator_a, expected_percent_a,\n    expected_positive_a, expected_pseudo_a, expected_selector_a,\n    expected_small_a, expected_space_a_b, expected_string_a,\n    expected_style_attribute, expected_style_pattern, expected_tagname_a,\n    fieldset, figure, filesystem, filter, firebrick, first, float, floor,\n    floralwhite, focusWidget, font, \"font-family\", \"font-size\",\n    \"font-size-adjust\", \"font-stretch\", \"font-style\", \"font-variant\",\n    \"font-weight\", footer, for_if, forestgreen, forin, form, fragment,\n    frame, frames, frameset, from, fromCharCode, fuchsia, fud, funct,\n    function, function_block, function_eval, function_loop,\n    function_statement, function_strict, functions, g, gainsboro, gc,\n    get_set, ghostwhite, global, globals, gold, goldenrod, gray, graytext,\n    green, greenyellow, h1, h2, h3, h4, h5, h6, handheld, hasOwnProperty,\n    head, header, height, help, hgroup, highlight, highlighttext, history,\n    honeydew, hotpink, hr, \"hta:application\", html, html_confusion_a,\n    html_handlers, i, iTunes, id, identifier, identifier_function, iframe,\n    img, immed, implied_evil, implieds, in, inactiveborder, inactivecaption,\n    inactivecaptiontext, include, indent, indexOf, indianred, indigo,\n    infix_in, infobackground, infotext, init, input, ins, insecure_a,\n    isAlpha, isApplicationRunning, isArray, isDigit, isFinite, isNaN, ivory,\n    join, jslint, json, kbd, keygen, keys, khaki, konfabulatorVersion,\n    label, label_a_b, labeled, lang, lavender, lavenderblush, lawngreen,\n    lbp, leading_decimal_a, led, left, legend, lemonchiffon, length,\n    \"letter-spacing\", li, lib, lightblue, lightcoral, lightcyan,\n    lightgoldenrodyellow, lightgreen, lightpink, lightsalmon, lightseagreen,\n    lightskyblue, lightslategray, lightsteelblue, lightyellow, lime,\n    limegreen, line, \"line-height\", linen, link, \"list-style\",\n    \"list-style-image\", \"list-style-position\", \"list-style-type\", load,\n    loadClass, location, log, m, magenta, map, margin, \"margin-bottom\",\n    \"margin-left\", \"margin-right\", \"margin-top\", mark, \"marker-offset\",\n    maroon, match, \"max-height\", \"max-width\", maxerr, maxlen, md5,\n    mediumaquamarine, mediumblue, mediumorchid, mediumpurple,\n    mediumseagreen, mediumslateblue, mediumspringgreen, mediumturquoise,\n    mediumvioletred, member, menu, menutext, message, meta, meter,\n    midnightblue, \"min-height\", \"min-width\", mintcream, missing_a,\n    missing_a_after_b, missing_option, missing_property, missing_space_a_b,\n    missing_url, missing_use_strict, mistyrose, mixed, mm, moccasin, mode,\n    module, move_invocation, move_var, name, name_function, nav,\n    navajowhite, navigator, navy, nested_comment, newcap, next, node,\n    noframes, nomen, noscript, not, not_a_constructor, not_a_defined,\n    not_a_function, not_a_label, not_a_scope, not_greater, nud, object, ol,\n    oldlace, olive, olivedrab, on, onevar, opacity, open, openURL, opera,\n    optgroup, option, orange, orangered, orchid, outer, outline,\n    \"outline-color\", \"outline-style\", \"outline-width\", output, overflow,\n    \"overflow-x\", \"overflow-y\", p, padding, \"padding-bottom\",\n    \"padding-left\", \"padding-right\", \"padding-top\", \"page-break-after\",\n    \"page-break-before\", palegoldenrod, palegreen, paleturquoise,\n    palevioletred, papayawhip, param, parameter_a_get_b, parameter_set_a,\n    paren, parent, parseFloat, parseInt, passfail, pc, peachpuff, peru,\n    pink, play, plum, plusplus, pop, popupMenu, position, postscript,\n    powderblue, pre, predef, preferenceGroups, preferences, prev, print,\n    process, progress, projection, prompt, prototype, pt, purple, push, px,\n    q, querystring, quit, quote, quotes, radix, random, range, raw,\n    readFile, readUrl, read_only, reason, red, redefinition_a, regexp,\n    reloadWidget, replace, report, require, reserved, reserved_a,\n    resolvePath, resumeUpdates, rhino, right, rosybrown, royalblue, rp, rt,\n    ruby, runCommand, runCommandInBg, saddlebrown, safe, salmon, samp,\n    sandybrown, saveAs, savePreferences, scanned_a_b, screen, script,\n    scrollbar, seagreen, seal, search, seashell, second, section, select,\n    serialize, setInterval, setTimeout, shift, showWidgetPreferences,\n    sienna, silver, skyblue, slash_equal, slateblue, slategray, sleep,\n    slice, small, snow, sort, source, span, spawn, speak, speech, split,\n    springgreen, src, stack, statement_block, steelblue, stopping,\n    strange_loop, strict, strong, style, styleproperty, sub, subscript,\n    substr, sup, supplant, suppressUpdates, sync, system, table,\n    \"table-layout\", tag_a_in_b, tan, tbody, td, teal, tellWidget, test,\n    \"text-align\", \"text-decoration\", \"text-indent\", \"text-shadow\",\n    \"text-transform\", textarea, tfoot, th, thead, third, thistle,\n    threeddarkshadow, threedface, threedhighlight, threedlightshadow,\n    threedshadow, thru, time, title, toLowerCase, toString, toUpperCase,\n    toint32, token, tomato, too_long, too_many, top, tr, trailing_decimal_a,\n    tree, tt, tty, turquoise, tv, type, typeof, u, ul, unclosed,\n    unclosed_comment, unclosed_regexp, undef, unescape, unescaped_a,\n    unexpected_a, unexpected_char_a_b, unexpected_comment,\n    unexpected_property_a, unexpected_space_a_b, \"unicode-bidi\",\n    unnecessary_initialize, unnecessary_use, unreachable_a_b,\n    unrecognized_style_attribute_a, unrecognized_tag_a, unsafe, unused,\n    unwatch, updateNow, url, urls, use_array, use_braces, use_object,\n    used_before_a, util, value, valueOf, var, var_a_not, version,\n    \"vertical-align\", video, violet, visibility, was, watch,\n    weird_assignment, weird_condition, weird_new, weird_program,\n    weird_relation, weird_ternary, wheat, white, \"white-space\", whitesmoke,\n    widget, width, window, windowframe, windows, windowtext, \"word-spacing\",\n    \"word-wrap\", wrap, wrap_immediate, wrap_regexp, write_is_wrong,\n    yahooCheckLogin, yahooLogin, yahooLogout, yellow, yellowgreen,\n    \"z-index\", \"|\", \"~\"\n */\n\n// The global directive is used to declare global variables that can\n// be accessed by the program. If a declaration is true, then the variable\n// is writeable. Otherwise, it is read-only.\n\n// We build the application inside a function so that we produce only a single\n// global variable. That function will be invoked immediately, and its return\n// value is the JSLINT function itself. That function is also an object that\n// can contain data and other functions.\n\nvar JSLINT = (function () {\n    \"use strict\";\n\n    var adsafe_id,      // The widget's ADsafe id.\n        adsafe_infix = {\n            '-': true,\n            '*': true,\n            '/': true,\n            '%': true,\n            '&': true,\n            '|': true,\n            '^': true,\n            '<<': true,\n            '>>': true,\n            '>>>': true\n        },\n        adsafe_prefix = {\n            '-': true,\n            '+': true,\n            '~': true,\n            'typeof': true\n        },\n        adsafe_may,     // The widget may load approved scripts.\n        adsafe_top,     // At the top of the widget script.\n        adsafe_went,    // ADSAFE.go has been called.\n        anonname,       // The guessed name for anonymous functions.\n        approved,       // ADsafe approved urls.\n\n// These are operators that should not be used with the ! operator.\n\n        bang = {\n            '<'  : true,\n            '<=' : true,\n            '==' : true,\n            '===': true,\n            '!==': true,\n            '!=' : true,\n            '>'  : true,\n            '>=' : true,\n            '+'  : true,\n            '-'  : true,\n            '*'  : true,\n            '/'  : true,\n            '%'  : true\n        },\n\n// These are property names that should not be permitted in the safe subset.\n\n        banned = {\n            'arguments' : true,\n            callee      : true,\n            caller      : true,\n            constructor : true,\n            'eval'      : true,\n            prototype   : true,\n            stack       : true,\n            unwatch     : true,\n            valueOf     : true,\n            watch       : true\n        },\n        begin,          // The root token\n\n// browser contains a set of global names that are commonly provided by a\n// web browser environment.\n\n        browser = {\n            clearInterval  : false,\n            clearTimeout   : false,\n            document       : false,\n            event          : false,\n            frames         : false,\n            history        : false,\n            Image          : false,\n            location       : false,\n            name           : false,\n            navigator      : false,\n            Option         : false,\n            parent         : false,\n            screen         : false,\n            setInterval    : false,\n            setTimeout     : false,\n            window         : false,\n            XMLHttpRequest : false\n        },\n\n// bundle contains the text messages.\n\n        bundle = {\n            a_function: \"'{a}' is a function.\",\n            a_label: \"'{a}' is a statement label.\",\n            a_not_allowed: \"'{a}' is not allowed.\",\n            a_not_defined: \"'{a}' is not defined.\",\n            a_scope: \"'{a}' used out of scope.\",\n            adsafe: \"ADsafe violation.\",\n            adsafe_a: \"ADsafe violation: '{a}'.\",\n            adsafe_autocomplete: \"ADsafe autocomplete violation.\",\n            adsafe_bad_id: \"ADSAFE violation: bad id.\",\n            adsafe_div: \"ADsafe violation: Wrap the widget in a div.\",\n            adsafe_fragment: \"ADSAFE: Use the fragment option.\",\n            adsafe_go: \"ADsafe violation: Misformed ADSAFE.go.\",\n            adsafe_html: \"Currently, ADsafe does not operate on whole HTML documents. It operates on <div> fragments and .js files.\",\n            adsafe_id: \"ADsafe violation: id does not match.\",\n            adsafe_id_go: \"ADsafe violation: Missing ADSAFE.id or ADSAFE.go.\",\n            adsafe_lib: \"ADsafe lib violation.\",\n            adsafe_lib_second: \"ADsafe: The second argument to lib must be a function.\",\n            adsafe_missing_id: \"ADSAFE violation: missing ID_.\",\n            adsafe_name_a: \"ADsafe name violation: '{a}'.\",\n            adsafe_placement: \"ADsafe script placement violation.\",\n            adsafe_prefix_a: \"ADsafe violation: An id must have a '{a}' prefix\",\n            adsafe_script: \"ADsafe script violation.\",\n            adsafe_source: \"ADsafe unapproved script source.\",\n            adsafe_subscript_a: \"ADsafe subscript '{a}'.\",\n            adsafe_tag: \"ADsafe violation: Disallowed tag '{a}'.\",\n            already_defined: \"'{a}' is already defined.\",\n            and: \"The '&&' subexpression should be wrapped in parens.\",\n            assign_exception: \"Do not assign to the exception parameter.\",\n            assignment_function_expression: \"Expected an assignment or function call and instead saw an expression.\",\n            attribute_case_a: \"Attribute '{a}' not all lower case.\",\n            avoid_a: \"Avoid '{a}'.\",\n            bad_assignment: \"Bad assignment.\",\n            bad_color_a: \"Bad hex color '{a}'.\",\n            bad_constructor: \"Bad constructor.\",\n            bad_entity: \"Bad entity.\",\n            bad_html: \"Bad HTML string\",\n            bad_id_a: \"Bad id: '{a}'.\",\n            bad_in_a: \"Bad for in variable '{a}'.\",\n            bad_invocation: \"Bad invocation.\",\n            bad_name_a: \"Bad name: '{a}'.\",\n            bad_new: \"Do not use 'new' for side effects.\",\n            bad_number: \"Bad number '{a}'.\",\n            bad_operand: \"Bad operand.\",\n            bad_type: \"Bad type.\",\n            bad_url: \"Bad url string.\",\n            bad_wrap: \"Do not wrap function literals in parens unless they are to be immediately invoked.\",\n            combine_var: \"Combine this with the previous 'var' statement.\",\n            conditional_assignment: \"Expected a conditional expression and instead saw an assignment.\",\n            confusing_a: \"Confusing use of '{a}'.\",\n            confusing_regexp: \"Confusing regular expression.\",\n            constructor_name_a: \"A constructor name '{a}' should start with an uppercase letter.\",\n            control_a: \"Unexpected control character '{a}'.\",\n            css: \"A css file should begin with @charset 'UTF-8';\",\n            dangling_a: \"Unexpected dangling '_' in '{a}'.\",\n            dangerous_comment: \"Dangerous comment.\",\n            deleted: \"Only properties should be deleted.\",\n            duplicate_a: \"Duplicate '{a}'.\",\n            empty_block: \"Empty block.\",\n            empty_case: \"Empty case.\",\n            empty_class: \"Empty class.\",\n            evil: \"eval is evil.\",\n            expected_a: \"Expected '{a}'.\",\n            expected_a_b: \"Expected '{a}' and instead saw '{b}'.\",\n            expected_a_b_from_c_d: \"Expected '{a}' to match '{b}' from line {c} and instead saw '{d}'.\",\n            expected_at_a: \"Expected an at-rule, and instead saw @{a}.\",\n            expected_a_at_b_c: \"Expected '{a}' at column {b}, not column {c}.\",\n            expected_attribute_a: \"Expected an attribute, and instead saw [{a}].\",\n            expected_attribute_value_a: \"Expected an attribute value and instead saw '{a}'.\",\n            expected_class_a: \"Expected a class, and instead saw .{a}.\",\n            expected_fraction_a: \"Expected a number between 0 and 1 and instead saw '{a}'\",\n            expected_id_a: \"Expected an id, and instead saw #{a}.\",\n            expected_identifier_a: \"Expected an identifier and instead saw '{a}'.\",\n            expected_identifier_a_reserved: \"Expected an identifier and instead saw '{a}' (a reserved word).\",\n            expected_linear_a: \"Expected a linear unit and instead saw '{a}'.\",\n            expected_lang_a: \"Expected a lang code, and instead saw :{a}.\",\n            expected_media_a: \"Expected a CSS media type, and instead saw '{a}'.\",\n            expected_name_a: \"Expected a name and instead saw '{a}'.\",\n            expected_nonstandard_style_attribute: \"Expected a non-standard style attribute and instead saw '{a}'.\",\n            expected_number_a: \"Expected a number and instead saw '{a}'.\",\n            expected_operator_a: \"Expected an operator and instead saw '{a}'.\",\n            expected_percent_a: \"Expected a percentage and instead saw '{a}'\",\n            expected_positive_a: \"Expected a positive number and instead saw '{a}'\",\n            expected_pseudo_a: \"Expected a pseudo, and instead saw :{a}.\",\n            expected_selector_a: \"Expected a CSS selector, and instead saw {a}.\",\n            expected_small_a: \"Expected a small number and instead saw '{a}'\",\n            expected_space_a_b: \"Expected exactly one space between '{a}' and '{b}'.\",\n            expected_string_a: \"Expected a string and instead saw {a}.\",\n            expected_style_attribute: \"Excepted a style attribute, and instead saw '{a}'.\",\n            expected_style_pattern: \"Expected a style pattern, and instead saw '{a}'.\",\n            expected_tagname_a: \"Expected a tagName, and instead saw {a}.\",\n            for_if: \"The body of a for in should be wrapped in an if statement to filter unwanted properties from the prototype.\",\n            function_block: \"Function statements should not be placed in blocks. \" +\n                \"Use a function expression or move the statement to the top of \" +\n                \"the outer function.\",\n            function_eval: \"The Function constructor is eval.\",\n            function_loop: \"Don't make functions within a loop.\",\n            function_statement: \"Function statements are not invocable. \" +\n                \"Wrap the whole function invocation in parens.\",\n            function_strict: \"Use the function form of \\\"use strict\\\".\",\n            get_set: \"get/set are ES5 features.\",\n            html_confusion_a: \"HTML confusion in regular expression '<{a}'.\",\n            html_handlers: \"Avoid HTML event handlers.\",\n            identifier_function: \"Expected an identifier in an assignment and instead saw a function invocation.\",\n            implied_evil: \"Implied eval is evil. Pass a function instead of a string.\",\n            infix_in: \"Unexpected 'in'. Compare with undefined, or use the hasOwnProperty method instead.\",\n            insecure_a: \"Insecure '{a}'.\",\n            isNaN: \"Use the isNaN function to compare with NaN.\",\n            label_a_b: \"Label '{a}' on '{b}' statement.\",\n            lang: \"lang is deprecated.\",\n            leading_decimal_a: \"A leading decimal point can be confused with a dot: '.{a}'.\",\n            missing_a: \"Missing '{a}'.\",\n            missing_a_after_b: \"Missing '{a}' after '{b}'.\",\n            missing_option: \"Missing option value.\",\n            missing_property: \"Missing property name.\",\n            missing_space_a_b: \"Missing space between '{a}' and '{b}'.\",\n            missing_url: \"Missing url.\",\n            missing_use_strict: \"Missing \\\"use strict\\\" statement.\",\n            mixed: \"Mixed spaces and tabs.\",\n            move_invocation: \"Move the invocation into the parens that contain the function.\",\n            move_var: \"Move 'var' declarations to the top of the function.\",\n            name_function: \"Missing name in function statement.\",\n            nested_comment: \"Nested comment.\",\n            not: \"Nested not.\",\n            not_a_constructor: \"Do not use {a} as a constructor.\",\n            not_a_defined: \"'{a}' has not been fully defined yet.\",\n            not_a_function: \"'{a}' is not a function.\",\n            not_a_label: \"'{a}' is not a label.\",\n            not_a_scope: \"'{a}' is out of scope.\",\n            not_greater: \"'{a}' should not be greater than '{b}'.\",\n            parameter_a_get_b: \"Unexpected parameter '{a}' in get {b} function.\",\n            parameter_set_a: \"Expected parameter (value) in set {a} function.\",\n            radix: \"Missing radix parameter.\",\n            read_only: \"Read only.\",\n            redefinition_a: \"Redefinition of '{a}'.\",\n            reserved_a: \"Reserved name '{a}'.\",\n            scanned_a_b: \"{a} ({b}% scanned).\",\n            slash_equal: \"A regular expression literal can be confused with '/='.\",\n            statement_block: \"Expected to see a statement and instead saw a block.\",\n            stopping: \"Stopping. \",\n            strange_loop: \"Strange loop.\",\n            strict: \"Strict violation.\",\n            subscript: \"['{a}'] is better written in dot notation.\",\n            tag_a_in_b: \"A '<{a}>' must be within '<{b}>'.\",\n            too_long: \"Line too long.\",\n            too_many: \"Too many errors.\",\n            trailing_decimal_a: \"A trailing decimal point can be confused with a dot: '.{a}'.\",\n            type: \"type is unnecessary.\",\n            unclosed: \"Unclosed string.\",\n            unclosed_comment: \"Unclosed comment.\",\n            unclosed_regexp: \"Unclosed regular expression.\",\n            unescaped_a: \"Unescaped '{a}'.\",\n            unexpected_a: \"Unexpected '{a}'.\",\n            unexpected_char_a_b: \"Unexpected character '{a}' in {b}.\",\n            unexpected_comment: \"Unexpected comment.\",\n            unexpected_property_a: \"Unexpected /*property*/ '{a}'.\",\n            unexpected_space_a_b: \"Unexpected space between '{a}' and '{b}'.\",\n            unnecessary_initialize: \"It is not necessary to initialize '{a}' to 'undefined'.\",\n            unnecessary_use: \"Unnecessary \\\"use strict\\\".\",\n            unreachable_a_b: \"Unreachable '{a}' after '{b}'.\",\n            unrecognized_style_attribute_a: \"Unrecognized style attribute '{a}'.\",\n            unrecognized_tag_a: \"Unrecognized tag '<{a}>'.\",\n            unsafe: \"Unsafe character.\",\n            url: \"JavaScript URL.\",\n            use_array: \"Use the array literal notation [].\",\n            use_braces: \"Spaces are hard to count. Use {{a}}.\",\n            use_object: \"Use the object literal notation {}.\",\n            used_before_a: \"'{a}' was used before it was defined.\",\n            var_a_not: \"Variable {a} was not declared correctly.\",\n            weird_assignment: \"Weird assignment.\",\n            weird_condition: \"Weird condition.\",\n            weird_new: \"Weird construction. Delete 'new'.\",\n            weird_program: \"Weird program.\",\n            weird_relation: \"Weird relation.\",\n            weird_ternary: \"Weird ternary.\",\n            wrap_immediate: \"Wrap an immediate function invocation in parentheses \" +\n                \"to assist the reader in understanding that the expression \" +\n                \"is the result of a function, and not the function itself.\",\n            wrap_regexp: \"Wrap the /regexp/ literal in parens to disambiguate the slash operator.\",\n            write_is_wrong: \"document.write can be a form of eval.\"\n        },\n        comments_off,\n        css_attribute_data,\n        css_any,\n\n        css_colorData = {\n            \"aliceblue\"             : true,\n            \"antiquewhite\"          : true,\n            \"aqua\"                  : true,\n            \"aquamarine\"            : true,\n            \"azure\"                 : true,\n            \"beige\"                 : true,\n            \"bisque\"                : true,\n            \"black\"                 : true,\n            \"blanchedalmond\"        : true,\n            \"blue\"                  : true,\n            \"blueviolet\"            : true,\n            \"brown\"                 : true,\n            \"burlywood\"             : true,\n            \"cadetblue\"             : true,\n            \"chartreuse\"            : true,\n            \"chocolate\"             : true,\n            \"coral\"                 : true,\n            \"cornflowerblue\"        : true,\n            \"cornsilk\"              : true,\n            \"crimson\"               : true,\n            \"cyan\"                  : true,\n            \"darkblue\"              : true,\n            \"darkcyan\"              : true,\n            \"darkgoldenrod\"         : true,\n            \"darkgray\"              : true,\n            \"darkgreen\"             : true,\n            \"darkkhaki\"             : true,\n            \"darkmagenta\"           : true,\n            \"darkolivegreen\"        : true,\n            \"darkorange\"            : true,\n            \"darkorchid\"            : true,\n            \"darkred\"               : true,\n            \"darksalmon\"            : true,\n            \"darkseagreen\"          : true,\n            \"darkslateblue\"         : true,\n            \"darkslategray\"         : true,\n            \"darkturquoise\"         : true,\n            \"darkviolet\"            : true,\n            \"deeppink\"              : true,\n            \"deepskyblue\"           : true,\n            \"dimgray\"               : true,\n            \"dodgerblue\"            : true,\n            \"firebrick\"             : true,\n            \"floralwhite\"           : true,\n            \"forestgreen\"           : true,\n            \"fuchsia\"               : true,\n            \"gainsboro\"             : true,\n            \"ghostwhite\"            : true,\n            \"gold\"                  : true,\n            \"goldenrod\"             : true,\n            \"gray\"                  : true,\n            \"green\"                 : true,\n            \"greenyellow\"           : true,\n            \"honeydew\"              : true,\n            \"hotpink\"               : true,\n            \"indianred\"             : true,\n            \"indigo\"                : true,\n            \"ivory\"                 : true,\n            \"khaki\"                 : true,\n            \"lavender\"              : true,\n            \"lavenderblush\"         : true,\n            \"lawngreen\"             : true,\n            \"lemonchiffon\"          : true,\n            \"lightblue\"             : true,\n            \"lightcoral\"            : true,\n            \"lightcyan\"             : true,\n            \"lightgoldenrodyellow\"  : true,\n            \"lightgreen\"            : true,\n            \"lightpink\"             : true,\n            \"lightsalmon\"           : true,\n            \"lightseagreen\"         : true,\n            \"lightskyblue\"          : true,\n            \"lightslategray\"        : true,\n            \"lightsteelblue\"        : true,\n            \"lightyellow\"           : true,\n            \"lime\"                  : true,\n            \"limegreen\"             : true,\n            \"linen\"                 : true,\n            \"magenta\"               : true,\n            \"maroon\"                : true,\n            \"mediumaquamarine\"      : true,\n            \"mediumblue\"            : true,\n            \"mediumorchid\"          : true,\n            \"mediumpurple\"          : true,\n            \"mediumseagreen\"        : true,\n            \"mediumslateblue\"       : true,\n            \"mediumspringgreen\"     : true,\n            \"mediumturquoise\"       : true,\n            \"mediumvioletred\"       : true,\n            \"midnightblue\"          : true,\n            \"mintcream\"             : true,\n            \"mistyrose\"             : true,\n            \"moccasin\"              : true,\n            \"navajowhite\"           : true,\n            \"navy\"                  : true,\n            \"oldlace\"               : true,\n            \"olive\"                 : true,\n            \"olivedrab\"             : true,\n            \"orange\"                : true,\n            \"orangered\"             : true,\n            \"orchid\"                : true,\n            \"palegoldenrod\"         : true,\n            \"palegreen\"             : true,\n            \"paleturquoise\"         : true,\n            \"palevioletred\"         : true,\n            \"papayawhip\"            : true,\n            \"peachpuff\"             : true,\n            \"peru\"                  : true,\n            \"pink\"                  : true,\n            \"plum\"                  : true,\n            \"powderblue\"            : true,\n            \"purple\"                : true,\n            \"red\"                   : true,\n            \"rosybrown\"             : true,\n            \"royalblue\"             : true,\n            \"saddlebrown\"           : true,\n            \"salmon\"                : true,\n            \"sandybrown\"            : true,\n            \"seagreen\"              : true,\n            \"seashell\"              : true,\n            \"sienna\"                : true,\n            \"silver\"                : true,\n            \"skyblue\"               : true,\n            \"slateblue\"             : true,\n            \"slategray\"             : true,\n            \"snow\"                  : true,\n            \"springgreen\"           : true,\n            \"steelblue\"             : true,\n            \"tan\"                   : true,\n            \"teal\"                  : true,\n            \"thistle\"               : true,\n            \"tomato\"                : true,\n            \"turquoise\"             : true,\n            \"violet\"                : true,\n            \"wheat\"                 : true,\n            \"white\"                 : true,\n            \"whitesmoke\"            : true,\n            \"yellow\"                : true,\n            \"yellowgreen\"           : true,\n\n            \"activeborder\"          : true,\n            \"activecaption\"         : true,\n            \"appworkspace\"          : true,\n            \"background\"            : true,\n            \"buttonface\"            : true,\n            \"buttonhighlight\"       : true,\n            \"buttonshadow\"          : true,\n            \"buttontext\"            : true,\n            \"captiontext\"           : true,\n            \"graytext\"              : true,\n            \"highlight\"             : true,\n            \"highlighttext\"         : true,\n            \"inactiveborder\"        : true,\n            \"inactivecaption\"       : true,\n            \"inactivecaptiontext\"   : true,\n            \"infobackground\"        : true,\n            \"infotext\"              : true,\n            \"menu\"                  : true,\n            \"menutext\"              : true,\n            \"scrollbar\"             : true,\n            \"threeddarkshadow\"      : true,\n            \"threedface\"            : true,\n            \"threedhighlight\"       : true,\n            \"threedlightshadow\"     : true,\n            \"threedshadow\"          : true,\n            \"window\"                : true,\n            \"windowframe\"           : true,\n            \"windowtext\"            : true\n        },\n\n        css_border_style,\n        css_break,\n\n        css_lengthData = {\n            '%': true,\n            'cm': true,\n            'em': true,\n            'ex': true,\n            'in': true,\n            'mm': true,\n            'pc': true,\n            'pt': true,\n            'px': true\n        },\n\n        css_media,\n        css_overflow,\n\n        devel = {\n            alert           : false,\n            confirm         : false,\n            console         : false,\n            Debug           : false,\n            opera           : false,\n            prompt          : false\n        },\n\n        escapes = {\n            '\\b': '\\\\b',\n            '\\t': '\\\\t',\n            '\\n': '\\\\n',\n            '\\f': '\\\\f',\n            '\\r': '\\\\r',\n            '\"' : '\\\\\"',\n            '/' : '\\\\/',\n            '\\\\': '\\\\\\\\'\n        },\n\n        funct,          // The current function\n\n        functionicity = [\n            'closure', 'exception', 'global', 'label', 'outer', 'unused', 'var'\n        ],\n\n        functions,      // All of the functions\n        global,         // The global scope\n        html_tag = {\n            a:        {},\n            abbr:     {},\n            acronym:  {},\n            address:  {},\n            applet:   {},\n            area:     {empty: true, parent: ' map '},\n            article:  {},\n            aside:    {},\n            audio:    {},\n            b:        {},\n            base:     {empty: true, parent: ' head '},\n            bdo:      {},\n            big:      {},\n            blockquote: {},\n            body:     {parent: ' html noframes '},\n            br:       {empty: true},\n            button:   {},\n            canvas:   {parent: ' body p div th td '},\n            caption:  {parent: ' table '},\n            center:   {},\n            cite:     {},\n            code:     {},\n            col:      {empty: true, parent: ' table colgroup '},\n            colgroup: {parent: ' table '},\n            command:  {parent: ' menu '},\n            datalist: {},\n            dd:       {parent: ' dl '},\n            del:      {},\n            details:  {},\n            dialog:   {},\n            dfn:      {},\n            dir:      {},\n            div:      {},\n            dl:       {},\n            dt:       {parent: ' dl '},\n            em:       {},\n            embed:    {},\n            fieldset: {},\n            figure:   {},\n            font:     {},\n            footer:   {},\n            form:     {},\n            frame:    {empty: true, parent: ' frameset '},\n            frameset: {parent: ' html frameset '},\n            h1:       {},\n            h2:       {},\n            h3:       {},\n            h4:       {},\n            h5:       {},\n            h6:       {},\n            head:     {parent: ' html '},\n            header:   {},\n            hgroup:   {},\n            hr:       {empty: true},\n            'hta:application':\n                      {empty: true, parent: ' head '},\n            html:     {parent: '*'},\n            i:        {},\n            iframe:   {},\n            img:      {empty: true},\n            input:    {empty: true},\n            ins:      {},\n            kbd:      {},\n            keygen:   {},\n            label:    {},\n            legend:   {parent: ' details fieldset figure '},\n            li:       {parent: ' dir menu ol ul '},\n            link:     {empty: true, parent: ' head '},\n            map:      {},\n            mark:     {},\n            menu:     {},\n            meta:     {empty: true, parent: ' head noframes noscript '},\n            meter:    {},\n            nav:      {},\n            noframes: {parent: ' html body '},\n            noscript: {parent: ' body head noframes '},\n            object:   {},\n            ol:       {},\n            optgroup: {parent: ' select '},\n            option:   {parent: ' optgroup select '},\n            output:   {},\n            p:        {},\n            param:    {empty: true, parent: ' applet object '},\n            pre:      {},\n            progress: {},\n            q:        {},\n            rp:       {},\n            rt:       {},\n            ruby:     {},\n            samp:     {},\n            script:   {empty: true, parent: ' body div frame head iframe p pre span '},\n            section:  {},\n            select:   {},\n            small:    {},\n            span:     {},\n            source:   {},\n            strong:   {},\n            style:    {parent: ' head ', empty: true},\n            sub:      {},\n            sup:      {},\n            table:    {},\n            tbody:    {parent: ' table '},\n            td:       {parent: ' tr '},\n            textarea: {},\n            tfoot:    {parent: ' table '},\n            th:       {parent: ' tr '},\n            thead:    {parent: ' table '},\n            time:     {},\n            title:    {parent: ' head '},\n            tr:       {parent: ' table tbody thead tfoot '},\n            tt:       {},\n            u:        {},\n            ul:       {},\n            'var':    {},\n            video:    {}\n        },\n\n        ids,            // HTML ids\n        implied,        // Implied globals\n        in_block,\n        indent,\n        json_mode,\n        lines,\n        lookahead,\n        member,\n        node = {\n            Buffer       : false,\n            clearInterval: false,\n            clearTimeout : false,\n            console      : false,\n            global       : false,\n            module       : false,\n            process      : false,\n            querystring  : false,\n            require      : false,\n            setInterval  : false,\n            setTimeout   : false,\n            util         : false,\n            __filename   : false,\n            __dirname    : false\n        },\n        properties,\n        next_token,\n        older_token,\n        option,\n        predefined,     // Global variables defined by option\n        prereg,\n        prev_token,\n        regexp_flag = {\n            g: true,\n            i: true,\n            m: true\n        },\n        rhino = {\n            defineClass : false,\n            deserialize : false,\n            gc          : false,\n            help        : false,\n            load        : false,\n            loadClass   : false,\n            print       : false,\n            quit        : false,\n            readFile    : false,\n            readUrl     : false,\n            runCommand  : false,\n            seal        : false,\n            serialize   : false,\n            spawn       : false,\n            sync        : false,\n            toint32     : false,\n            version     : false\n        },\n\n        scope,      // The current scope\n        semicolon_coda = {\n            ';' : true,\n            '\"' : true,\n            '\\'': true,\n            ')' : true\n        },\n        src,\n        stack,\n\n// standard contains the global names that are provided by the\n// ECMAScript standard.\n\n        standard = {\n            Array               : false,\n            Boolean             : false,\n            Date                : false,\n            decodeURI           : false,\n            decodeURIComponent  : false,\n            encodeURI           : false,\n            encodeURIComponent  : false,\n            Error               : false,\n            'eval'              : false,\n            EvalError           : false,\n            Function            : false,\n            hasOwnProperty      : false,\n            isFinite            : false,\n            isNaN               : false,\n            JSON                : false,\n            Math                : false,\n            Number              : false,\n            Object              : false,\n            parseInt            : false,\n            parseFloat          : false,\n            RangeError          : false,\n            ReferenceError      : false,\n            RegExp              : false,\n            String              : false,\n            SyntaxError         : false,\n            TypeError           : false,\n            URIError            : false\n        },\n\n        standard_property = {\n            E                   : true,\n            LN2                 : true,\n            LN10                : true,\n            LOG2E               : true,\n            LOG10E              : true,\n            MAX_VALUE           : true,\n            MIN_VALUE           : true,\n            NEGATIVE_INFINITY   : true,\n            PI                  : true,\n            POSITIVE_INFINITY   : true,\n            SQRT1_2             : true,\n            SQRT2               : true\n        },\n\n        strict_mode,\n        syntax = {},\n        tab,\n        token,\n        urls,\n        var_mode,\n        warnings,\n\n// widget contains the global names which are provided to a Yahoo\n// (fna Konfabulator) widget.\n\n        widget = {\n            alert                   : true,\n            animator                : true,\n            appleScript             : true,\n            beep                    : true,\n            bytesToUIString         : true,\n            Canvas                  : true,\n            chooseColor             : true,\n            chooseFile              : true,\n            chooseFolder            : true,\n            closeWidget             : true,\n            COM                     : true,\n            convertPathToHFS        : true,\n            convertPathToPlatform   : true,\n            CustomAnimation         : true,\n            escape                  : true,\n            FadeAnimation           : true,\n            filesystem              : true,\n            Flash                   : true,\n            focusWidget             : true,\n            form                    : true,\n            FormField               : true,\n            Frame                   : true,\n            HotKey                  : true,\n            Image                   : true,\n            include                 : true,\n            isApplicationRunning    : true,\n            iTunes                  : true,\n            konfabulatorVersion     : true,\n            log                     : true,\n            md5                     : true,\n            MenuItem                : true,\n            MoveAnimation           : true,\n            openURL                 : true,\n            play                    : true,\n            Point                   : true,\n            popupMenu               : true,\n            preferenceGroups        : true,\n            preferences             : true,\n            print                   : true,\n            prompt                  : true,\n            random                  : true,\n            Rectangle               : true,\n            reloadWidget            : true,\n            ResizeAnimation         : true,\n            resolvePath             : true,\n            resumeUpdates           : true,\n            RotateAnimation         : true,\n            runCommand              : true,\n            runCommandInBg          : true,\n            saveAs                  : true,\n            savePreferences         : true,\n            screen                  : true,\n            ScrollBar               : true,\n            showWidgetPreferences   : true,\n            sleep                   : true,\n            speak                   : true,\n            Style                   : true,\n            suppressUpdates         : true,\n            system                  : true,\n            tellWidget              : true,\n            Text                    : true,\n            TextArea                : true,\n            Timer                   : true,\n            unescape                : true,\n            updateNow               : true,\n            URL                     : true,\n            Web                     : true,\n            widget                  : true,\n            Window                  : true,\n            XMLDOM                  : true,\n            XMLHttpRequest          : true,\n            yahooCheckLogin         : true,\n            yahooLogin              : true,\n            yahooLogout             : true\n        },\n\n        windows = {\n            ActiveXObject: false,\n            CScript      : false,\n            Debug        : false,\n            Enumerator   : false,\n            System       : false,\n            VBArray      : false,\n            WScript      : false\n        },\n\n//  xmode is used to adapt to the exceptions in html parsing.\n//  It can have these states:\n//      false   .js script file\n//      html\n//      outer\n//      script\n//      style\n//      scriptstring\n//      styleproperty\n\n        xmode,\n        xquote,\n\n// Regular expressions. Some of these are stupidly long.\n\n// unsafe comment or string\n        ax = /@cc|<\\/?|script|\\]\\s*\\]|<\\s*!|&lt/i,\n// unsafe characters that are silently deleted by one or more browsers\n        cx = /[\\u0000-\\u001f\\u007f-\\u009f\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]/,\n// query characters for ids\n        dx = /[\\[\\]\\/\\\\\"'*<>.&:(){}+=#]/,\n// html token\n        hx = /^\\s*(['\"=>\\/&#]|<(?:\\/|\\!(?:--)?)?|[a-zA-Z][a-zA-Z0-9_\\-:]*|[0-9]+|--)/,\n// identifier\n        ix = /^([a-zA-Z_$][a-zA-Z0-9_$]*)$/,\n// javascript url\n        jx = /^(?:javascript|jscript|ecmascript|vbscript|mocha|livescript)\\s*:/i,\n// star slash\n        lx = /\\*\\/|\\/\\*/,\n// characters in strings that need escapement\n        nx = /[\\u0000-\\u001f\"\\\\\\u007f-\\u009f\\u00ad\\u0600-\\u0604\\u070f\\u17b4\\u17b5\\u200c-\\u200f\\u2028-\\u202f\\u2060-\\u206f\\ufeff\\ufff0-\\uffff]/g,\n// outer html token\n        ox = /[>&]|<[\\/!]?|--/,\n// attributes characters\n        qx = /[^a-zA-Z0-9+\\-_\\/ ]/,\n// style\n        sx = /^\\s*([{:#%.=,>+\\[\\]@()\"';]|\\*=?|\\$=|\\|=|\\^=|~=|[a-zA-Z_][a-zA-Z0-9_\\-]*|[0-9]+|<\\/|\\/\\*)/,\n        ssx = /^\\s*([@#!\"'};:\\-%.=,+\\[\\]()*_]|[a-zA-Z][a-zA-Z0-9._\\-]*|\\/\\*?|\\d+(?:\\.\\d+)?|<\\/)/,\n// token\n        tx = /^\\s*([(){}\\[.,:;'\"~\\?\\]#@]|==?=?|\\/(\\*(jslint|properties|property|members?|globals?)?|=|\\/)?|\\*[\\/=]?|\\+(?:=|\\++)?|-(?:=|-+)?|%=?|&[&=]?|\\|[|=]?|>>?>?=?|<([\\/=!]|\\!(\\[|--)?|<=?)?|\\^=?|\\!=?=?|[a-zA-Z_$][a-zA-Z0-9_$]*|[0-9]+([xX][0-9a-fA-F]+|\\.[0-9]*)?([eE][+\\-]?[0-9]+)?)/,\n// url badness\n        ux = /&|\\+|\\u00AD|\\.\\.|\\/\\*|%[^;]|base64|url|expression|data|mailto/i,\n\n        rx = {\n            outer: hx,\n            html: hx,\n            style: sx,\n            styleproperty: ssx\n        };\n\n\n    function return_this() {\n        return this;\n    }\n\n    function F() {}     // Used by Object.create\n\n// Provide critical ES5 functions to ES3.\n\n    if (typeof Array.prototype.filter !== 'function') {\n        Array.prototype.filter = function (f) {\n            var i, length = this.length, result = [];\n            for (i = 0; i < length; i += 1) {\n                try {\n                    result.push(f(this[i]));\n                } catch (ignore) {\n                }\n            }\n            return result;\n        };\n    }\n\n    if (typeof Array.isArray !== 'function') {\n        Array.isArray = function (o) {\n            return Object.prototype.toString.apply(o) === '[object Array]';\n        };\n    }\n\n    if (!Object.hasOwnProperty('create')) {\n        Object.create = function (o) {\n            F.prototype = o;\n            return new F();\n        };\n    }\n\n    if (typeof Object.keys !== 'function') {\n        Object.keys = function (o) {\n            var array = [], key;\n            for (key in o) {\n                if (Object.prototype.hasOwnProperty.call(o, key)) {\n                    array.push(key);\n                }\n            }\n            return array;\n        };\n    }\n\n// Substandard methods\n\n    if (typeof String.prototype.entityify !== 'function') {\n        String.prototype.entityify = function () {\n            return this\n                .replace(/&/g, '&amp;')\n                .replace(/</g, '&lt;')\n                .replace(/>/g, '&gt;');\n        };\n    }\n\n    if (typeof String.prototype.isAlpha !== 'function') {\n        String.prototype.isAlpha = function () {\n            return (this >= 'a' && this <= 'z\\uffff') ||\n                (this >= 'A' && this <= 'Z\\uffff');\n        };\n    }\n\n    if (typeof String.prototype.isDigit !== 'function') {\n        String.prototype.isDigit = function () {\n            return (this >= '0' && this <= '9');\n        };\n    }\n\n    if (typeof String.prototype.supplant !== 'function') {\n        String.prototype.supplant = function (o) {\n            return this.replace(/\\{([^{}]*)\\}/g, function (a, b) {\n                var replacement = o[b];\n                return typeof replacement === 'string' ||\n                    typeof replacement === 'number' ? replacement : a;\n            });\n        };\n    }\n\n\n    function sanitize(a) {\n\n//  Escapify a troublesome character.\n\n        return escapes[a] ? escapes[a] :\n            '\\\\u' + ('0000' + a.charCodeAt().toString(16)).slice(-4);\n    }\n\n\n    function combine(a, b) {\n        var name;\n        for (name in b) {\n            if (Object.prototype.hasOwnProperty.call(b, name)) {\n                a[name] = b[name];\n            }\n        }\n    }\n\n    function assume() {\n        if (!option.safe) {\n            if (option.rhino) {\n                combine(predefined, rhino);\n            }\n            if (option.devel) {\n                combine(predefined, devel);\n            }\n            if (option.browser) {\n                combine(predefined, browser);\n            }\n            if (option.windows) {\n                combine(predefined, windows);\n            }\n            if (option.node) {\n                combine(predefined, node);\n            }\n            if (option.widget) {\n                combine(predefined, widget);\n            }\n        }\n    }\n\n\n// Produce an error warning.\n\n    function quit(message, line, character) {\n        throw {\n            name: 'JSLintError',\n            line: line,\n            character: character,\n            message: bundle.scanned_a_b.supplant({\n                a: message,\n                b: Math.floor((line / lines.length) * 100)\n            })\n        };\n    }\n\n    function warn(message, offender, a, b, c, d) {\n        var character, line, warning;\n        offender = offender || next_token;  // `~\n        line = offender.line || 0;\n        character = offender.from || 0;\n        warning = {\n            id: '(error)',\n            raw: bundle[message] || message,\n            evidence: lines[line - 1] || '',\n            line: line,\n            character: character,\n            a: a || offender.value,\n            b: b,\n            c: c,\n            d: d\n        };\n        warning.reason = warning.raw.supplant(warning);\n        JSLINT.errors.push(warning);\n        if (option.passfail) {\n            quit(bundle.stopping, line, character);\n        }\n        warnings += 1;\n        if (warnings >= option.maxerr) {\n            quit(bundle.too_many, line, character);\n        }\n        return warning;\n    }\n\n    function warn_at(message, line, character, a, b, c, d) {\n        return warn(message, {\n            line: line,\n            from: character\n        }, a, b, c, d);\n    }\n\n    function stop(message, offender, a, b, c, d) {\n        var warning = warn(message, offender, a, b, c, d);\n        quit(bundle.stopping, warning.line, warning.character);\n    }\n\n    function stop_at(message, line, character, a, b, c, d) {\n        return stop(message, {\n            line: line,\n            from: character\n        }, a, b, c, d);\n    }\n\n    function expected_at(at) {\n        if (option.white && next_token.from !== at) {\n            warn('expected_a_at_b_c', next_token, next_token.value, at,\n                next_token.from);\n        }\n    }\n\n    function aint(it, name, expected) {\n        if (it[name] !== expected) {\n            warn('expected_a_b', it, expected, it[name]);\n            return true;\n        } else {\n            return false;\n        }\n    }\n\n\n// lexical analysis and token construction\n\n    var lex = (function lex() {\n        var character, from, line, source_row;\n\n// Private lex methods\n\n        function collect_comment(comment, quote, line, at) {\n            var comment_object = {\n                comment: comment,\n                quote: quote,\n                at: at,\n                line: line\n            };\n            if (comments_off || src || (xmode && xmode !== 'script' &&\n                    xmode !== 'style' && xmode !== 'styleproperty')) {\n                warn_at('unexpected_comment', line, character);\n            } else if (xmode === 'script' && /<\\//i.test(source_row)) {\n                warn_at('unexpected_a', line, character, '<\\/');\n            } else if (option.safe && ax.test(comment)) {\n                warn_at('dangerous_comment', line, at);\n            }\n            if (older_token.comments) {\n                older_token.comments.push(comment_object);\n            } else {\n                older_token.comments = [comment_object];\n            }\n            JSLINT.comments.push(comment_object);\n        }\n\n        function next_line() {\n            var at;\n            if (line >= lines.length) {\n                return false;\n            }\n            character = 1;\n            source_row = lines[line];\n            line += 1;\n            at = source_row.search(/ \\t/);\n            if (at >= 0) {\n                warn_at('mixed', line, at + 1);\n            }\n            source_row = source_row.replace(/\\t/g, tab);\n            at = source_row.search(cx);\n            if (at >= 0) {\n                warn_at('unsafe', line, at);\n            }\n            if (option.maxlen && option.maxlen < source_row.length) {\n                warn_at('too_long', line, source_row.length);\n            }\n            return true;\n        }\n\n// Produce a token object.  The token inherits from a syntax symbol.\n\n        function it(type, value, quote) {\n            var id, the_token;\n            if (type === '(string)' || type === '(range)') {\n                if (jx.test(value)) {\n                    warn_at('url', line, from);\n                }\n            }\n            the_token = Object.create(syntax[(\n                type === '(punctuator)' ||\n                    (type === '(identifier)' &&\n                    Object.prototype.hasOwnProperty.call(syntax, value)) ?\n                value :\n                type\n            )] || syntax['(error)']);\n            if (type === '(identifier)') {\n                the_token.identifier = true;\n                if (value === '__iterator__' || value === '__proto__') {\n                    stop_at('reserved_a', line, from, value);\n                } else if (option.nomen &&\n                        (value.charAt(0) === '_' ||\n                        value.charAt(value.length - 1) === '_')) {\n                    warn_at('dangling_a', line, from, value);\n                }\n            }\n            if (value !== undefined) {\n                the_token.value = value;\n            }\n            if (quote) {\n                the_token.quote = quote;\n            }\n            the_token.line = line;\n            the_token.from = from;\n            the_token.thru = character;\n            the_token.prev = older_token;\n            id = the_token.id;\n            prereg = id && (\n                ('(,=:[!&|?{};'.indexOf(id.charAt(id.length - 1)) >= 0) ||\n                id === 'return'\n            );\n            older_token.next = the_token;\n            older_token = the_token;\n            return the_token;\n        }\n\n// Public lex methods\n\n        return {\n            init: function (source) {\n                if (typeof source === 'string') {\n                    lines = source\n                        .replace(/\\r\\n/g, '\\n')\n                        .replace(/\\r/g, '\\n')\n                        .split('\\n');\n                } else {\n                    lines = source;\n                }\n                line = 0;\n                next_line();\n                from = 1;\n            },\n\n            range: function (begin, end) {\n                var c, value = '';\n                from = character;\n                if (source_row.charAt(0) !== begin) {\n                    stop_at('expected_a_b', line, character, begin,\n                        source_row.charAt(0));\n                }\n                for (;;) {\n                    source_row = source_row.slice(1);\n                    character += 1;\n                    c = source_row.charAt(0);\n                    switch (c) {\n                    case '':\n                        stop_at('missing_a', line, character, c);\n                        break;\n                    case end:\n                        source_row = source_row.slice(1);\n                        character += 1;\n                        return it('(range)', value);\n                    case xquote:\n                    case '\\\\':\n                        warn_at('unexpected_a', line, character, c);\n                        break;\n                    }\n                    value += c;\n                }\n            },\n\n// token -- this is called by advance to get the next token.\n\n            token: function () {\n                var b, c, captures, digit, depth, flag, high, i, j, length, low, quote, symbol;\n\n                function match(x) {\n                    var exec = x.exec(source_row), first;\n                    if (exec) {\n                        length = exec[0].length;\n                        first = exec[1];\n                        c = first.charAt(0);\n                        source_row = source_row.substr(length);\n                        from = character + length - first.length;\n                        character += length;\n                        return first;\n                    }\n                }\n\n                function string(x) {\n                    var c, j, r = '';\n\n                    function hex(n) {\n                        var i = parseInt(source_row.substr(j + 1, n), 16);\n                        j += n;\n                        if (i >= 32 && i <= 126 &&\n                                i !== 34 && i !== 92 && i !== 39) {\n                            warn_at('unexpected_a', line, character, '\\\\');\n                        }\n                        character += n;\n                        c = String.fromCharCode(i);\n                    }\n\n                    if (json_mode && x !== '\"') {\n                        warn_at('expected_a', line, character, '\"');\n                    }\n\n                    if (xquote === x || (xmode === 'scriptstring' && !xquote)) {\n                        return it('(punctuator)', x);\n                    }\n\n                    j = 0;\n                    for (;;) {\n                        while (j >= source_row.length) {\n                            j = 0;\n                            if (xmode !== 'html' || !next_line()) {\n                                stop_at('unclosed', line, from);\n                            }\n                        }\n                        c = source_row.charAt(j);\n                        if (c === x) {\n                            character += 1;\n                            source_row = source_row.substr(j + 1);\n                            return it('(string)', r, x);\n                        }\n                        if (c < ' ') {\n                            if (c === '\\n' || c === '\\r') {\n                                break;\n                            }\n                            warn_at('control_a',\n                                line, character + j, source_row.slice(0, j));\n                        } else if (c === xquote) {\n                            warn_at('bad_html', line, character + j);\n                        } else if (c === '<') {\n                            if (option.safe && xmode === 'html') {\n                                warn_at('adsafe_a', line, character + j, c);\n                            } else if (source_row.charAt(j + 1) === '/' && (xmode || option.safe)) {\n                                warn_at('expected_a_b', line, character,\n                                    '<\\\\/', '</');\n                            } else if (source_row.charAt(j + 1) === '!' && (xmode || option.safe)) {\n                                warn_at('unexpected_a', line, character, '<!');\n                            }\n                        } else if (c === '\\\\') {\n                            if (xmode === 'html') {\n                                if (option.safe) {\n                                    warn_at('adsafe_a', line, character + j, c);\n                                }\n                            } else if (xmode === 'styleproperty') {\n                                j += 1;\n                                character += 1;\n                                c = source_row.charAt(j);\n                                if (c !== x) {\n                                    warn_at('unexpected_a', line, character, '\\\\');\n                                }\n                            } else {\n                                j += 1;\n                                character += 1;\n                                c = source_row.charAt(j);\n                                switch (c) {\n                                case xquote:\n                                    warn_at('bad_html', line, character + j);\n                                    break;\n                                case '\\\\':\n                                case '\"':\n                                case '/':\n                                    break;\n                                case '\\'':\n                                    if (json_mode) {\n                                        warn_at('unexpected_a', line, character, '\\\\\\'');\n                                    }\n                                    break;\n                                case 'b':\n                                    c = '\\b';\n                                    break;\n                                case 'f':\n                                    c = '\\f';\n                                    break;\n                                case 'n':\n                                    c = '\\n';\n                                    break;\n                                case 'r':\n                                    c = '\\r';\n                                    break;\n                                case 't':\n                                    c = '\\t';\n                                    break;\n                                case 'u':\n                                    hex(4);\n                                    break;\n                                case 'v':\n                                    if (json_mode) {\n                                        warn_at('unexpected_a', line, character, '\\\\v');\n                                    }\n                                    c = '\\v';\n                                    break;\n                                case 'x':\n                                    if (json_mode) {\n                                        warn_at('unexpected_a', line, character, '\\\\x');\n                                    }\n                                    hex(2);\n                                    break;\n                                default:\n                                    warn_at('unexpected_a', line, character, '\\\\');\n                                }\n                            }\n                        }\n                        r += c;\n                        character += 1;\n                        j += 1;\n                    }\n                }\n\n                for (;;) {\n                    while (!source_row) {\n                        if (!next_line()) {\n                            return it('(end)');\n                        }\n                    }\n                    while (xmode === 'outer') {\n                        i = source_row.search(ox);\n                        if (i === 0) {\n                            break;\n                        } else if (i > 0) {\n                            character += 1;\n                            source_row = source_row.slice(i);\n                            break;\n                        } else {\n                            if (!next_line()) {\n                                return it('(end)', '');\n                            }\n                        }\n                    }\n                    symbol = match(rx[xmode] || tx);\n                    if (!symbol) {\n                        symbol = '';\n                        c = '';\n                        while (source_row && source_row < '!') {\n                            source_row = source_row.substr(1);\n                        }\n                        if (source_row) {\n                            if (xmode === 'html') {\n                                return it('(error)', source_row.charAt(0));\n                            } else {\n                                stop_at('unexpected_a',\n                                    line, character, source_row.substr(0, 1));\n                            }\n                        }\n                    } else {\n\n//      identifier\n\n                        if (c.isAlpha() || c === '_' || c === '$') {\n                            return it('(identifier)', symbol);\n                        }\n\n//      number\n\n                        if (c.isDigit()) {\n                            if (xmode !== 'style' &&\n                                    xmode !== 'styleproperty' &&\n                                    source_row.substr(0, 1).isAlpha()) {\n                                warn_at('expected_space_a_b',\n                                    line, character, c, source_row.charAt(0));\n                            }\n                            if (c === '0') {\n                                digit = symbol.substr(1, 1);\n                                if (digit.isDigit()) {\n                                    if (token.id !== '.' && xmode !== 'styleproperty') {\n                                        warn_at('unexpected_a',\n                                            line, character, symbol);\n                                    }\n                                } else if (json_mode && (digit === 'x' || digit === 'X')) {\n                                    warn_at('unexpected_a', line, character, '0x');\n                                }\n                            }\n                            if (symbol.substr(symbol.length - 1) === '.') {\n                                warn_at('trailing_decimal_a', line,\n                                    character, symbol);\n                            }\n                            if (xmode !== 'style') {\n                                digit = +symbol;\n                                if (!isFinite(digit)) {\n                                    warn_at('bad_number', line, character, symbol);\n                                }\n                                symbol = digit;\n                            }\n                            return it('(number)', symbol);\n                        }\n                        switch (symbol) {\n\n//      string\n\n                        case '\"':\n                        case \"'\":\n                            return string(symbol);\n\n//      // comment\n\n                        case '//':\n                            collect_comment(source_row, '//', line, character);\n                            source_row = '';\n                            break;\n\n//      /* comment\n\n                        case '/*':\n                            quote = '/*';\n                            for (;;) {\n                                i = source_row.search(lx);\n                                if (i >= 0) {\n                                    break;\n                                }\n                                collect_comment(source_row, quote, line, character);\n                                quote = '';\n                                if (!next_line()) {\n                                    stop_at('unclosed_comment', line, character);\n                                }\n                            }\n                            collect_comment(source_row.slice(0, i), quote, character, line);\n                            character += i + 2;\n                            if (source_row.substr(i, 1) === '/') {\n                                stop_at('nested_comment', line, character);\n                            }\n                            source_row = source_row.substr(i + 2);\n                            break;\n\n                        case '':\n                            break;\n//      /\n                        case '/':\n                            if (token.id === '/=') {\n                                stop_at(\n                                    bundle.slash_equal,\n                                    line,\n                                    from\n                                );\n                            }\n                            if (prereg) {\n                                depth = 0;\n                                captures = 0;\n                                length = 0;\n                                for (;;) {\n                                    b = true;\n                                    c = source_row.charAt(length);\n                                    length += 1;\n                                    switch (c) {\n                                    case '':\n                                        stop_at('unclosed_regexp', line, from);\n                                        return;\n                                    case '/':\n                                        if (depth > 0) {\n                                            warn_at('unescaped_a',\n                                                line, from + length, '/');\n                                        }\n                                        c = source_row.substr(0, length - 1);\n                                        flag = Object.create(regexp_flag);\n                                        while (flag[source_row.charAt(length)] === true) {\n                                            flag[source_row.charAt(length)] = false;\n                                            length += 1;\n                                        }\n                                        if (source_row.charAt(length).isAlpha()) {\n                                            stop_at('unexpected_a',\n                                                line, from, source_row.charAt(length));\n                                        }\n                                        character += length;\n                                        source_row = source_row.substr(length);\n                                        quote = source_row.charAt(0);\n                                        if (quote === '/' || quote === '*') {\n                                            stop_at('confusing_regexp',\n                                                line, from);\n                                        }\n                                        return it('(regexp)', c);\n                                    case '\\\\':\n                                        c = source_row.charAt(length);\n                                        if (c < ' ') {\n                                            warn_at('control_a',\n                                                line, from + length, String(c));\n                                        } else if (c === '<') {\n                                            warn_at(\n                                                bundle.unexpected_a,\n                                                line,\n                                                from + length,\n                                                '\\\\'\n                                            );\n                                        }\n                                        length += 1;\n                                        break;\n                                    case '(':\n                                        depth += 1;\n                                        b = false;\n                                        if (source_row.charAt(length) === '?') {\n                                            length += 1;\n                                            switch (source_row.charAt(length)) {\n                                            case ':':\n                                            case '=':\n                                            case '!':\n                                                length += 1;\n                                                break;\n                                            default:\n                                                warn_at(\n                                                    bundle.expected_a_b,\n                                                    line,\n                                                    from + length,\n                                                    ':',\n                                                    source_row.charAt(length)\n                                                );\n                                            }\n                                        } else {\n                                            captures += 1;\n                                        }\n                                        break;\n                                    case '|':\n                                        b = false;\n                                        break;\n                                    case ')':\n                                        if (depth === 0) {\n                                            warn_at('unescaped_a',\n                                                line, from + length, ')');\n                                        } else {\n                                            depth -= 1;\n                                        }\n                                        break;\n                                    case ' ':\n                                        j = 1;\n                                        while (source_row.charAt(length) === ' ') {\n                                            length += 1;\n                                            j += 1;\n                                        }\n                                        if (j > 1) {\n                                            warn_at('use_braces',\n                                                line, from + length, j);\n                                        }\n                                        break;\n                                    case '[':\n                                        c = source_row.charAt(length);\n                                        if (c === '^') {\n                                            length += 1;\n                                            if (option.regexp) {\n                                                warn_at('insecure_a',\n                                                    line, from + length, c);\n                                            } else if (source_row.charAt(length) === ']') {\n                                                stop_at('unescaped_a',\n                                                    line, from + length, '^');\n                                            }\n                                        }\n                                        quote = false;\n                                        if (c === ']') {\n                                            warn_at('empty_class', line,\n                                                from + length - 1);\n                                            quote = true;\n                                        }\nklass:                                  do {\n                                            c = source_row.charAt(length);\n                                            length += 1;\n                                            switch (c) {\n                                            case '[':\n                                            case '^':\n                                                warn_at('unescaped_a',\n                                                    line, from + length, c);\n                                                quote = true;\n                                                break;\n                                            case '-':\n                                                if (quote) {\n                                                    quote = false;\n                                                } else {\n                                                    warn_at('unescaped_a',\n                                                        line, from + length, '-');\n                                                    quote = true;\n                                                }\n                                                break;\n                                            case ']':\n                                                if (!quote) {\n                                                    warn_at('unescaped_a',\n                                                        line, from + length - 1, '-');\n                                                }\n                                                break klass;\n                                            case '\\\\':\n                                                c = source_row.charAt(length);\n                                                if (c < ' ') {\n                                                    warn_at(\n                                                        bundle.control_a,\n                                                        line,\n                                                        from + length,\n                                                        String(c)\n                                                    );\n                                                } else if (c === '<') {\n                                                    warn_at(\n                                                        bundle.unexpected_a,\n                                                        line,\n                                                        from + length,\n                                                        '\\\\'\n                                                    );\n                                                }\n                                                length += 1;\n                                                quote = true;\n                                                break;\n                                            case '/':\n                                                warn_at('unescaped_a',\n                                                    line, from + length - 1, '/');\n                                                quote = true;\n                                                break;\n                                            case '<':\n                                                if (xmode === 'script') {\n                                                    c = source_row.charAt(length);\n                                                    if (c === '!' || c === '/') {\n                                                        warn_at(\n                                                            bundle.html_confusion_a,\n                                                            line,\n                                                            from + length,\n                                                            c\n                                                        );\n                                                    }\n                                                }\n                                                quote = true;\n                                                break;\n                                            default:\n                                                quote = true;\n                                            }\n                                        } while (c);\n                                        break;\n                                    case '.':\n                                        if (option.regexp) {\n                                            warn_at('insecure_a', line,\n                                                from + length, c);\n                                        }\n                                        break;\n                                    case ']':\n                                    case '?':\n                                    case '{':\n                                    case '}':\n                                    case '+':\n                                    case '*':\n                                        warn_at('unescaped_a', line,\n                                            from + length, c);\n                                        break;\n                                    case '<':\n                                        if (xmode === 'script') {\n                                            c = source_row.charAt(length);\n                                            if (c === '!' || c === '/') {\n                                                warn_at(\n                                                    bundle.html_confusion_a,\n                                                    line,\n                                                    from + length,\n                                                    c\n                                                );\n                                            }\n                                        }\n                                        break;\n                                    }\n                                    if (b) {\n                                        switch (source_row.charAt(length)) {\n                                        case '?':\n                                        case '+':\n                                        case '*':\n                                            length += 1;\n                                            if (source_row.charAt(length) === '?') {\n                                                length += 1;\n                                            }\n                                            break;\n                                        case '{':\n                                            length += 1;\n                                            c = source_row.charAt(length);\n                                            if (c < '0' || c > '9') {\n                                                warn_at(\n                                                    bundle.expected_number_a,\n                                                    line,\n                                                    from + length,\n                                                    c\n                                                );\n                                            }\n                                            length += 1;\n                                            low = +c;\n                                            for (;;) {\n                                                c = source_row.charAt(length);\n                                                if (c < '0' || c > '9') {\n                                                    break;\n                                                }\n                                                length += 1;\n                                                low = +c + (low * 10);\n                                            }\n                                            high = low;\n                                            if (c === ',') {\n                                                length += 1;\n                                                high = Infinity;\n                                                c = source_row.charAt(length);\n                                                if (c >= '0' && c <= '9') {\n                                                    length += 1;\n                                                    high = +c;\n                                                    for (;;) {\n                                                        c = source_row.charAt(length);\n                                                        if (c < '0' || c > '9') {\n                                                            break;\n                                                        }\n                                                        length += 1;\n                                                        high = +c + (high * 10);\n                                                    }\n                                                }\n                                            }\n                                            if (source_row.charAt(length) !== '}') {\n                                                warn_at(\n                                                    bundle.expected_a_b,\n                                                    line,\n                                                    from + length,\n                                                    '}',\n                                                    c\n                                                );\n                                            } else {\n                                                length += 1;\n                                            }\n                                            if (source_row.charAt(length) === '?') {\n                                                length += 1;\n                                            }\n                                            if (low > high) {\n                                                warn_at(\n                                                    bundle.not_greater,\n                                                    line,\n                                                    from + length,\n                                                    low,\n                                                    high\n                                                );\n                                            }\n                                            break;\n                                        }\n                                    }\n                                }\n                                c = source_row.substr(0, length - 1);\n                                character += length;\n                                source_row = source_row.substr(length);\n                                return it('(regexp)', c);\n                            }\n                            return it('(punctuator)', symbol);\n\n//      punctuator\n\n                        case '<!--':\n                            length = line;\n                            c = character;\n                            for (;;) {\n                                i = source_row.indexOf('--');\n                                if (i >= 0) {\n                                    break;\n                                }\n                                i = source_row.indexOf('<!');\n                                if (i >= 0) {\n                                    stop_at('nested_comment',\n                                        line, character + i);\n                                }\n                                if (!next_line()) {\n                                    stop_at('unclosed_comment', length, c);\n                                }\n                            }\n                            length = source_row.indexOf('<!');\n                            if (length >= 0 && length < i) {\n                                stop_at('nested_comment',\n                                    line, character + length);\n                            }\n                            character += i;\n                            if (source_row.charAt(i + 2) !== '>') {\n                                stop_at('expected_a', line, character, '-->');\n                            }\n                            character += 3;\n                            source_row = source_row.slice(i + 3);\n                            break;\n                        case '#':\n                            if (xmode === 'html' || xmode === 'styleproperty') {\n                                for (;;) {\n                                    c = source_row.charAt(0);\n                                    if ((c < '0' || c > '9') &&\n                                            (c < 'a' || c > 'f') &&\n                                            (c < 'A' || c > 'F')) {\n                                        break;\n                                    }\n                                    character += 1;\n                                    source_row = source_row.substr(1);\n                                    symbol += c;\n                                }\n                                if (symbol.length !== 4 && symbol.length !== 7) {\n                                    warn_at('bad_color_a', line,\n                                        from + length, symbol);\n                                }\n                                return it('(color)', symbol);\n                            }\n                            return it('(punctuator)', symbol);\n\n                        default:\n                            if (xmode === 'outer' && c === '&') {\n                                character += 1;\n                                source_row = source_row.substr(1);\n                                for (;;) {\n                                    c = source_row.charAt(0);\n                                    character += 1;\n                                    source_row = source_row.substr(1);\n                                    if (c === ';') {\n                                        break;\n                                    }\n                                    if (!((c >= '0' && c <= '9') ||\n                                            (c >= 'a' && c <= 'z') ||\n                                            c === '#')) {\n                                        stop_at('bad_entity', line, from + length,\n                                            character);\n                                    }\n                                }\n                                break;\n                            }\n                            return it('(punctuator)', symbol);\n                        }\n                    }\n                }\n            }\n        };\n    }());\n\n\n    function add_label(symbol, type) {\n\n        if (option.safe && funct['(global)'] &&\n                typeof predefined[symbol] !== 'boolean') {\n            warn('adsafe_a', token, symbol);\n        } else if (symbol === 'hasOwnProperty') {\n            warn('bad_name_a', token, symbol);\n        }\n\n// Define symbol in the current function in the current scope.\n\n        if (Object.prototype.hasOwnProperty.call(funct, symbol) && !funct['(global)']) {\n            warn(funct[symbol] === true ?\n                bundle.used_before_a :\n                bundle.already_defined,\n                next_token, symbol);\n        }\n        funct[symbol] = type;\n        if (funct['(global)']) {\n            if (global[symbol] === false) {\n                warn('read_only');\n            }\n            global[symbol] = true;\n            if (Object.prototype.hasOwnProperty.call(implied, symbol)) {\n                warn('used_before_a', next_token, symbol);\n                delete implied[symbol];\n            }\n        } else {\n            scope[symbol] = funct;\n        }\n    }\n\n\n    function peek(distance) {\n\n// Peek ahead to a future token. The distance is how far ahead to look. The\n// default is the next token.\n\n        var found, slot = 0;\n\n        distance = distance || 0;\n        while (slot <= distance) {\n            found = lookahead[slot];\n            if (!found) {\n                found = lookahead[slot] = lex.token();\n            }\n            slot += 1;\n        }\n        return found;\n    }\n\n\n    function discard(it) {\n\n// The token will not be included in the parse tree, so move the comments\n// that are attached to the token to tokens that are in the tree.\n\n        it = it || token;\n        if (it.comments) {\n            var prev = it.prev;\n            while (prev.comments === null) {\n                prev = prev.prev;\n            }\n            if (prev.comments) {\n                prev.comments = prev.comments.concat(it.comments);\n            } else {\n                prev.comments = it.comments;\n            }\n        }\n        it.comments = null;\n    }\n\n\n    function advance(id, match) {\n\n// Produce the next token, also looking for programming errors.\n\n        if (indent) {\n\n// In indentation checking was requested, then inspect all of the line breakings.\n// The var statement is tricky because the names might be aligned or not. We\n// look at the first line break after the var to determine the programmer's\n// intention.\n\n            if (var_mode && next_token.line !== token.line) {\n                if ((var_mode !== indent || !next_token.edge) &&\n                        next_token.from === indent.at -\n                        (next_token.edge ? option.indent : 0)) {\n                    var dent = indent;\n                    for (;;) {\n                        dent.at -= option.indent;\n                        if (dent === var_mode) {\n                            break;\n                        }\n                        dent = dent.was;\n                    }\n                    dent.open = false;\n                }\n                var_mode = false;\n            }\n            if (indent.open) {\n\n// If the token is an edge.\n\n                if (next_token.edge) {\n                    if (next_token.edge === 'label') {\n                        expected_at(1);\n                    } else if (next_token.edge === 'case') {\n                        expected_at(indent.at - option.indent);\n                    } else if (indent.mode !== 'array' || next_token.line !== token.line) {\n                        expected_at(indent.at);\n                    }\n\n// If the token is not an edge, but is the first token on the line.\n\n                } else if (next_token.line !== token.line) {\n                    if (next_token.from < indent.at + (indent.mode ===\n                            'expression' ? 0 : option.indent)) {\n                        expected_at(indent.at + option.indent);\n                    }\n                    indent.wrap = true;\n                }\n            } else if (next_token.line !== token.line) {\n                if (next_token.edge) {\n                    expected_at(indent.at);\n                } else {\n                    indent.wrap = true;\n                    if (indent.mode === 'statement' || indent.mode === 'var') {\n                        expected_at(indent.at + option.indent);\n                    } else if (next_token.from < indent.at + (indent.mode ===\n                            'expression' ? 0 : option.indent)) {\n                        expected_at(indent.at + option.indent);\n                    }\n                }\n            }\n        }\n\n        switch (token.id) {\n        case '(number)':\n            if (next_token.id === '.') {\n                warn('trailing_decimal_a');\n            }\n            break;\n        case '-':\n            if (next_token.id === '-' || next_token.id === '--') {\n                warn('confusing_a');\n            }\n            break;\n        case '+':\n            if (next_token.id === '+' || next_token.id === '++') {\n                warn('confusing_a');\n            }\n            break;\n        }\n        if (token.arity === 'string' || token.identifier) {\n            anonname = token.value;\n        }\n\n        if (id && next_token.id !== id) {\n            if (match) {\n                warn('expected_a_b_from_c_d', next_token, id,\n                    match.id, match.line, next_token.value);\n            } else if (!next_token.identifier || next_token.value !== id) {\n                warn('expected_a_b', next_token, id, next_token.value);\n            }\n        }\n        prev_token = token;\n        token = next_token;\n        next_token = lookahead.shift() || lex.token();\n        if (token.id === '(end)') {\n            discard();\n        }\n    }\n\n\n    function directive() {\n        var command = this.id,\n            name,\n            old_comments_off = comments_off,\n            old_option_white = option.white,\n            value;\n        if (next_token.line === token.line && next_token.from === token.thru) {\n            warn('missing_space_a_b', next_token, token.value, next_token.value);\n        }\n        comments_off = true;\n        option.white = false;\n        if (lookahead.length > 0 || next_token.comments) {\n            warn('unexpected_a', this);\n        }\n        switch (command) {\n        case '/*properties':\n        case '/*property':\n        case '/*members':\n        case '/*member':\n            command = '/*properties';\n            if (!properties) {\n                properties = {};\n            }\n            break;\n        case '/*jslint':\n            if (option.safe) {\n                warn('adsafe_a', this);\n            }\n            break;\n        case '/*globals':\n        case '/*global':\n            command = '/*global';\n            if (option.safe) {\n                warn('adsafe_a', this);\n            }\n            break;\n        default:\n            stop('unpexpected_a', this);\n        }\nloop:   for (;;) {\n            for (;;) {\n                if (next_token.id === '*/') {\n                    break loop;\n                }\n                if (next_token.id !== ',') {\n                    break;\n                }\n                advance();\n            }\n            if (next_token.arity !== 'string' && !next_token.identifier) {\n                stop('unexpected_a', next_token);\n            }\n            name = next_token.value;\n            advance();\n            switch (command) {\n            case '/*global':\n                if (next_token.id === ':') {\n                    advance(':');\n                    switch (next_token.id) {\n                    case 'true':\n                        if (typeof scope[name] === 'object' ||\n                                global[name] === false) {\n                            stop('unexpected_a');\n                        }\n                        global[name] = true;\n                        advance('true');\n                        break;\n                    case 'false':\n                        if (typeof scope[name] === 'object') {\n                            stop('unexpected_a');\n                        }\n                        global[name] = false;\n                        advance('false');\n                        break;\n                    default:\n                        stop('unexpected_a');\n                    }\n                } else {\n                    if (typeof scope[name] === 'object') {\n                        stop('unexpected_a');\n                    }\n                    global[name] = false;\n                }\n                break;\n            case '/*jslint':\n                if (next_token.id !== ':') {\n                    stop('expected_a_b', next_token, ':', next_token.value);\n                }\n                advance(':');\n                switch (name) {\n                case 'indent':\n                    value = +next_token.value;\n                    if (typeof value !== 'number' ||\n                            !isFinite(value) || value < 0 ||\n                            Math.floor(value) !== value) {\n                        stop('expected_small_a');\n                    }\n                    if (value > 0) {\n                        old_option_white = true;\n                    }\n                    option.indent = value;\n                    break;\n                case 'maxerr':\n                    value = +next_token.value;\n                    if (typeof value !== 'number' ||\n                            !isFinite(value) ||\n                            value <= 0 ||\n                            Math.floor(value) !== value) {\n                        stop('expected_small_a', next_token);\n                    }\n                    option.maxerr = value;\n                    break;\n                case 'maxlen':\n                    value = +next_token.value;\n                    if (typeof value !== 'number' || !isFinite(value) || value < 0 ||\n                            Math.floor(value) !== value) {\n                        stop('expected_small_a');\n                    }\n                    option.maxlen = value;\n                    break;\n                case 'white':\n                    if (next_token.id === 'true') {\n                        old_option_white = true;\n                    } else if (next_token.id === 'false') {\n                        old_option_white = false;\n                    } else {\n                        stop('unexpected_a');\n                    }\n                    break;\n                default:\n                    if (next_token.id === 'true') {\n                        option[name] = true;\n                    } else if (next_token.id === 'false') {\n                        option[name] = false;\n                    } else {\n                        stop('unexpected_a');\n                    }\n                }\n                advance();\n                break;\n            case '/*properties':\n                properties[name] = true;\n                break;\n            default:\n                stop('unexpected_a');\n            }\n        }\n        if (command === '/*jslint') {\n            assume();\n        }\n        comments_off = old_comments_off;\n        advance('*/');\n        option.white = old_option_white;\n    }\n\n\n// Indentation intention\n\n    function edge(mode) {\n        next_token.edge = !indent || (indent.open && (mode || true));\n    }\n\n\n    function step_in(mode) {\n        var open, was;\n        if (typeof mode === 'number') {\n            indent = {\n                at: mode,\n                open: true,\n                was: was\n            };\n        } else if (!indent) {\n            indent = {\n                at: 1,\n                mode: 'statement',\n                open: true\n            };\n        } else {\n            was = indent;\n            open = mode === 'var' ||\n                (next_token.line !== token.line && mode !== 'statement');\n            indent = {\n                at: (open || mode === 'control' ?\n                    was.at + option.indent : was.at) +\n                    (was.wrap ? option.indent : 0),\n                mode: mode,\n                open: open,\n                was: was\n            };\n            if (mode === 'var' && open) {\n                var_mode = indent;\n            }\n        }\n    }\n\n    function step_out(id, symbol) {\n        if (id) {\n            if (indent && indent.open) {\n                indent.at -= option.indent;\n                edge();\n            }\n            advance(id, symbol);\n        }\n        if (indent) {\n            indent = indent.was;\n        }\n    }\n\n// Functions for conformance of whitespace.\n\n    function one_space(left, right) {\n        left = left || token;\n        right = right || next_token;\n        if (right.id !== '(end)' && option.white &&\n                (token.line !== right.line ||\n                token.thru + 1 !== right.from)) {\n            warn('expected_space_a_b', right, token.value, right.value);\n        }\n    }\n\n    function one_space_only(left, right) {\n        left = left || token;\n        right = right || next_token;\n        if (right.id !== '(end)' && (left.line !== right.line ||\n                (option.white && left.thru + 1 !== right.from))) {\n            warn('expected_space_a_b', right, left.value, right.value);\n        }\n    }\n\n    function no_space(left, right) {\n        left = left || token;\n        right = right || next_token;\n        if ((option.white || xmode === 'styleproperty' || xmode === 'style') &&\n                left.thru !== right.from && left.line === right.line) {\n            warn('unexpected_space_a_b', right, left.value, right.value);\n        }\n    }\n\n    function no_space_only(left, right) {\n        left = left || token;\n        right = right || next_token;\n        if (right.id !== '(end)' && (left.line !== right.line ||\n                (option.white && left.thru !== right.from))) {\n            warn('unexpected_space_a_b', right, left.value, right.value);\n        }\n    }\n\n    function spaces(left, right) {\n        if (option.white) {\n            left = left || token;\n            right = right || next_token;\n            if (left.thru === right.from && left.line === right.line) {\n                warn('missing_space_a_b', right, left.value, right.value);\n            }\n        }\n    }\n\n    function comma() {\n        if (next_token.id !== ',') {\n            warn_at('expected_a_b', token.line, token.thru, ',', next_token.value);\n        } else {\n            if (option.white) {\n                no_space_only();\n            }\n            advance(',');\n            discard();\n            spaces();\n        }\n    }\n\n\n    function semicolon() {\n        if (next_token.id !== ';') {\n            warn_at('expected_a_b', token.line, token.thru, ';', next_token.value);\n        } else {\n            if (option.white) {\n                no_space_only();\n            }\n            advance(';');\n            discard();\n            if (semicolon_coda[next_token.id] !== true) {\n                spaces();\n            }\n        }\n    }\n\n    function use_strict() {\n        if (next_token.value === 'use strict') {\n            if (strict_mode) {\n                warn('unnecessary_use');\n            }\n            edge();\n            advance();\n            semicolon();\n            strict_mode = true;\n            option.newcap = true;\n            option.undef = true;\n            return true;\n        } else {\n            return false;\n        }\n    }\n\n\n    function are_similar(a, b) {\n        if (a === b) {\n            return true;\n        }\n        if (Array.isArray(a)) {\n            if (Array.isArray(b) && a.length === b.length) {\n                var i;\n                for (i = 0; i < a.length; i += 1) {\n                    if (!are_similar(a[i], b[i])) {\n                        return false;\n                    }\n                }\n                return true;\n            }\n            return false;\n        }\n        if (Array.isArray(b)) {\n            return false;\n        }\n        if (a.arity === b.arity && a.value === b.value) {\n            switch (a.arity) {\n            case 'prefix':\n            case 'suffix':\n            case undefined:\n                return are_similar(a.first, b.first);\n            case 'infix':\n                return are_similar(a.first, b.first) &&\n                    are_similar(a.second, b.second);\n            case 'ternary':\n                return are_similar(a.first, b.first) &&\n                    are_similar(a.second, b.second) &&\n                    are_similar(a.third, b.third);\n            case 'function':\n            case 'regexp':\n                return false;\n            default:\n                return true;\n            }\n        } else {\n            if (a.id === '.' && b.id === '[' && b.arity === 'infix') {\n                return a.second.value === b.second.value && b.second.arity === 'string';\n            } else if (a.id === '[' && a.arity === 'infix' && b.id === '.') {\n                return a.second.value === b.second.value && a.second.arity === 'string';\n            }\n        }\n        return false;\n    }\n\n\n// This is the heart of JSLINT, the Pratt parser. In addition to parsing, it\n// is looking for ad hoc lint patterns. We add .fud to Pratt's model, which is\n// like .nud except that it is only used on the first token of a statement.\n// Having .fud makes it much easier to define statement-oriented languages like\n// JavaScript. I retained Pratt's nomenclature.\n\n// .nud     Null denotation\n// .fud     First null denotation\n// .led     Left denotation\n//  lbp     Left binding power\n//  rbp     Right binding power\n\n// They are elements of the parsing method called Top Down Operator Precedence.\n\n    function expression(rbp, initial) {\n\n// rbp is the right binding power.\n// initial indicates that this is the first expression of a statement.\n\n        var left;\n        if (next_token.id === '(end)') {\n            stop('unexpected_a', token, next_token.id);\n        }\n        advance();\n        if (option.safe && typeof predefined[token.value] === 'boolean' &&\n                (next_token.id !== '(' && next_token.id !== '.')) {\n            warn('adsafe', token);\n        }\n        if (initial) {\n            anonname = 'anonymous';\n            funct['(verb)'] = token.value;\n        }\n        if (initial === true && token.fud) {\n            left = token.fud();\n        } else {\n            if (token.nud) {\n                left = token.nud();\n            } else {\n                if (next_token.arity === 'number' && token.id === '.') {\n                    warn('leading_decimal_a', token,\n                        next_token.value);\n                    advance();\n                    return token;\n                } else {\n                    stop('expected_identifier_a', token, token.id);\n                }\n            }\n            while (rbp < next_token.lbp) {\n                advance();\n                if (token.led) {\n                    left = token.led(left);\n                } else {\n                    stop('expected_operator_a', token, token.id);\n                }\n            }\n        }\n        return left;\n    }\n\n\n// Functional constructors for making the symbols that will be inherited by\n// tokens.\n\n    function symbol(s, p) {\n        var x = syntax[s];\n        if (!x || typeof x !== 'object') {\n            syntax[s] = x = {\n                id: s,\n                lbp: p,\n                value: s\n            };\n        }\n        return x;\n    }\n\n\n    function delim(s) {\n        return symbol(s, 0);\n    }\n\n\n    function postscript(x) {\n        x.postscript = true;\n        return x;\n    }\n\n    function ultimate(s) {\n        var x = symbol(s, 0);\n        x.from = 1;\n        x.thru = 1;\n        x.line = 0;\n        x.edge = true;\n        s.value = s;\n        return postscript(x);\n    }\n\n\n    function stmt(s, f) {\n        var x = delim(s);\n        x.identifier = x.reserved = true;\n        x.fud = f;\n        return x;\n    }\n\n    function labeled_stmt(s, f) {\n        var x = stmt(s, f);\n        x.labeled = true;\n    }\n\n    function disrupt_stmt(s, f) {\n        var x = stmt(s, f);\n        x.disrupt = true;\n    }\n\n\n    function reserve_name(x) {\n        var c = x.id.charAt(0);\n        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {\n            x.identifier = x.reserved = true;\n        }\n        return x;\n    }\n\n\n    function prefix(s, f) {\n        var x = symbol(s, 150);\n        reserve_name(x);\n        x.nud = (typeof f === 'function') ? f : function () {\n            if (s === 'typeof') {\n                one_space();\n            } else {\n                no_space_only();\n            }\n            this.first = expression(150);\n            this.arity = 'prefix';\n            if (this.id === '++' || this.id === '--') {\n                if (option.plusplus) {\n                    warn('unexpected_a', this);\n                } else if ((!this.first.identifier || this.first.reserved) &&\n                        this.first.id !== '.' && this.first.id !== '[') {\n                    warn('bad_operand', this);\n                }\n            }\n            return this;\n        };\n        return x;\n    }\n\n\n    function type(s, arity, nud) {\n        var x = delim(s);\n        x.arity = arity;\n        if (nud) {\n            x.nud = nud;\n        }\n        return x;\n    }\n\n\n    function reserve(s, f) {\n        var x = delim(s);\n        x.identifier = x.reserved = true;\n        if (typeof f === 'function') {\n            x.nud = f;\n        }\n        return x;\n    }\n\n\n    function reservevar(s, v) {\n        return reserve(s, function () {\n            if (typeof v === 'function') {\n                v(this);\n            }\n            return this;\n        });\n    }\n\n\n    function infix(s, p, f, w) {\n        var x = symbol(s, p);\n        reserve_name(x);\n        x.led = function (left) {\n            this.arity = 'infix';\n            if (!w) {\n                spaces(prev_token, token);\n                spaces();\n            }\n            if (typeof f === 'function') {\n                return f(left, this);\n            } else {\n                this.first = left;\n                this.second = expression(p);\n                return this;\n            }\n        };\n        return x;\n    }\n\n    function expected_relation(node, message) {\n        if (node.assign) {\n            warn(message || bundle.conditional_assignment, node);\n        }\n        return node;\n    }\n\n    function expected_condition(node, message) {\n        switch (node.id) {\n        case '[':\n        case '-':\n            if (node.arity !== 'infix') {\n                warn(message || bundle.weird_condition, node);\n            }\n            break;\n        case 'false':\n        case 'function':\n        case 'Infinity':\n        case 'NaN':\n        case 'null':\n        case 'true':\n        case 'undefined':\n        case 'void':\n        case '(number)':\n        case '(regexp)':\n        case '(string)':\n        case '{':\n            warn(message || bundle.weird_condition, node);\n            break;\n        }\n        return node;\n    }\n\n    function check_relation(node) {\n        switch (node.arity) {\n        case 'prefix':\n            switch (node.id) {\n            case '{':\n            case '[':\n                warn('unexpected_a', node);\n                break;\n            case '!':\n                warn('confusing_a', node);\n                break;\n            }\n            break;\n        case 'function':\n        case 'regexp':\n            warn('unexpected_a', node);\n            break;\n        default:\n            if (node.id  === 'NaN') {\n                warn('isnan', node);\n            }\n        }\n        return node;\n    }\n\n\n    function relation(s, eqeq) {\n        var x = infix(s, 100, function (left, that) {\n            check_relation(left);\n            if (eqeq) {\n                warn('expected_a_b', that, eqeq, that.id);\n            }\n            var right = expression(100);\n            if (are_similar(left, right) ||\n                    ((left.arity === 'string' || left.arity === 'number') &&\n                    (right.arity === 'string' || right.arity === 'number'))) {\n                warn('weird_relation', that);\n            }\n            that.first = left;\n            that.second = check_relation(right);\n            return that;\n        });\n        return x;\n    }\n\n\n    function assignop(s, bit) {\n        var x = infix(s, 20, function (left, that) {\n            var l;\n            if (option.bitwise && bit) {\n                warn('unexpected_a', that);\n            }\n            that.first = left;\n            if (funct[left.value] === false) {\n                warn('read_only', left);\n            } else if (left['function']) {\n                warn('a_function', left);\n            }\n            if (option.safe) {\n                l = left;\n                do {\n                    if (typeof predefined[l.value] === 'boolean') {\n                        warn('adsafe', l);\n                    }\n                    l = l.first;\n                } while (l);\n            }\n            if (left) {\n                if (left === syntax['function']) {\n                    warn('identifier_function', token);\n                }\n                if (left.id === '.' || left.id === '[') {\n                    if (!left.first || left.first.value === 'arguments') {\n                        warn('bad_assignment', that);\n                    }\n                    that.second = expression(19);\n                    if (that.id === '=' && are_similar(that.first, that.second)) {\n                        warn('weird_assignment', that);\n                    }\n                    return that;\n                } else if (left.identifier && !left.reserved) {\n                    if (funct[left.value] === 'exception') {\n                        warn('assign_exception', left);\n                    }\n                    that.second = expression(19);\n                    if (that.id === '=' && are_similar(that.first, that.second)) {\n                        warn('weird_assignment', that);\n                    }\n                    return that;\n                }\n            }\n            stop('bad_assignment', that);\n        });\n        x.assign = true;\n        return x;\n    }\n\n\n    function bitwise(s, p) {\n        return infix(s, p, function (left, that) {\n            if (option.bitwise) {\n                warn('unexpected_a', that);\n            }\n            that.first = left;\n            that.second = expression(p);\n            return that;\n        });\n    }\n\n\n    function suffix(s, f) {\n        var x = symbol(s, 150);\n        x.led = function (left) {\n            no_space_only(prev_token, token);\n            if (option.plusplus) {\n                warn('unexpected_a', this);\n            } else if ((!left.identifier || left.reserved) &&\n                    left.id !== '.' && left.id !== '[') {\n                warn('bad_operand', this);\n            }\n            this.first = left;\n            this.arity = 'suffix';\n            return this;\n        };\n        return x;\n    }\n\n\n    function optional_identifier() {\n        if (next_token.identifier) {\n            advance();\n            if (option.safe && banned[token.value]) {\n                warn('adsafe_a', token);\n            } else if (token.reserved && !option.es5) {\n                warn('expected_identifier_a_reserved', token);\n            }\n            return token.value;\n        }\n    }\n\n\n    function identifier() {\n        var i = optional_identifier();\n        if (i) {\n            return i;\n        }\n        if (token.id === 'function' && next_token.id === '(') {\n            warn('name_function');\n        } else {\n            stop('expected_identifier_a');\n        }\n    }\n\n\n    function statement(no_indent) {\n\n// Usually a statement starts a line. Exceptions include the var statement in the\n// initialization part of a for statement, and an if after an else.\n\n        var label, old_scope = scope, the_statement;\n\n// We don't like the empty statement.\n\n        if (next_token.id === ';') {\n            warn('unexpected_a');\n            semicolon();\n            return;\n        }\n\n// Is this a labeled statement?\n\n        if (next_token.identifier && !next_token.reserved && peek().id === ':') {\n            edge('label');\n            label = next_token;\n            advance();\n            discard();\n            advance(':');\n            discard();\n            scope = Object.create(old_scope);\n            add_label(label.value, 'label');\n            if (next_token.labeled !== true) {\n                warn('label_a_b', next_token, label.value, next_token.value);\n            }\n            if (jx.test(label.value + ':')) {\n                warn('url', label);\n            }\n            next_token.label = label;\n        }\n\n// Parse the statement.\n\n        edge();\n        step_in('statement');\n        the_statement = expression(0, true);\n        if (the_statement) {\n\n// Look for the final semicolon.\n\n            if (the_statement.arity === 'statement') {\n                if (the_statement.id === 'switch' ||\n                        (the_statement.block && the_statement.id !== 'do')) {\n                    spaces();\n                } else {\n                    semicolon();\n                }\n            } else {\n\n// If this is an expression statement, determine if it is acceptble.\n// We do not like\n//      new Blah();\n// statments. If it is to be used at all, new should only be used to make\n// objects, not side effects. The expression statements we do like do\n// assignment or invocation or delete.\n\n                if (the_statement.id === '(') {\n                    if (the_statement.first.id === 'new') {\n                        warn('bad_new');\n                    }\n                } else if (!the_statement.assign &&\n                        the_statement.id !== 'delete' &&\n                        the_statement.id !== '++' &&\n                        the_statement.id !== '--') {\n                    warn('assignment_function_expression', token);\n                }\n                semicolon();\n            }\n        }\n        step_out();\n        scope = old_scope;\n        return the_statement;\n    }\n\n\n    function statements() {\n        var array = [], disruptor, the_statement;\n\n// A disrupt statement may not be followed by any other statement.\n// If the last statement is disrupt, then the sequence is disrupt.\n\n        while (next_token.postscript !== true) {\n            if (next_token.id === ';') {\n                warn('unexpected_a', next_token);\n                semicolon();\n            } else {\n                if (disruptor) {\n                    warn('unreachable_a_b', next_token, next_token.value,\n                        disruptor.value);\n                    disruptor = null;\n                }\n                the_statement = statement();\n                if (the_statement) {\n                    array.push(the_statement);\n                    if (the_statement.disrupt) {\n                        disruptor = the_statement;\n                        array.disrupt = true;\n                    }\n                }\n            }\n        }\n        return array;\n    }\n\n\n    function block(ordinary) {\n\n// array block is array sequence of statements wrapped in braces.\n// ordinary is false for function bodies and try blocks.\n// ordinary is true for if statements, while, etc.\n\n        var array,\n            curly = next_token,\n            old_inblock = in_block,\n            old_scope = scope,\n            old_strict_mode = strict_mode;\n\n        in_block = ordinary;\n        scope = Object.create(scope);\n        spaces();\n        if (next_token.id === '{') {\n            advance('{');\n            step_in();\n            if (!ordinary && !use_strict() && !old_strict_mode &&\n                    option.strict && funct['(context)']['(global)']) {\n                warn('missing_use_strict');\n            }\n            array = statements();\n            strict_mode = old_strict_mode;\n            step_out('}', curly);\n            discard();\n        } else if (!ordinary) {\n            stop('expected_a_b', next_token, '{', next_token.value);\n        } else {\n            warn('expected_a_b', next_token, '{', next_token.value);\n            array = [statement()];\n            array.disrupt = array[0].disrupt;\n        }\n        funct['(verb)'] = null;\n        scope = old_scope;\n        in_block = old_inblock;\n        if (ordinary && array.length === 0) {\n            warn('empty_block');\n        }\n        return array;\n    }\n\n\n    function tally_property(name) {\n        if (properties && typeof properties[name] !== 'boolean') {\n            warn('unexpected_property_a', token, name);\n        }\n        if (typeof member[name] === 'number') {\n            member[name] += 1;\n        } else {\n            member[name] = 1;\n        }\n    }\n\n\n    function note_implied(token) {\n        var name = token.value, line = token.line, a = implied[name];\n        if (typeof a === 'function') {\n            a = false;\n        }\n        if (!a) {\n            a = [line];\n            implied[name] = a;\n        } else if (a[a.length - 1] !== line) {\n            a.push(line);\n        }\n    }\n\n\n// ECMAScript parser\n\n    syntax['(identifier)'] = {\n        type: '(identifier)',\n        lbp: 0,\n        identifier: true,\n        nud: function () {\n            var variable = this.value,\n                site = scope[variable];\n            if (typeof site === 'function') {\n                site = undefined;\n            }\n\n// The name is in scope and defined in the current function.\n\n            if (funct === site) {\n\n//      Change 'unused' to 'var', and reject labels.\n\n                switch (funct[variable]) {\n                case 'error':\n                    warn('unexpected_a', token);\n                    funct[variable] = 'var';\n                    break;\n                case 'unused':\n                    funct[variable] = 'var';\n                    break;\n                case 'unction':\n                    funct[variable] = 'function';\n                    this['function'] = true;\n                    break;\n                case 'function':\n                    this['function'] = true;\n                    break;\n                case 'label':\n                    warn('a_label', token, variable);\n                    break;\n                }\n\n// The name is not defined in the function.  If we are in the global scope,\n// then we have an undefined variable.\n\n            } else if (funct['(global)']) {\n                if (typeof global[variable] === 'boolean') {\n                    funct[variable] = global[variable];\n                } else {\n                    if (option.undef) {\n                        warn('not_a_defined', token, variable);\n                    } else {\n                        note_implied(token);\n                    }\n                }\n\n// If the name is already defined in the current\n// function, but not as outer, then there is a scope error.\n\n            } else {\n                switch (funct[variable]) {\n                case 'closure':\n                case 'function':\n                case 'var':\n                case 'unused':\n                    warn('a_scope', token, variable);\n                    break;\n                case 'label':\n                    warn('a_label', token, variable);\n                    break;\n                case 'outer':\n                case true:\n                case false:\n                    break;\n                default:\n\n// If the name is defined in an outer function, make an outer entry, and if\n// it was unused, make it var.\n\n                    if (typeof site === 'boolean') {\n                        funct[variable] = site;\n                        functions[0][variable] = true;\n                    } else if (site === null) {\n                        warn('a_not_allowed', token, variable);\n                        note_implied(token);\n                    } else if (typeof site !== 'object') {\n                        if (option.undef) {\n                            warn('a_not_defined', token, variable);\n                        } else {\n                            funct[variable] = true;\n                        }\n                        note_implied(token);\n                    } else {\n                        switch (site[variable]) {\n                        case 'function':\n                        case 'unction':\n                            this['function'] = true;\n                            site[variable] = 'closure';\n                            funct[variable] = site['(global)'] ? false : 'outer';\n                            break;\n                        case 'var':\n                        case 'unused':\n                            site[variable] = 'closure';\n                            funct[variable] = site['(global)'] ? true : 'outer';\n                            break;\n                        case 'closure':\n                        case 'parameter':\n                            funct[variable] = site['(global)'] ? true : 'outer';\n                            break;\n                        case 'error':\n                            warn('not_a_defined', token);\n                            break;\n                        case 'label':\n                            warn('a_label', token, variable);\n                            break;\n                        }\n                    }\n                }\n            }\n            return this;\n        },\n        led: function () {\n            stop('expected_operator_a');\n        }\n    };\n\n// Build the syntax table by declaring the syntactic elements.\n\n    type('(color)', 'color');\n    type('(number)', 'number', return_this);\n    type('(string)', 'string', return_this);\n    type('(range)', 'range');\n    type('(regexp)', 'regexp', return_this);\n\n    ultimate('(begin)');\n    ultimate('(end)');\n    ultimate('(error)');\n    postscript(delim('</'));\n    delim('<!');\n    delim('<!--');\n    delim('-->');\n    postscript(delim('}'));\n    delim(')');\n    delim(']');\n    postscript(delim('\"'));\n    postscript(delim('\\''));\n    delim(';');\n    delim(':');\n    delim(',');\n    delim('#');\n    delim('@');\n    delim('*/');\n    postscript(reserve('case'));\n    reserve('catch');\n    postscript(reserve('default'));\n    reserve('else');\n    reserve('finally');\n\n    reservevar('arguments', function (x) {\n        if (strict_mode && funct['(global)']) {\n            warn('strict', x);\n        } else if (option.safe) {\n            warn('adsafe', x);\n        }\n    });\n    reservevar('eval', function (x) {\n        if (option.safe) {\n            warn('adsafe', x);\n        }\n    });\n    reservevar('false');\n    reservevar('Infinity');\n    reservevar('NaN');\n    reservevar('null');\n    reservevar('this', function (x) {\n        if (strict_mode && ((funct['(statement)'] &&\n                funct['(name)'].charAt(0) > 'Z') || funct['(global)'])) {\n            warn('strict', x);\n        } else if (option.safe) {\n            warn('adsafe', x);\n        }\n    });\n    reservevar('true');\n    reservevar('undefined');\n\n    assignop('=');\n    assignop('+=');\n    assignop('-=');\n    assignop('*=');\n    assignop('/=').nud = function () {\n        stop('slash_equal');\n    };\n    assignop('%=');\n    assignop('&=', true);\n    assignop('|=', true);\n    assignop('^=', true);\n    assignop('<<=', true);\n    assignop('>>=', true);\n    assignop('>>>=', true);\n\n    infix('?', 30, function (left, that) {\n        that.first = expected_condition(expected_relation(left));\n        that.second = expression(0);\n        spaces();\n        advance(':');\n        discard();\n        spaces();\n        that.third = expression(10);\n        that.arity = 'ternary';\n        if (are_similar(that.second, that.third)) {\n            warn('weird_ternary', that);\n        }\n        return that;\n    });\n\n    infix('||', 40, function (left, that) {\n        function paren_check(that) {\n            if (that.id === '&&' && !that.paren) {\n                warn('and', that);\n            }\n            return that;\n        }\n\n        that.first = paren_check(expected_condition(expected_relation(left)));\n        that.second = paren_check(expected_relation(expression(40)));\n        if (are_similar(that.first, that.second)) {\n            warn('weird_condition', that);\n        }\n        return that;\n    });\n\n    infix('&&', 50, function (left, that) {\n        that.first = expected_condition(expected_relation(left));\n        that.second = expected_relation(expression(50));\n        if (are_similar(that.first, that.second)) {\n            warn('weird_condition', that);\n        }\n        return that;\n    });\n\n    prefix('void', function () {\n        this.first = expression(0);\n        if (this.first.arity !== 'number' || this.first.value) {\n            warn('unexpected_a', this);\n            return this;\n        }\n        return this;\n    });\n\n    bitwise('|', 70);\n    bitwise('^', 80);\n    bitwise('&', 90);\n\n    relation('==', '===');\n    relation('===');\n    relation('!=', '!==');\n    relation('!==');\n    relation('<');\n    relation('>');\n    relation('<=');\n    relation('>=');\n\n    bitwise('<<', 120);\n    bitwise('>>', 120);\n    bitwise('>>>', 120);\n\n    infix('in', 120, function (left, that) {\n        warn('infix_in', that);\n        that.left = left;\n        that.right = expression(130);\n        return that;\n    });\n    infix('instanceof', 120);\n    infix('+', 130, function (left, that) {\n        if (!left.value) {\n            if (left.arity === 'number') {\n                warn('unexpected_a', left);\n            } else if (left.arity === 'string') {\n                warn('expected_a_b', left, 'String', '\\'\\'');\n            }\n        }\n        var right = expression(130);\n        if (!right.value) {\n            if (right.arity === 'number') {\n                warn('unexpected_a', right);\n            } else if (right.arity === 'string') {\n                warn('expected_a_b', right, 'String', '\\'\\'');\n            }\n        }\n        if (left.arity === right.arity &&\n                (left.arity === 'string' || left.arity === 'number')) {\n            left.value += right.value;\n            left.thru = right.thru;\n            if (left.arity === 'string' && jx.test(left.value)) {\n                warn('url', left);\n            }\n            discard(right);\n            discard(that);\n            return left;\n        }\n        that.first = left;\n        that.second = right;\n        return that;\n    });\n    prefix('+', 'num');\n    prefix('+++', function () {\n        warn('confusing_a', token);\n        this.first = expression(150);\n        this.arity = 'prefix';\n        return this;\n    });\n    infix('+++', 130, function (left) {\n        warn('confusing_a', token);\n        this.first = left;\n        this.second = expression(130);\n        return this;\n    });\n    infix('-', 130, function (left, that) {\n        if ((left.arity === 'number' && left.value === 0) || left.arity === 'string') {\n            warn('unexpected_a', left);\n        }\n        var right = expression(130);\n        if ((right.arity === 'number' && right.value === 0) || right.arity === 'string') {\n            warn('unexpected_a', left);\n        }\n        if (left.arity === right.arity && left.arity === 'number') {\n            left.value -= right.value;\n            left.thru = right.thru;\n            discard(right);\n            discard(that);\n            return left;\n        }\n        that.first = left;\n        that.second = right;\n        return that;\n    });\n    prefix('-');\n    prefix('---', function () {\n        warn('confusing_a', token);\n        this.first = expression(150);\n        this.arity = 'prefix';\n        return this;\n    });\n    infix('---', 130, function (left) {\n        warn('confusing_a', token);\n        this.first = left;\n        this.second = expression(130);\n        return this;\n    });\n    infix('*', 140, function (left, that) {\n        if ((left.arity === 'number' && (left.value === 0 || left.value === 1)) || left.arity === 'string') {\n            warn('unexpected_a', left);\n        }\n        var right = expression(140);\n        if ((right.arity === 'number' && (right.value === 0 || right.value === 1)) || right.arity === 'string') {\n            warn('unexpected_a', right);\n        }\n        if (left.arity === right.arity && left.arity === 'number') {\n            left.value *= right.value;\n            left.thru = right.thru;\n            discard(right);\n            discard(that);\n            return left;\n        }\n        that.first = left;\n        that.second = right;\n        return that;\n    });\n    infix('/', 140, function (left, that) {\n        if ((left.arity === 'number' && left.value === 0) || left.arity === 'string') {\n            warn('unexpected_a', left);\n        }\n        var right = expression(140);\n        if ((right.arity === 'number' && (right.value === 0 || right.value === 1)) || right.arity === 'string') {\n            warn('unexpected_a', right);\n        }\n        if (left.arity === right.arity && left.arity === 'number') {\n            left.value /= right.value;\n            left.thru = right.thru;\n            discard(right);\n            discard(that);\n            return left;\n        }\n        that.first = left;\n        that.second = right;\n        return that;\n    });\n    infix('%', 140, function (left, that) {\n        if ((left.arity === 'number' && (left.value === 0 || left.value === 1)) || left.arity === 'string') {\n            warn('unexpected_a', left);\n        }\n        var right = expression(140);\n        if ((right.arity === 'number' && (right.value === 0 || right.value === 1)) || right.arity === 'string') {\n            warn('unexpected_a', right);\n        }\n        if (left.arity === right.arity && left.arity === 'number') {\n            left.value %= right.value;\n            left.thru = right.thru;\n            discard(right);\n            discard(that);\n            return left;\n        }\n        that.first = left;\n        that.second = right;\n        return that;\n    });\n\n    suffix('++');\n    prefix('++');\n\n    suffix('--');\n    prefix('--');\n    prefix('delete', function () {\n        one_space();\n        var p = expression(0);\n        if (!p || (p.id !== '.' && p.id !== '[')) {\n            warn('deleted');\n        }\n        this.first = p;\n        return this;\n    });\n\n\n    prefix('~', function () {\n        no_space_only();\n        if (option.bitwise) {\n            warn('unexpected_a', this);\n        }\n        expression(150);\n        return this;\n    });\n    prefix('!', function () {\n        no_space_only();\n        this.first = expression(150);\n        this.arity = 'prefix';\n        if (bang[this.first.id] === true) {\n            warn('confusing_a', this);\n        }\n        return this;\n    });\n    prefix('typeof');\n    prefix('new', function () {\n        one_space();\n        var c = expression(160), i, p;\n        this.first = c;\n        if (c.id !== 'function') {\n            if (c.identifier) {\n                switch (c.value) {\n                case 'Object':\n                    warn('use_object', token);\n                    break;\n                case 'Array':\n                    if (next_token.id === '(') {\n                        p = next_token;\n                        p.first = this;\n                        advance('(');\n                        if (next_token.id !== ')') {\n                            p.second = expression(0);\n                            if (p.second.arity !== 'number' || !p.second.value) {\n                                expected_condition(p.second,  bundle.use_array);\n                                i = false;\n                            } else {\n                                i = true;\n                            }\n                            while (next_token.id !== ')' && next_token.id !== '(end)') {\n                                if (i) {\n                                    warn('use_array', p);\n                                    i = false;\n                                }\n                                advance();\n                            }\n                        } else {\n                            warn('use_array', token);\n                        }\n                        advance(')', p);\n                        discard();\n                        return p;\n                    }\n                    warn('use_array', token);\n                    break;\n                case 'Number':\n                case 'String':\n                case 'Boolean':\n                case 'Math':\n                case 'JSON':\n                    warn('not_a_constructor', c);\n                    break;\n                case 'Function':\n                    if (!option.evil) {\n                        warn('function_eval');\n                    }\n                    break;\n                case 'Date':\n                case 'RegExp':\n                    break;\n                default:\n                    if (c.id !== 'function') {\n                        i = c.value.substr(0, 1);\n                        if (option.newcap && (i < 'A' || i > 'Z')) {\n                            warn('constructor_name_a', token);\n                        }\n                    }\n                }\n            } else {\n                if (c.id !== '.' && c.id !== '[' && c.id !== '(') {\n                    warn('bad_constructor', token);\n                }\n            }\n        } else {\n            warn('weird_new', this);\n        }\n        if (next_token.id !== '(') {\n            warn('missing_a', next_token, '()');\n        }\n        return this;\n    });\n\n    infix('(', 160, function (left, that) {\n        if (indent && indent.mode === 'expression') {\n            no_space(prev_token, token);\n        } else {\n            no_space_only(prev_token, token);\n        }\n        if (!left.immed && left.id === 'function') {\n            warn('wrap_immediate');\n        }\n        var p = [];\n        if (left) {\n            if (left.identifier) {\n                if (left.value.match(/^[A-Z]([A-Z0-9_$]*[a-z][A-Za-z0-9_$]*)?$/)) {\n                    if (left.value !== 'Number' && left.value !== 'String' &&\n                            left.value !== 'Boolean' && left.value !== 'Date') {\n                        if (left.value === 'Math' || left.value === 'JSON') {\n                            warn('not_a_function', left);\n                        } else if (left.value === 'Object') {\n                            warn('use_object', token);\n                        } else if (left.value === 'Array' || option.newcap) {\n                            warn('missing_a', left, 'new');\n                        }\n                    }\n                }\n            } else if (left.id === '.') {\n                if (option.safe && left.first.value === 'Math' &&\n                        left.second === 'random') {\n                    warn('adsafe', left);\n                }\n            }\n        }\n        step_in();\n        if (next_token.id !== ')') {\n            no_space();\n            for (;;) {\n                edge();\n                p.push(expression(10));\n                if (next_token.id !== ',') {\n                    break;\n                }\n                comma();\n            }\n        }\n        no_space();\n        step_out(')', that);\n        if (typeof left === 'object') {\n            if (left.value === 'parseInt' && p.length === 1) {\n                warn('radix', left);\n            }\n            if (!option.evil) {\n                if (left.value === 'eval' || left.value === 'Function' ||\n                        left.value === 'execScript') {\n                    warn('evil', left);\n                } else if (p[0] && p[0].arity === 'string' &&\n                        (left.value === 'setTimeout' ||\n                        left.value === 'setInterval')) {\n                    warn('implied_evil', left);\n                }\n            }\n            if (!left.identifier && left.id !== '.' && left.id !== '[' &&\n                    left.id !== '(' && left.id !== '&&' && left.id !== '||' &&\n                    left.id !== '?') {\n                warn('bad_invocation', left);\n            }\n        }\n        that.first = left;\n        that.second = p;\n        return that;\n    }, true);\n\n    prefix('(', function () {\n        step_in('expression');\n        discard();\n        no_space();\n        edge();\n        if (next_token.id === 'function') {\n            next_token.immed = true;\n        }\n        var value = expression(0);\n        value.paren = true;\n        no_space();\n        step_out(')', this);\n        discard();\n        if (value.id === 'function') {\n            if (next_token.id === '(') {\n                warn('move_invocation');\n            } else {\n                warn('bad_wrap', this);\n            }\n        }\n        return value;\n    });\n\n    infix('.', 170, function (left, that) {\n        no_space(prev_token, token);\n        no_space();\n        var name = identifier();\n        if (typeof name === 'string') {\n            tally_property(name);\n        }\n        that.first = left;\n        that.second = token;\n        if (left && left.value === 'arguments' &&\n                (name === 'callee' || name === 'caller')) {\n            warn('avoid_a', left, 'arguments.' + name);\n        } else if (!option.evil && left && left.value === 'document' &&\n                (name === 'write' || name === 'writeln')) {\n            warn('write_is_wrong', left);\n        } else if (option.adsafe) {\n            if (!adsafe_top && left.value === 'ADSAFE') {\n                if (name === 'id' || name === 'lib') {\n                    warn('adsafe', that);\n                } else if (name === 'go') {\n                    if (xmode !== 'script') {\n                        warn('adsafe', that);\n                    } else if (adsafe_went || next_token.id !== '(' ||\n                            peek(0).arity !== 'string' ||\n                            peek(0).value !== adsafe_id ||\n                            peek(1).id !== ',') {\n                        stop('adsafe_a', that, 'go');\n                    }\n                    adsafe_went = true;\n                    adsafe_may = false;\n                }\n            }\n            adsafe_top = false;\n        }\n        if (!option.evil && (name === 'eval' || name === 'execScript')) {\n            warn('evil');\n        } else if (option.safe) {\n            for (;;) {\n                if (banned[name] === true) {\n                    warn('adsafe_a', token, name);\n                }\n                if (typeof predefined[left.value] !== 'boolean' ||\n                        next_token.id === '(') {\n                    break;\n                }\n                if (standard_property[name] === true) {\n                    if (next_token.id === '.') {\n                        warn('adsafe', that);\n                    }\n                    break;\n                }\n                if (next_token.id !== '.') {\n                    warn('adsafe', that);\n                    break;\n                }\n                advance('.');\n                token.first = that;\n                token.second = name;\n                that = token;\n                name = identifier();\n                if (typeof name === 'string') {\n                    tally_property(name);\n                }\n            }\n        }\n        return that;\n    }, true);\n\n    infix('[', 170, function (left, that) {\n        no_space_only(prev_token, token);\n        no_space();\n        step_in();\n        edge();\n        var e = expression(0), s;\n        if (e.arity === 'string') {\n            if (option.safe && (banned[e.value] ||\n                    e.value.charAt(0) === '_' || e.value.slice(-1) === '_')) {\n                warn('adsafe_subscript_a', e);\n            } else if (!option.evil &&\n                    (e.value === 'eval' || e.value === 'execScript')) {\n                warn('evil', e);\n            }\n            tally_property(e.value);\n            if (!option.sub && ix.test(e.value)) {\n                s = syntax[e.value];\n                if (!s || !s.reserved) {\n                    warn('subscript', e);\n                }\n            }\n        } else if (e.arity !== 'number' && option.safe) {\n            if (!((e.arity === 'prefix' && adsafe_prefix[e.id] === true) ||\n                    (e.arity === 'infix' && adsafe_infix[e.id] === true))) {\n                warn('adsafe_subscript_a', e);\n            }\n        }\n        step_out(']', that);\n        discard();\n        no_space(prev_token, token);\n        that.first = left;\n        that.second = e;\n        return that;\n    }, true);\n\n    prefix('[', function () {\n        this.arity = 'prefix';\n        this.first = [];\n        step_in('array');\n        while (next_token.id !== '(end)') {\n            while (next_token.id === ',') {\n                warn('unexpected_a', next_token);\n                advance(',');\n                discard();\n            }\n            if (next_token.id === ']') {\n                break;\n            }\n            indent.wrap = false;\n            edge();\n            this.first.push(expression(10));\n            if (next_token.id === ',') {\n                comma();\n                if (next_token.id === ']' && !option.es5) {\n                    warn('unexpected_a', token);\n                    break;\n                }\n            } else {\n                break;\n            }\n        }\n        step_out(']', this);\n        discard();\n        return this;\n    }, 170);\n\n\n    function property_name() {\n        var id = optional_identifier(true);\n        if (!id) {\n            if (next_token.arity === 'string') {\n                id = next_token.value;\n                if (option.safe) {\n                    if (banned[id]) {\n                        warn('adsafe_a');\n                    } else if (id.charAt(0) === '_' ||\n                            id.charAt(id.length - 1) === '_') {\n                        warn('dangling_a');\n                    }\n                }\n                advance();\n            } else if (next_token.arity === 'number') {\n                id = next_token.value.toString();\n                advance();\n            }\n        }\n        return id;\n    }\n\n\n    function function_params() {\n        var id, paren = next_token, params = [];\n        advance('(');\n        step_in();\n        discard();\n        no_space();\n        if (next_token.id === ')') {\n            no_space();\n            step_out(')', paren);\n            discard();\n            return;\n        }\n        for (;;) {\n            edge();\n            id = identifier();\n            params.push(token);\n            add_label(id, 'parameter');\n            if (next_token.id === ',') {\n                comma();\n            } else {\n                no_space();\n                step_out(')', paren);\n                discard();\n                return params;\n            }\n        }\n    }\n\n\n    function do_function(func, name) {\n        var old_properties = properties,\n            old_option     = option,\n            old_global     = global,\n            old_scope      = scope;\n        funct = {\n            '(name)'     : name || '\"' + anonname + '\"',\n            '(line)'     : next_token.line,\n            '(context)'  : funct,\n            '(breakage)' : 0,\n            '(loopage)'  : 0,\n            '(scope)'    : scope,\n            '(token)'    : func\n        };\n        properties  = old_properties && Object.create(old_properties);\n        option      = Object.create(old_option);\n        global      = Object.create(old_global);\n        scope       = Object.create(old_scope);\n        token.funct = funct;\n        functions.push(funct);\n        if (name) {\n            add_label(name, 'function');\n        }\n        func.name = name || '';\n        func.first = funct['(params)'] = function_params();\n        one_space();\n        func.block = block(false);\n        funct      = funct['(context)'];\n        properties = old_properties;\n        option     = old_option;\n        global     = old_global;\n        scope      = old_scope;\n    }\n\n\n    prefix('{', function () {\n        var get, i, j, name, p, set, seen = {};\n        this.arity = 'prefix';\n        this.first = [];\n        step_in();\n        while (next_token.id !== '}') {\n            indent.wrap = false;\n\n// JSLint recognizes the ES5 extension for get/set in object literals,\n// but requires that they be used in pairs.\n\n            edge();\n            if (next_token.value === 'get' && peek().id !== ':') {\n                if (!option.es5) {\n                    warn('get_set');\n                }\n                get = next_token;\n                advance('get');\n                one_space_only();\n                name = next_token;\n                i = property_name();\n                if (!i) {\n                    stop('missing_property');\n                }\n                do_function(get, '');\n                if (funct['(loopage)']) {\n                    warn('function_loop', get);\n                }\n                p = get.first;\n                if (p) {\n                    warn('parameter_a_get_b', p[0], p[0].value, i);\n                }\n                comma();\n                set = next_token;\n                spaces();\n                edge();\n                advance('set');\n                one_space_only();\n                j = property_name();\n                if (i !== j) {\n                    stop('expected_a_b', token, i, j || next_token.value);\n                }\n                do_function(set, '');\n                p = set.first;\n                if (!p || p.length !== 1) {\n                    stop('parameter_set_a', set, 'value');\n                } else if (p[0].value !== 'value') {\n                    stop('expected_a_b', p[0], 'value', p[0].value);\n                }\n                name.first = [get, set];\n            } else {\n                name = next_token;\n                i = property_name();\n                if (typeof i !== 'string') {\n                    stop('missing_property');\n                }\n                advance(':');\n                discard();\n                spaces();\n                name.first = expression(10);\n            }\n            this.first.push(name);\n            if (seen[i] === true) {\n                warn('duplicate_a', next_token, i);\n            }\n            seen[i] = true;\n            tally_property(i);\n            if (next_token.id !== ',') {\n                break;\n            }\n            for (;;) {\n                comma();\n                if (next_token.id !== ',') {\n                    break;\n                }\n                warn('unexpected_a', next_token);\n            }\n            if (next_token.id === '}' && !option.es5) {\n                warn('unexpected_a', token);\n            }\n        }\n        step_out('}', this);\n        discard();\n        return this;\n    });\n\n    stmt('{', function () {\n        discard();\n        warn('statement_block');\n        this.arity = 'statement';\n        this.block = statements();\n        this.disrupt = this.block.disrupt;\n        advance('}', this);\n        discard();\n        return this;\n    });\n\n    stmt('/*global', directive);\n    stmt('/*globals', directive);\n    stmt('/*jslint', directive);\n    stmt('/*member', directive);\n    stmt('/*members', directive);\n    stmt('/*property', directive);\n    stmt('/*properties', directive);\n\n    stmt('var', function () {\n\n// JavaScript does not have block scope. It only has function scope. So,\n// declaring a variable in a block can have unexpected consequences.\n\n// var.first will contain an array, the array containing name tokens\n// and assignment tokens.\n\n        var assign, id, name;\n\n        if (funct['(onevar)'] && option.onevar) {\n            warn('combine_var');\n        } else if (!funct['(global)']) {\n            funct['(onevar)'] = true;\n        }\n        this.arity = 'statement';\n        this.first = [];\n        step_in('var');\n        for (;;) {\n            name = next_token;\n            id = identifier();\n            if (funct['(global)'] && predefined[id] === false) {\n                warn('redefinition_a', token, id);\n            }\n            add_label(id, 'error');\n\n            if (next_token.id === '=') {\n                assign = next_token;\n                assign.first = name;\n                spaces();\n                advance('=');\n                spaces();\n                if (next_token.id === 'undefined') {\n                    warn('unnecessary_initialize', token, id);\n                }\n                if (peek(0).id === '=' && next_token.identifier) {\n                    stop('var_a_not');\n                }\n                assign.second = expression(0);\n                assign.arity = 'infix';\n                this.first.push(assign);\n            } else {\n                this.first.push(name);\n            }\n            funct[id] = 'unused';\n            if (next_token.id !== ',') {\n                break;\n            }\n            comma();\n            if (var_mode && next_token.line === token.line &&\n                    this.first.length === 1) {\n                var_mode = false;\n                indent.open = false;\n                indent.at -= option.indent;\n            }\n            spaces();\n            edge();\n        }\n        var_mode = false;\n        step_out();\n        return this;\n    });\n\n    stmt('function', function () {\n        one_space();\n        if (in_block) {\n            warn('function_block', token);\n        }\n        var i = identifier();\n        if (i) {\n            add_label(i, 'unction');\n            no_space();\n        }\n        do_function(this, i, true);\n        if (next_token.id === '(' && next_token.line === token.line) {\n            stop('function_statement');\n        }\n        this.arity = 'statement';\n        return this;\n    });\n\n    prefix('function', function () {\n        one_space();\n        var i = optional_identifier();\n        if (i) {\n            no_space();\n        }\n        do_function(this, i);\n        if (funct['(loopage)']) {\n            warn('function_loop');\n        }\n        this.arity = 'function';\n        return this;\n    });\n\n    stmt('if', function () {\n        var paren = next_token;\n        one_space();\n        advance('(');\n        step_in('control');\n        discard();\n        no_space();\n        edge();\n        this.arity = 'statement';\n        this.first = expected_condition(expected_relation(expression(0)));\n        no_space();\n        step_out(')', paren);\n        discard();\n        one_space();\n        this.block = block(true);\n        if (next_token.id === 'else') {\n            one_space();\n            advance('else');\n            discard();\n            one_space();\n            this['else'] = next_token.id === 'if' || next_token.id === 'switch' ?\n                statement(true) : block(true);\n            if (this['else'].disrupt && this.block.disrupt) {\n                this.disrupt = true;\n            }\n        }\n        return this;\n    });\n\n    stmt('try', function () {\n\n// try.first    The catch variable\n// try.second   The catch clause\n// try.third    The finally clause\n// try.block    The try block\n\n        var exception_variable, old_scope, paren;\n        if (option.adsafe) {\n            warn('adsafe_a', this);\n        }\n        one_space();\n        this.arity = 'statement';\n        this.block = block(false);\n        if (next_token.id === 'catch') {\n            one_space();\n            advance('catch');\n            discard();\n            one_space();\n            paren = next_token;\n            advance('(');\n            step_in('control');\n            discard();\n            no_space();\n            edge();\n            old_scope = scope;\n            scope = Object.create(old_scope);\n            exception_variable = next_token.value;\n            this.first = exception_variable;\n            if (!next_token.identifier) {\n                warn('expected_identifier_a', next_token);\n            } else {\n                add_label(exception_variable, 'exception');\n            }\n            advance();\n            no_space();\n            step_out(')', paren);\n            discard();\n            one_space();\n            this.second = block(false);\n            scope = old_scope;\n        }\n        if (next_token.id === 'finally') {\n            discard();\n            one_space();\n            advance('finally');\n            discard();\n            one_space();\n            this.third = block(false);\n        } else if (!this.second) {\n            stop('expected_a_b', next_token, 'catch', next_token.value);\n        }\n        return this;\n    });\n\n    labeled_stmt('while', function () {\n        one_space();\n        var paren = next_token;\n        funct['(breakage)'] += 1;\n        funct['(loopage)'] += 1;\n        advance('(');\n        step_in('control');\n        discard();\n        no_space();\n        edge();\n        this.arity = 'statement';\n        this.first = expected_relation(expression(0));\n        if (this.first.id !== 'true') {\n            expected_condition(this.first, bundle.unexpected_a);\n        }\n        no_space();\n        step_out(')', paren);\n        discard();\n        one_space();\n        this.block = block(true);\n        if (this.block.disrupt) {\n            warn('strange_loop', prev_token);\n        }\n        funct['(breakage)'] -= 1;\n        funct['(loopage)'] -= 1;\n        return this;\n    });\n\n    reserve('with');\n\n    labeled_stmt('switch', function () {\n\n// switch.first             the switch expression\n// switch.second            the array of cases. A case is 'case' or 'default' token:\n//    case.first            the array of case expressions\n//    case.second           the array of statements\n// If all of the arrays of statements are disrupt, then the switch is disrupt.\n\n        var particular,\n            the_case = next_token,\n            unbroken = true;\n        funct['(breakage)'] += 1;\n        one_space();\n        advance('(');\n        discard();\n        no_space();\n        step_in();\n        this.arity = 'statement';\n        this.first = expected_condition(expected_relation(expression(0)));\n        no_space();\n        step_out(')', the_case);\n        discard();\n        one_space();\n        advance('{');\n        step_in();\n        this.second = [];\n        while (next_token.id === 'case') {\n            the_case = next_token;\n            the_case.first = [];\n            spaces();\n            edge('case');\n            advance('case');\n            for (;;) {\n                one_space();\n                particular = expression(0);\n                the_case.first.push(particular);\n                if (particular.id === 'NaN') {\n                    warn('unexpected_a', particular);\n                }\n                no_space_only();\n                advance(':');\n                discard();\n                if (next_token.id !== 'case') {\n                    break;\n                }\n                spaces();\n                edge('case');\n                advance('case');\n                discard();\n            }\n            spaces();\n            the_case.second = statements();\n            if (the_case.second && the_case.second.length > 0) {\n                particular = the_case.second[the_case.second.length - 1];\n                if (particular.disrupt) {\n                    if (particular.id === 'break') {\n                        unbroken = false;\n                    }\n                } else {\n                    warn('missing_a_after_b', next_token, 'break', 'case');\n                }\n            } else {\n                warn('empty_case');\n            }\n            this.second.push(the_case);\n        }\n        if (this.second.length === 0) {\n            warn('missing_a', next_token, 'case');\n        }\n        if (next_token.id === 'default') {\n            spaces();\n            the_case = next_token;\n            edge('case');\n            advance('default');\n            discard();\n            no_space_only();\n            advance(':');\n            discard();\n            spaces();\n            the_case.second = statements();\n            if (the_case.second && the_case.second.length > 0) {\n                particular = the_case.second[the_case.second.length - 1];\n                if (unbroken && particular.disrupt && particular.id !== 'break') {\n                    this.disrupt = true;\n                }\n            }\n            this.second.push(the_case);\n        }\n        funct['(breakage)'] -= 1;\n        spaces();\n        step_out('}', this);\n        return this;\n    });\n\n    stmt('debugger', function () {\n        if (!option.debug) {\n            warn('unexpected_a', this);\n        }\n        this.arity = 'statement';\n        return this;\n    });\n\n    labeled_stmt('do', function () {\n        funct['(breakage)'] += 1;\n        funct['(loopage)'] += 1;\n        one_space();\n        this.arity = 'statement';\n        this.block = block(true);\n        if (this.block.disrupt) {\n            warn('strange_loop', prev_token);\n        }\n        one_space();\n        advance('while');\n        discard();\n        var paren = next_token;\n        one_space();\n        advance('(');\n        step_in();\n        discard();\n        no_space();\n        edge();\n        this.first = expected_condition(expected_relation(expression(0)), bundle.unexpected_a);\n        no_space();\n        step_out(')', paren);\n        discard();\n        funct['(breakage)'] -= 1;\n        funct['(loopage)'] -= 1;\n        return this;\n    });\n\n    labeled_stmt('for', function () {\n        var blok, filter, ok = false, paren = next_token, the_in, value;\n        this.arity = 'statement';\n        funct['(breakage)'] += 1;\n        funct['(loopage)'] += 1;\n        advance('(');\n        step_in('control');\n        discard();\n        spaces(this, paren);\n        no_space();\n        if (next_token.id === 'var') {\n            stop('move_var');\n        }\n        edge();\n        if (peek(0).id === 'in') {\n            value = next_token;\n            switch (funct[value.value]) {\n            case 'unused':\n                funct[value.value] = 'var';\n                break;\n            case 'var':\n                break;\n            default:\n                warn('bad_in_a', value);\n            }\n            advance();\n            the_in = next_token;\n            advance('in');\n            the_in.first = value;\n            the_in.second = expression(20);\n            step_out(')', paren);\n            discard();\n            this.first = the_in;\n            blok = block(true);\n            if (!option.forin) {\n                if (blok.length === 1 && typeof blok[0] === 'object' &&\n                        blok[0].value === 'if' && !blok[0]['else']) {\n                    filter = blok[0].first;\n                    while (filter.id === '&&') {\n                        filter = filter.first;\n                    }\n                    switch (filter.id) {\n                    case '===':\n                    case '!==':\n                        ok = filter.first.id === '[' ? (\n                            filter.first.first.value === the_in.second.value &&\n                            filter.first.second.value === the_in.first.value\n                        ) : (\n                            filter.first.id === 'typeof' &&\n                            filter.first.first.id === '[' &&\n                            filter.first.first.first.value === the_in.second.value &&\n                            filter.first.first.second.value === the_in.first.value\n                        );\n                        break;\n                    case '(':\n                        ok = filter.first.id === '.' && ((\n                            filter.first.first.value === the_in.second.value &&\n                            filter.first.second.value === 'hasOwnProperty' &&\n                            filter.second[0].value === the_in.first.value\n                        ) || (\n                            filter.first.first.value === 'ADSAFE' &&\n                            filter.first.second.value === 'has' &&\n                            filter.second[0].value === the_in.second.value &&\n                            filter.second[1].value === the_in.first.value\n                        ) || (\n                            filter.first.first.id === '.' &&\n                            filter.first.first.first.id === '.' &&\n                            filter.first.first.first.first.value === 'Object' &&\n                            filter.first.first.first.second.value === 'prototype' &&\n                            filter.first.first.second.value === 'hasOwnProperty' &&\n                            filter.first.second.value === 'call' &&\n                            filter.second[0].value === the_in.second.value &&\n                            filter.second[1].value === the_in.first.value\n                        ));\n                        break;\n                    }\n                }\n                if (!ok) {\n                    warn('for_if', this);\n                }\n            }\n        } else {\n            if (next_token.id !== ';') {\n                edge();\n                this.first = [];\n                for (;;) {\n                    this.first.push(expression(0, 'for'));\n                    if (next_token.id !== ',') {\n                        break;\n                    }\n                    comma();\n                }\n            }\n            semicolon();\n            if (next_token.id !== ';') {\n                edge();\n                this.second = expected_relation(expression(0));\n                if (this.second.id !== 'true') {\n                    expected_condition(this.second, bundle.unexpected_a);\n                }\n            }\n            semicolon(token);\n            if (next_token.id === ';') {\n                stop('expected_a_b', next_token, ')', ';');\n            }\n            if (next_token.id !== ')') {\n                this.third = [];\n                edge();\n                for (;;) {\n                    this.third.push(expression(0, 'for'));\n                    if (next_token.id !== ',') {\n                        break;\n                    }\n                    comma();\n                }\n            }\n            no_space();\n            step_out(')', paren);\n            discard();\n            one_space();\n            blok = block(true);\n        }\n        if (blok.disrupt) {\n            warn('strange_loop', prev_token);\n        }\n        this.block = blok;\n        funct['(breakage)'] -= 1;\n        funct['(loopage)'] -= 1;\n        return this;\n    });\n\n    disrupt_stmt('break', function () {\n        var label = next_token.value;\n        this.arity = 'statement';\n        if (funct['(breakage)'] === 0) {\n            warn('unexpected_a', this);\n        }\n        if (next_token.identifier && token.line === next_token.line) {\n            one_space_only();\n            if (funct[label] !== 'label') {\n                warn('not_a_label', next_token);\n            } else if (scope[label] !== funct) {\n                warn('not_a_scope', next_token);\n            }\n            this.first = next_token;\n            advance();\n        }\n        return this;\n    });\n\n    disrupt_stmt('continue', function () {\n        if (!option['continue']) {\n            warn('unexpected_a', this);\n        }\n        var label = next_token.value;\n        this.arity = 'statement';\n        if (funct['(breakage)'] === 0) {\n            warn('unexpected_a', this);\n        }\n        if (next_token.identifier && token.line === next_token.line) {\n            one_space_only();\n            if (funct[label] !== 'label') {\n                warn('not_a_label', next_token);\n            } else if (scope[label] !== funct) {\n                warn('not_a_scope', next_token);\n            }\n            this.first = next_token;\n            advance();\n        }\n        return this;\n    });\n\n    disrupt_stmt('return', function () {\n        this.arity = 'statement';\n        if (next_token.id !== ';' && next_token.line === token.line) {\n            one_space_only();\n            if (next_token.id === '/' || next_token.id === '(regexp)') {\n                warn('wrap_regexp');\n            }\n            this.first = expression(20);\n        }\n        return this;\n    });\n\n    disrupt_stmt('throw', function () {\n        this.arity = 'statement';\n        one_space_only();\n        this.first = expression(20);\n        return this;\n    });\n\n\n//  Superfluous reserved words\n\n    reserve('class');\n    reserve('const');\n    reserve('enum');\n    reserve('export');\n    reserve('extends');\n    reserve('import');\n    reserve('super');\n\n// Harmony reserved words\n\n    reserve('let');\n    reserve('yield');\n    reserve('implements');\n    reserve('interface');\n    reserve('package');\n    reserve('private');\n    reserve('protected');\n    reserve('public');\n    reserve('static');\n\n\n// Parse JSON\n\n    function json_value() {\n\n        function json_object() {\n            var brace = next_token, object = {};\n            advance('{');\n            if (next_token.id !== '}') {\n                while (next_token.id !== '(end)') {\n                    while (next_token.id === ',') {\n                        warn('unexpected_a', next_token);\n                        comma();\n                    }\n                    if (next_token.arity !== 'string') {\n                        warn('expected_string_a');\n                    }\n                    if (object[next_token.value] === true) {\n                        warn('duplicate_a');\n                    } else if (next_token.value === '__proto__') {\n                        warn('dangling_a');\n                    } else {\n                        object[next_token.value] = true;\n                    }\n                    advance();\n                    advance(':');\n                    json_value();\n                    if (next_token.id !== ',') {\n                        break;\n                    }\n                    comma();\n                    if (next_token.id === '}') {\n                        warn('unexpected_a', token);\n                        break;\n                    }\n                }\n            }\n            advance('}', brace);\n        }\n\n        function json_array() {\n            var bracket = next_token;\n            advance('[');\n            if (next_token.id !== ']') {\n                while (next_token.id !== '(end)') {\n                    while (next_token.id === ',') {\n                        warn('unexpected_a', next_token);\n                        comma();\n                    }\n                    json_value();\n                    if (next_token.id !== ',') {\n                        break;\n                    }\n                    comma();\n                    if (next_token.id === ']') {\n                        warn('unexpected_a', token);\n                        break;\n                    }\n                }\n            }\n            advance(']', bracket);\n        }\n\n        switch (next_token.id) {\n        case '{':\n            json_object();\n            break;\n        case '[':\n            json_array();\n            break;\n        case 'true':\n        case 'false':\n        case 'null':\n        case '(number)':\n        case '(string)':\n            advance();\n            break;\n        case '-':\n            advance('-');\n            no_space_only();\n            advance('(number)');\n            break;\n        default:\n            stop('unexpected_a');\n        }\n    }\n\n\n// CSS parsing.\n\n    function css_name() {\n        if (next_token.identifier) {\n            advance();\n            return true;\n        }\n    }\n\n\n    function css_number() {\n        if (next_token.id === '-') {\n            advance('-');\n            no_space_only();\n        }\n        if (next_token.arity === 'number') {\n            advance('(number)');\n            return true;\n        }\n    }\n\n\n    function css_string() {\n        if (next_token.arity === 'string') {\n            advance();\n            return true;\n        }\n    }\n\n    function css_color() {\n        var i, number, paren, value;\n        if (next_token.identifier) {\n            value = next_token.value;\n            if (value === 'rgb' || value === 'rgba') {\n                advance();\n                paren = next_token;\n                advance('(');\n                for (i = 0; i < 3; i += 1) {\n                    if (i) {\n                        comma();\n                    }\n                    number = next_token.value;\n                    if (next_token.arity !== 'number' || number < 0) {\n                        warn('expected_positive_a', next_token);\n                        advance();\n                    } else {\n                        advance();\n                        if (next_token.id === '%') {\n                            advance('%');\n                            if (number > 100) {\n                                warn('expected_percent_a', token, number);\n                            }\n                        } else {\n                            if (number > 255) {\n                                warn('expected_small_a', token, number);\n                            }\n                        }\n                    }\n                }\n                if (value === 'rgba') {\n                    comma();\n                    number = +next_token.value;\n                    if (next_token.arity !== 'number' || number < 0 || number > 1) {\n                        warn('expected_fraction_a', next_token);\n                    }\n                    advance();\n                    if (next_token.id === '%') {\n                        warn('unexpected_a');\n                        advance('%');\n                    }\n                }\n                advance(')', paren);\n                return true;\n            } else if (css_colorData[next_token.value] === true) {\n                advance();\n                return true;\n            }\n        } else if (next_token.id === '(color)') {\n            advance();\n            return true;\n        }\n        return false;\n    }\n\n\n    function css_length() {\n        if (next_token.id === '-') {\n            advance('-');\n            no_space_only();\n        }\n        if (next_token.arity === 'number') {\n            advance();\n            if (next_token.arity !== 'string' &&\n                    css_lengthData[next_token.value] === true) {\n                no_space_only();\n                advance();\n            } else if (+token.value !== 0) {\n                warn('expected_linear_a');\n            }\n            return true;\n        }\n        return false;\n    }\n\n\n    function css_line_height() {\n        if (next_token.id === '-') {\n            advance('-');\n            no_space_only();\n        }\n        if (next_token.arity === 'number') {\n            advance();\n            if (next_token.arity !== 'string' &&\n                    css_lengthData[next_token.value] === true) {\n                no_space_only();\n                advance();\n            }\n            return true;\n        }\n        return false;\n    }\n\n\n    function css_width() {\n        if (next_token.identifier) {\n            switch (next_token.value) {\n            case 'thin':\n            case 'medium':\n            case 'thick':\n                advance();\n                return true;\n            }\n        } else {\n            return css_length();\n        }\n    }\n\n\n    function css_margin() {\n        if (next_token.identifier) {\n            if (next_token.value === 'auto') {\n                advance();\n                return true;\n            }\n        } else {\n            return css_length();\n        }\n    }\n\n    function css_attr() {\n        if (next_token.identifier && next_token.value === 'attr') {\n            advance();\n            advance('(');\n            if (!next_token.identifier) {\n                warn('expected_name_a');\n            }\n            advance();\n            advance(')');\n            return true;\n        }\n        return false;\n    }\n\n\n    function css_comma_list() {\n        while (next_token.id !== ';') {\n            if (!css_name() && !css_string()) {\n                warn('expected_name_a');\n            }\n            if (next_token.id !== ',') {\n                return true;\n            }\n            comma();\n        }\n    }\n\n\n    function css_counter() {\n        if (next_token.identifier && next_token.value === 'counter') {\n            advance();\n            advance('(');\n            advance();\n            if (next_token.id === ',') {\n                comma();\n                if (next_token.arity !== 'string') {\n                    warn('expected_string_a');\n                }\n                advance();\n            }\n            advance(')');\n            return true;\n        }\n        if (next_token.identifier && next_token.value === 'counters') {\n            advance();\n            advance('(');\n            if (!next_token.identifier) {\n                warn('expected_name_a');\n            }\n            advance();\n            if (next_token.id === ',') {\n                comma();\n                if (next_token.arity !== 'string') {\n                    warn('expected_string_a');\n                }\n                advance();\n            }\n            if (next_token.id === ',') {\n                comma();\n                if (next_token.arity !== 'string') {\n                    warn('expected_string_a');\n                }\n                advance();\n            }\n            advance(')');\n            return true;\n        }\n        return false;\n    }\n\n\n    function css_shape() {\n        var i;\n        if (next_token.identifier && next_token.value === 'rect') {\n            advance();\n            advance('(');\n            for (i = 0; i < 4; i += 1) {\n                if (!css_length()) {\n                    warn('expected_number_a');\n                    break;\n                }\n            }\n            advance(')');\n            return true;\n        }\n        return false;\n    }\n\n\n    function css_url() {\n        var c, url;\n        if (next_token.identifier && next_token.value === 'url') {\n            next_token = lex.range('(', ')');\n            url = next_token.value;\n            c = url.charAt(0);\n            if (c === '\"' || c === '\\'') {\n                if (url.slice(-1) !== c) {\n                    warn('bad_url');\n                } else {\n                    url = url.slice(1, -1);\n                    if (url.indexOf(c) >= 0) {\n                        warn('bad_url');\n                    }\n                }\n            }\n            if (!url) {\n                warn('missing_url');\n            }\n            if (option.safe && ux.test(url)) {\n                stop('adsafe_a', next_token, url);\n            }\n            urls.push(url);\n            advance();\n            return true;\n        }\n        return false;\n    }\n\n\n    css_any = [css_url, function () {\n        for (;;) {\n            if (next_token.identifier) {\n                switch (next_token.value.toLowerCase()) {\n                case 'url':\n                    css_url();\n                    break;\n                case 'expression':\n                    warn('unexpected_a');\n                    advance();\n                    break;\n                default:\n                    advance();\n                }\n            } else {\n                if (next_token.id === ';' || next_token.id === '!'  ||\n                        next_token.id === '(end)' || next_token.id === '}') {\n                    return true;\n                }\n                advance();\n            }\n        }\n    }];\n\n\n    css_border_style = [\n        'none', 'dashed', 'dotted', 'double', 'groove',\n        'hidden', 'inset', 'outset', 'ridge', 'solid'\n    ];\n\n    css_break = [\n        'auto', 'always', 'avoid', 'left', 'right'\n    ];\n\n    css_media = {\n        'all': true,\n        'braille': true,\n        'embossed': true,\n        'handheld': true,\n        'print': true,\n        'projection': true,\n        'screen': true,\n        'speech': true,\n        'tty': true,\n        'tv': true\n    };\n\n    css_overflow = [\n        'auto', 'hidden', 'scroll', 'visible'\n    ];\n\n    css_attribute_data = {\n        background: [\n            true, 'background-attachment', 'background-color',\n            'background-image', 'background-position', 'background-repeat'\n        ],\n        'background-attachment': ['scroll', 'fixed'],\n        'background-color': ['transparent', css_color],\n        'background-image': ['none', css_url],\n        'background-position': [\n            2, [css_length, 'top', 'bottom', 'left', 'right', 'center']\n        ],\n        'background-repeat': [\n            'repeat', 'repeat-x', 'repeat-y', 'no-repeat'\n        ],\n        'border': [true, 'border-color', 'border-style', 'border-width'],\n        'border-bottom': [\n            true, 'border-bottom-color', 'border-bottom-style',\n            'border-bottom-width'\n        ],\n        'border-bottom-color': css_color,\n        'border-bottom-style': css_border_style,\n        'border-bottom-width': css_width,\n        'border-collapse': ['collapse', 'separate'],\n        'border-color': ['transparent', 4, css_color],\n        'border-left': [\n            true, 'border-left-color', 'border-left-style', 'border-left-width'\n        ],\n        'border-left-color': css_color,\n        'border-left-style': css_border_style,\n        'border-left-width': css_width,\n        'border-right': [\n            true, 'border-right-color', 'border-right-style',\n            'border-right-width'\n        ],\n        'border-right-color': css_color,\n        'border-right-style': css_border_style,\n        'border-right-width': css_width,\n        'border-spacing': [2, css_length],\n        'border-style': [4, css_border_style],\n        'border-top': [\n            true, 'border-top-color', 'border-top-style', 'border-top-width'\n        ],\n        'border-top-color': css_color,\n        'border-top-style': css_border_style,\n        'border-top-width': css_width,\n        'border-width': [4, css_width],\n        bottom: [css_length, 'auto'],\n        'caption-side' : ['bottom', 'left', 'right', 'top'],\n        clear: ['both', 'left', 'none', 'right'],\n        clip: [css_shape, 'auto'],\n        color: css_color,\n        content: [\n            'open-quote', 'close-quote', 'no-open-quote', 'no-close-quote',\n            css_string, css_url, css_counter, css_attr\n        ],\n        'counter-increment': [\n            css_name, 'none'\n        ],\n        'counter-reset': [\n            css_name, 'none'\n        ],\n        cursor: [\n            css_url, 'auto', 'crosshair', 'default', 'e-resize', 'help', 'move',\n            'n-resize', 'ne-resize', 'nw-resize', 'pointer', 's-resize',\n            'se-resize', 'sw-resize', 'w-resize', 'text', 'wait'\n        ],\n        direction: ['ltr', 'rtl'],\n        display: [\n            'block', 'compact', 'inline', 'inline-block', 'inline-table',\n            'list-item', 'marker', 'none', 'run-in', 'table', 'table-caption',\n            'table-cell', 'table-column', 'table-column-group',\n            'table-footer-group', 'table-header-group', 'table-row',\n            'table-row-group'\n        ],\n        'empty-cells': ['show', 'hide'],\n        'float': ['left', 'none', 'right'],\n        font: [\n            'caption', 'icon', 'menu', 'message-box', 'small-caption',\n            'status-bar', true, 'font-size', 'font-style', 'font-weight',\n            'font-family'\n        ],\n        'font-family': css_comma_list,\n        'font-size': [\n            'xx-small', 'x-small', 'small', 'medium', 'large', 'x-large',\n            'xx-large', 'larger', 'smaller', css_length\n        ],\n        'font-size-adjust': ['none', css_number],\n        'font-stretch': [\n            'normal', 'wider', 'narrower', 'ultra-condensed',\n            'extra-condensed', 'condensed', 'semi-condensed',\n            'semi-expanded', 'expanded', 'extra-expanded'\n        ],\n        'font-style': [\n            'normal', 'italic', 'oblique'\n        ],\n        'font-variant': [\n            'normal', 'small-caps'\n        ],\n        'font-weight': [\n            'normal', 'bold', 'bolder', 'lighter', css_number\n        ],\n        height: [css_length, 'auto'],\n        left: [css_length, 'auto'],\n        'letter-spacing': ['normal', css_length],\n        'line-height': ['normal', css_line_height],\n        'list-style': [\n            true, 'list-style-image', 'list-style-position', 'list-style-type'\n        ],\n        'list-style-image': ['none', css_url],\n        'list-style-position': ['inside', 'outside'],\n        'list-style-type': [\n            'circle', 'disc', 'square', 'decimal', 'decimal-leading-zero',\n            'lower-roman', 'upper-roman', 'lower-greek', 'lower-alpha',\n            'lower-latin', 'upper-alpha', 'upper-latin', 'hebrew', 'katakana',\n            'hiragana-iroha', 'katakana-oroha', 'none'\n        ],\n        margin: [4, css_margin],\n        'margin-bottom': css_margin,\n        'margin-left': css_margin,\n        'margin-right': css_margin,\n        'margin-top': css_margin,\n        'marker-offset': [css_length, 'auto'],\n        'max-height': [css_length, 'none'],\n        'max-width': [css_length, 'none'],\n        'min-height': css_length,\n        'min-width': css_length,\n        opacity: css_number,\n        outline: [true, 'outline-color', 'outline-style', 'outline-width'],\n        'outline-color': ['invert', css_color],\n        'outline-style': [\n            'dashed', 'dotted', 'double', 'groove', 'inset', 'none',\n            'outset', 'ridge', 'solid'\n        ],\n        'outline-width': css_width,\n        overflow: css_overflow,\n        'overflow-x': css_overflow,\n        'overflow-y': css_overflow,\n        padding: [4, css_length],\n        'padding-bottom': css_length,\n        'padding-left': css_length,\n        'padding-right': css_length,\n        'padding-top': css_length,\n        'page-break-after': css_break,\n        'page-break-before': css_break,\n        position: ['absolute', 'fixed', 'relative', 'static'],\n        quotes: [8, css_string],\n        right: [css_length, 'auto'],\n        'table-layout': ['auto', 'fixed'],\n        'text-align': ['center', 'justify', 'left', 'right'],\n        'text-decoration': [\n            'none', 'underline', 'overline', 'line-through', 'blink'\n        ],\n        'text-indent': css_length,\n        'text-shadow': ['none', 4, [css_color, css_length]],\n        'text-transform': ['capitalize', 'uppercase', 'lowercase', 'none'],\n        top: [css_length, 'auto'],\n        'unicode-bidi': ['normal', 'embed', 'bidi-override'],\n        'vertical-align': [\n            'baseline', 'bottom', 'sub', 'super', 'top', 'text-top', 'middle',\n            'text-bottom', css_length\n        ],\n        visibility: ['visible', 'hidden', 'collapse'],\n        'white-space': [\n            'normal', 'nowrap', 'pre', 'pre-line', 'pre-wrap', 'inherit'\n        ],\n        width: [css_length, 'auto'],\n        'word-spacing': ['normal', css_length],\n        'word-wrap': ['break-word', 'normal'],\n        'z-index': ['auto', css_number]\n    };\n\n    function style_attribute() {\n        var v;\n        while (next_token.id === '*' || next_token.id === '#' ||\n                next_token.value === '_') {\n            if (!option.css) {\n                warn('unexpected_a');\n            }\n            advance();\n        }\n        if (next_token.id === '-') {\n            if (!option.css) {\n                warn('unexpected_a');\n            }\n            advance('-');\n            if (!next_token.identifier) {\n                warn('expected_nonstandard_style_attribute');\n            }\n            advance();\n            return css_any;\n        } else {\n            if (!next_token.identifier) {\n                warn('expected_style_attribute');\n            } else {\n                if (Object.prototype.hasOwnProperty.call(css_attribute_data, next_token.value)) {\n                    v = css_attribute_data[next_token.value];\n                } else {\n                    v = css_any;\n                    if (!option.css) {\n                        warn('unrecognized_style_attribute_a');\n                    }\n                }\n            }\n            advance();\n            return v;\n        }\n    }\n\n\n    function style_value(v) {\n        var i = 0,\n            n,\n            once,\n            match,\n            round,\n            start = 0,\n            vi;\n        switch (typeof v) {\n        case 'function':\n            return v();\n        case 'string':\n            if (next_token.identifier && next_token.value === v) {\n                advance();\n                return true;\n            }\n            return false;\n        }\n        for (;;) {\n            if (i >= v.length) {\n                return false;\n            }\n            vi = v[i];\n            i += 1;\n            if (vi === true) {\n                break;\n            } else if (typeof vi === 'number') {\n                n = vi;\n                vi = v[i];\n                i += 1;\n            } else {\n                n = 1;\n            }\n            match = false;\n            while (n > 0) {\n                if (style_value(vi)) {\n                    match = true;\n                    n -= 1;\n                } else {\n                    break;\n                }\n            }\n            if (match) {\n                return true;\n            }\n        }\n        start = i;\n        once = [];\n        for (;;) {\n            round = false;\n            for (i = start; i < v.length; i += 1) {\n                if (!once[i]) {\n                    if (style_value(css_attribute_data[v[i]])) {\n                        match = true;\n                        round = true;\n                        once[i] = true;\n                        break;\n                    }\n                }\n            }\n            if (!round) {\n                return match;\n            }\n        }\n    }\n\n    function style_child() {\n        if (next_token.arity === 'number') {\n            advance();\n            if (next_token.value === 'n' && next_token.identifier) {\n                no_space_only();\n                advance();\n                if (next_token.id === '+') {\n                    no_space_only();\n                    advance('+');\n                    no_space_only();\n                    advance('(number)');\n                }\n            }\n            return;\n        } else {\n            if (next_token.identifier &&\n                    (next_token.value === 'odd' || next_token.value === 'even')) {\n                advance();\n                return;\n            }\n        }\n        warn('unexpected_a');\n    }\n\n    function substyle() {\n        var v;\n        for (;;) {\n            if (next_token.id === '}' || next_token.id === '(end)' ||\n                    (xquote && next_token.id === xquote)) {\n                return;\n            }\n            while (next_token.id === ';') {\n                warn('unexpected_a');\n                semicolon();\n            }\n            v = style_attribute();\n            advance(':');\n            if (next_token.identifier && next_token.value === 'inherit') {\n                advance();\n            } else {\n                if (!style_value(v)) {\n                    warn('unexpected_a');\n                    advance();\n                }\n            }\n            if (next_token.id === '!') {\n                advance('!');\n                no_space_only();\n                if (next_token.identifier && next_token.value === 'important') {\n                    advance();\n                } else {\n                    warn('expected_a_b',\n                        next_token, 'important', next_token.value);\n                }\n            }\n            if (next_token.id === '}' || next_token.id === xquote) {\n                warn('expected_a_b', next_token, ';', next_token.value);\n            } else {\n                semicolon();\n            }\n        }\n    }\n\n    function style_selector() {\n        if (next_token.identifier) {\n            if (!Object.prototype.hasOwnProperty.call(html_tag, option.cap ?\n                    next_token.value.toLowerCase() : next_token.value)) {\n                warn('expected_tagname_a');\n            }\n            advance();\n        } else {\n            switch (next_token.id) {\n            case '>':\n            case '+':\n                advance();\n                style_selector();\n                break;\n            case ':':\n                advance(':');\n                switch (next_token.value) {\n                case 'active':\n                case 'after':\n                case 'before':\n                case 'checked':\n                case 'disabled':\n                case 'empty':\n                case 'enabled':\n                case 'first-child':\n                case 'first-letter':\n                case 'first-line':\n                case 'first-of-type':\n                case 'focus':\n                case 'hover':\n                case 'last-child':\n                case 'last-of-type':\n                case 'link':\n                case 'only-of-type':\n                case 'root':\n                case 'target':\n                case 'visited':\n                    advance();\n                    break;\n                case 'lang':\n                    advance();\n                    advance('(');\n                    if (!next_token.identifier) {\n                        warn('expected_lang_a');\n                    }\n                    advance(')');\n                    break;\n                case 'nth-child':\n                case 'nth-last-child':\n                case 'nth-last-of-type':\n                case 'nth-of-type':\n                    advance();\n                    advance('(');\n                    style_child();\n                    advance(')');\n                    break;\n                case 'not':\n                    advance();\n                    advance('(');\n                    if (next_token.id === ':' && peek(0).value === 'not') {\n                        warn('not');\n                    }\n                    style_selector();\n                    advance(')');\n                    break;\n                default:\n                    warn('expected_pseudo_a');\n                }\n                break;\n            case '#':\n                advance('#');\n                if (!next_token.identifier) {\n                    warn('expected_id_a');\n                }\n                advance();\n                break;\n            case '*':\n                advance('*');\n                break;\n            case '.':\n                advance('.');\n                if (!next_token.identifier) {\n                    warn('expected_class_a');\n                }\n                advance();\n                break;\n            case '[':\n                advance('[');\n                if (!next_token.identifier) {\n                    warn('expected_attribute_a');\n                }\n                advance();\n                if (next_token.id === '=' || next_token.value === '~=' ||\n                        next_token.value === '$=' ||\n                        next_token.value === '|=' ||\n                        next_token.id === '*=' ||\n                        next_token.id === '^=') {\n                    advance();\n                    if (next_token.arity !== 'string') {\n                        warn('expected_string_a');\n                    }\n                    advance();\n                }\n                advance(']');\n                break;\n            default:\n                stop('expected_selector_a');\n            }\n        }\n    }\n\n    function style_pattern() {\n        if (next_token.id === '{') {\n            warn('expected_style_pattern');\n        }\n        for (;;) {\n            style_selector();\n            if (next_token.id === '</' || next_token.id === '{' ||\n                    next_token.id === '(end)') {\n                return '';\n            }\n            if (next_token.id === ',') {\n                comma();\n            }\n        }\n    }\n\n    function style_list() {\n        while (next_token.id !== '</' && next_token.id !== '(end)') {\n            style_pattern();\n            xmode = 'styleproperty';\n            if (next_token.id === ';') {\n                semicolon();\n            } else {\n                advance('{');\n                substyle();\n                xmode = 'style';\n                advance('}');\n            }\n        }\n    }\n\n    function styles() {\n        var i;\n        while (next_token.id === '@') {\n            i = peek();\n            advance('@');\n            if (next_token.identifier) {\n                switch (next_token.value) {\n                case 'import':\n                    advance();\n                    if (!css_url()) {\n                        warn('expected_a_b',\n                            next_token, 'url', next_token.value);\n                        advance();\n                    }\n                    semicolon();\n                    break;\n                case 'media':\n                    advance();\n                    for (;;) {\n                        if (!next_token.identifier || css_media[next_token.value] === true) {\n                            stop('expected_media_a');\n                        }\n                        advance();\n                        if (next_token.id !== ',') {\n                            break;\n                        }\n                        comma();\n                    }\n                    advance('{');\n                    style_list();\n                    advance('}');\n                    break;\n                default:\n                    warn('expected_at_a');\n                }\n            } else {\n                warn('expected_at_a');\n            }\n        }\n        style_list();\n    }\n\n\n// Parse HTML\n\n    function do_begin(n) {\n        if (n !== 'html' && !option.fragment) {\n            if (n === 'div' && option.adsafe) {\n                stop('adsafe_fragment');\n            } else {\n                stop('expected_a_b', token, 'html', n);\n            }\n        }\n        if (option.adsafe) {\n            if (n === 'html') {\n                stop('adsafe_html', token);\n            }\n            if (option.fragment) {\n                if (n !== 'div') {\n                    stop('adsafe_div', token);\n                }\n            } else {\n                stop('adsafe_fragment', token);\n            }\n        }\n        option.browser = true;\n        assume();\n    }\n\n    function do_attribute(n, a, v) {\n        var u, x;\n        if (a === 'id') {\n            u = typeof v === 'string' ? v.toUpperCase() : '';\n            if (ids[u] === true) {\n                warn('duplicate_a', next_token, v);\n            }\n            if (!/^[A-Za-z][A-Za-z0-9._:\\-]*$/.test(v)) {\n                warn('bad_id_a', next_token, v);\n            } else if (option.adsafe) {\n                if (adsafe_id) {\n                    if (v.slice(0, adsafe_id.length) !== adsafe_id) {\n                        warn('adsafe_prefix_a', next_token, adsafe_id);\n                    } else if (!/^[A-Z]+_[A-Z]+$/.test(v)) {\n                        warn('adsafe_bad_id');\n                    }\n                } else {\n                    adsafe_id = v;\n                    if (!/^[A-Z]+_$/.test(v)) {\n                        warn('adsafe_bad_id');\n                    }\n                }\n            }\n            x = v.search(dx);\n            if (x >= 0) {\n                warn('unexpected_char_a_b', token, v.charAt(x), a);\n            }\n            ids[u] = true;\n        } else if (a === 'class' || a === 'type' || a === 'name') {\n            x = v.search(qx);\n            if (x >= 0) {\n                warn('unexpected_char_a_b', token, v.charAt(x), a);\n            }\n            ids[u] = true;\n        } else if (a === 'href' || a === 'background' ||\n                a === 'content' || a === 'data' ||\n                a.indexOf('src') >= 0 || a.indexOf('url') >= 0) {\n            if (option.safe && ux.test(v)) {\n                stop('bad_url', next_token, v);\n            }\n            urls.push(v);\n        } else if (a === 'for') {\n            if (option.adsafe) {\n                if (adsafe_id) {\n                    if (v.slice(0, adsafe_id.length) !== adsafe_id) {\n                        warn('adsafe_prefix_a', next_token, adsafe_id);\n                    } else if (!/^[A-Z]+_[A-Z]+$/.test(v)) {\n                        warn('adsafe_bad_id');\n                    }\n                } else {\n                    warn('adsafe_bad_id');\n                }\n            }\n        } else if (a === 'name') {\n            if (option.adsafe && v.indexOf('_') >= 0) {\n                warn('adsafe_name_a', next_token, v);\n            }\n        }\n    }\n\n    function do_tag(name, attribute) {\n        var i, tag = html_tag[name], script, x;\n        src = false;\n        if (!tag) {\n            stop(\n                bundle.unrecognized_tag_a,\n                next_token,\n                name === name.toLowerCase() ? name : name + ' (capitalization error)'\n            );\n        }\n        if (stack.length > 0) {\n            if (name === 'html') {\n                stop('unexpected_a', token, name);\n            }\n            x = tag.parent;\n            if (x) {\n                if (x.indexOf(' ' + stack[stack.length - 1].name + ' ') < 0) {\n                    stop('tag_a_in_b', token, name, x);\n                }\n            } else if (!option.adsafe && !option.fragment) {\n                i = stack.length;\n                do {\n                    if (i <= 0) {\n                        stop('tag_a_in_b', token, name, 'body');\n                    }\n                    i -= 1;\n                } while (stack[i].name !== 'body');\n            }\n        }\n        switch (name) {\n        case 'div':\n            if (option.adsafe && stack.length === 1 && !adsafe_id) {\n                warn('adsafe_missing_id');\n            }\n            break;\n        case 'script':\n            xmode = 'script';\n            advance('>');\n            if (attribute.lang) {\n                warn('lang', token);\n            }\n            if (option.adsafe && stack.length !== 1) {\n                warn('adsafe_placement', token);\n            }\n            if (attribute.src) {\n                if (option.adsafe && (!adsafe_may || !approved[attribute.src])) {\n                    warn('adsafe_source', token);\n                }\n                if (attribute.type) {\n                    warn('type', token);\n                }\n            } else {\n                step_in(next_token.from);\n                edge();\n                use_strict();\n                adsafe_top = true;\n                script = statements();\n\n// JSLint is also the static analyzer for ADsafe. See www.ADsafe.org.\n\n                if (option.adsafe) {\n                    if (adsafe_went) {\n                        stop('adsafe_script', token);\n                    }\n                    if (script.length !== 1 ||\n                            aint(script[0],             'id',    '(') ||\n                            aint(script[0].first,       'id',    '.') ||\n                            aint(script[0].first.first, 'value', 'ADSAFE') ||\n                            aint(script[0].second[0],   'value', adsafe_id)) {\n                        stop('adsafe_id_go');\n                    }\n                    switch (script[0].first.second.value) {\n                    case 'id':\n                        if (adsafe_may || adsafe_went ||\n                                script[0].second.length !== 1) {\n                            stop('adsafe_id', next_token);\n                        }\n                        adsafe_may = true;\n                        break;\n                    case 'go':\n                        if (adsafe_went) {\n                            stop('adsafe_go');\n                        }\n                        if (script[0].second.length !== 2 ||\n                                aint(script[0].second[1], 'id', 'function') ||\n                                !script[0].second[1].first ||\n                                script[0].second[1].first.length !== 2 ||\n                                aint(script[0].second[1].first[0], 'value', 'dom') ||\n                                aint(script[0].second[1].first[1], 'value', 'lib')) {\n                            stop('adsafe_go', next_token);\n                        }\n                        adsafe_went = true;\n                        break;\n                    default:\n                        stop('adsafe_id_go');\n                    }\n                }\n                indent = null;\n            }\n            xmode = 'html';\n            advance('</');\n            if (!next_token.identifier && next_token.value !== 'script') {\n                warn('expected_a_b', next_token, 'script', next_token.value);\n            }\n            advance();\n            xmode = 'outer';\n            break;\n        case 'style':\n            xmode = 'style';\n            advance('>');\n            styles();\n            xmode = 'html';\n            advance('</');\n            if (!next_token.identifier && next_token.value !== 'style') {\n                warn('expected_a_b', next_token, 'style', next_token.value);\n            }\n            advance();\n            xmode = 'outer';\n            break;\n        case 'input':\n            switch (attribute.type) {\n            case 'radio':\n            case 'checkbox':\n            case 'button':\n            case 'reset':\n            case 'submit':\n                break;\n            case 'text':\n            case 'file':\n            case 'password':\n            case 'file':\n            case 'hidden':\n            case 'image':\n                if (option.adsafe && attribute.autocomplete !== 'off') {\n                    warn('adsafe_autocomplete');\n                }\n                break;\n            default:\n                warn('bad_type');\n            }\n            break;\n        case 'applet':\n        case 'body':\n        case 'embed':\n        case 'frame':\n        case 'frameset':\n        case 'head':\n        case 'iframe':\n        case 'noembed':\n        case 'noframes':\n        case 'object':\n        case 'param':\n            if (option.adsafe) {\n                warn('adsafe_tag', next_token, name);\n            }\n            break;\n        }\n    }\n\n\n    function closetag(name) {\n        return '</' + name + '>';\n    }\n\n    function html() {\n        var attribute, attributes, is_empty, name, old_white = option.white,\n            quote, tag_name, tag, wmode;\n        xmode = 'html';\n        xquote = '';\n        stack = null;\n        for (;;) {\n            switch (next_token.value) {\n            case '<':\n                xmode = 'html';\n                advance('<');\n                attributes = {};\n                tag_name = next_token;\n                if (!tag_name.identifier) {\n                    warn('bad_name_a', tag_name);\n                }\n                name = tag_name.value;\n                if (option.cap) {\n                    name = name.toLowerCase();\n                }\n                tag_name.name = name;\n                advance();\n                if (!stack) {\n                    stack = [];\n                    do_begin(name);\n                }\n                tag = html_tag[name];\n                if (typeof tag !== 'object') {\n                    stop('unrecognized_tag_a', tag_name, name);\n                }\n                is_empty = tag.empty;\n                tag_name.type = name;\n                for (;;) {\n                    if (next_token.id === '/') {\n                        advance('/');\n                        if (next_token.id !== '>') {\n                            warn('expected_a_b', next_token, '>', next_token.value);\n                        }\n                        break;\n                    }\n                    if (next_token.id && next_token.id.substr(0, 1) === '>') {\n                        break;\n                    }\n                    if (!next_token.identifier) {\n                        if (next_token.id === '(end)' || next_token.id === '(error)') {\n                            warn('expected_a_b', next_token, '>', next_token.value);\n                        }\n                        warn('bad_name_a');\n                    }\n                    option.white = true;\n                    spaces();\n                    attribute = next_token.value;\n                    option.white = old_white;\n                    advance();\n                    if (!option.cap && attribute !== attribute.toLowerCase()) {\n                        warn('attribute_case_a', token);\n                    }\n                    attribute = attribute.toLowerCase();\n                    xquote = '';\n                    if (Object.prototype.hasOwnProperty.call(attributes, attribute)) {\n                        warn('duplicate_a', token, attribute);\n                    }\n                    if (attribute.slice(0, 2) === 'on') {\n                        if (!option.on) {\n                            warn('html_handlers');\n                        }\n                        xmode = 'scriptstring';\n                        advance('=');\n                        quote = next_token.id;\n                        if (quote !== '\"' && quote !== '\\'') {\n                            stop('expected_a_b', next_token, '\"', next_token.value);\n                        }\n                        xquote = quote;\n                        wmode = option.white;\n                        option.white = false;\n                        advance(quote);\n                        use_strict();\n                        statements();\n                        option.white = wmode;\n                        if (next_token.id !== quote) {\n                            stop('expected_a_b', next_token, quote, next_token.value);\n                        }\n                        xmode = 'html';\n                        xquote = '';\n                        advance(quote);\n                        tag = false;\n                    } else if (attribute === 'style') {\n                        xmode = 'scriptstring';\n                        advance('=');\n                        quote = next_token.id;\n                        if (quote !== '\"' && quote !== '\\'') {\n                            stop('expected_a_b', next_token, '\"', next_token.value);\n                        }\n                        xmode = 'styleproperty';\n                        xquote = quote;\n                        advance(quote);\n                        substyle();\n                        xmode = 'html';\n                        xquote = '';\n                        advance(quote);\n                        tag = false;\n                    } else {\n                        if (next_token.id === '=') {\n                            advance('=');\n                            tag = next_token.value;\n                            if (!next_token.identifier &&\n                                    next_token.id !== '\"' &&\n                                    next_token.id !== '\\'' &&\n                                    next_token.arity !== 'string' &&\n                                    next_token.arity !== 'number' &&\n                                    next_token.id !== '(color)') {\n                                warn('expected_attribute_value_a', token, attribute);\n                            }\n                            advance();\n                        } else {\n                            tag = true;\n                        }\n                    }\n                    attributes[attribute] = tag;\n                    do_attribute(name, attribute, tag);\n                }\n                do_tag(name, attributes);\n                if (!is_empty) {\n                    stack.push(tag_name);\n                }\n                xmode = 'outer';\n                advance('>');\n                break;\n            case '</':\n                xmode = 'html';\n                advance('</');\n                if (!next_token.identifier) {\n                    warn('bad_name_a');\n                }\n                name = next_token.value;\n                if (option.cap) {\n                    name = name.toLowerCase();\n                }\n                advance();\n                if (!stack) {\n                    stop('unexpected_a', next_token, closetag(name));\n                }\n                tag_name = stack.pop();\n                if (!tag_name) {\n                    stop('unexpected_a', next_token, closetag(name));\n                }\n                if (tag_name.name !== name) {\n                    stop('expected_a_b',\n                        next_token, closetag(tag_name.name), closetag(name));\n                }\n                if (next_token.id !== '>') {\n                    stop('expected_a_b', next_token, '>', next_token.value);\n                }\n                xmode = 'outer';\n                advance('>');\n                break;\n            case '<!':\n                if (option.safe) {\n                    warn('adsafe_a');\n                }\n                xmode = 'html';\n                for (;;) {\n                    advance();\n                    if (next_token.id === '>' || next_token.id === '(end)') {\n                        break;\n                    }\n                    if (next_token.value.indexOf('--') >= 0) {\n                        stop('unexpected_a', next_token, '--');\n                    }\n                    if (next_token.value.indexOf('<') >= 0) {\n                        stop('unexpected_a', next_token, '<');\n                    }\n                    if (next_token.value.indexOf('>') >= 0) {\n                        stop('unexpected_a', next_token, '>');\n                    }\n                }\n                xmode = 'outer';\n                advance('>');\n                break;\n            case '(end)':\n                return;\n            default:\n                if (next_token.id === '(end)') {\n                    stop('missing_a', next_token,\n                        '</' + stack[stack.length - 1].value + '>');\n                } else {\n                    advance();\n                }\n            }\n            if (stack && stack.length === 0 && (option.adsafe ||\n                    !option.fragment || next_token.id === '(end)')) {\n                break;\n            }\n        }\n        if (next_token.id !== '(end)') {\n            stop('unexpected_a');\n        }\n    }\n\n\n// The actual JSLINT function itself.\n\n    var itself = function (the_source, the_option) {\n        var i, keys, predef, tree;\n        JSLINT.comments = [];\n        JSLINT.errors = [];\n        JSLINT.tree = '';\n        begin = older_token = prev_token = token = next_token =\n            Object.create(syntax['(begin)']);\n        predefined = Object.create(standard);\n        if (the_option) {\n            option = Object.create(the_option);\n            predef = option.predef;\n            if (predef) {\n                if (Array.isArray(predef)) {\n                    for (i = 0; i < predef.length; i += 1) {\n                        predefined[predef[i]] = true;\n                    }\n                } else if (typeof predef === 'object') {\n                    keys = Object.keys(predef);\n                    for (i = 0; i < keys.length; i += 1) {\n                        predefined[keys[i]] = !!predef[keys];\n                    }\n                }\n            }\n            if (option.adsafe) {\n                option.safe = true;\n            }\n            if (option.safe) {\n                option.browser     =\n                    option['continue'] =\n                    option.css     =\n                    option.debug   =\n                    option.devel   =\n                    option.evil    =\n                    option.forin   =\n                    option.on      =\n                    option.rhino   =\n                    option.sub     =\n                    option.widget  =\n                    option.windows = false;\n\n                option.nomen       =\n                    option.strict  =\n                    option.undef   = true;\n\n                predefined.Date         =\n                    predefined['eval']  =\n                    predefined.Function =\n                    predefined.Object   = null;\n\n                predefined.ADSAFE  =\n                    predefined.lib = false;\n            }\n        } else {\n            option = {};\n        }\n        option.indent = +option.indent || 0;\n        option.maxerr = option.maxerr || 50;\n        adsafe_id = '';\n        adsafe_may = adsafe_top = adsafe_went = false;\n        approved = {};\n        if (option.approved) {\n            for (i = 0; i < option.approved.length; i += 1) {\n                approved[option.approved[i]] = option.approved[i];\n            }\n        } else {\n            approved.test = 'test';\n        }\n        tab = '';\n        for (i = 0; i < option.indent; i += 1) {\n            tab += ' ';\n        }\n        global = Object.create(predefined);\n        scope = global;\n        funct = {\n            '(global)': true,\n            '(name)': '(global)',\n            '(scope)': scope,\n            '(breakage)': 0,\n            '(loopage)': 0\n        };\n        functions = [funct];\n\n        comments_off = false;\n        ids = {};\n        implied = {};\n        in_block = false;\n        indent = false;\n        json_mode = false;\n        lookahead = [];\n        member = {};\n        properties = null;\n        prereg = true;\n        src = false;\n        stack = null;\n        strict_mode = false;\n        urls = [];\n        var_mode = false;\n        warnings = 0;\n        xmode = false;\n        lex.init(the_source);\n\n        assume();\n\n        try {\n            advance();\n            if (next_token.arity === 'number') {\n                stop('unexpected_a');\n            } else if (next_token.value.charAt(0) === '<') {\n                html();\n                if (option.adsafe && !adsafe_went) {\n                    warn('adsafe_go', this);\n                }\n            } else {\n                switch (next_token.id) {\n                case '{':\n                case '[':\n                    json_mode = true;\n                    json_value();\n                    break;\n                case '@':\n                case '*':\n                case '#':\n                case '.':\n                case ':':\n                    xmode = 'style';\n                    advance();\n                    if (token.id !== '@' || !next_token.identifier ||\n                            next_token.value !== 'charset' || token.line !== 1 ||\n                            token.from !== 1) {\n                        stop('css');\n                    }\n                    advance();\n                    if (next_token.arity !== 'string' &&\n                            next_token.value !== 'UTF-8') {\n                        stop('css');\n                    }\n                    advance();\n                    semicolon();\n                    styles();\n                    break;\n\n                default:\n                    if (option.adsafe && option.fragment) {\n                        stop('expected_a_b',\n                            next_token, '<div>', next_token.value);\n                    }\n\n// If the first token is predef semicolon, ignore it. This is sometimes used when\n// files are intended to be appended to files that may be sloppy. predef sloppy\n// file may be depending on semicolon insertion on its last line.\n\n                    step_in(1);\n                    if (next_token.id === ';') {\n                        semicolon();\n                    }\n                    if (next_token.value === 'use strict') {\n                        warn('function_strict');\n                        use_strict();\n                    }\n                    adsafe_top = true;\n                    tree = statements();\n                    begin.first = tree;\n                    JSLINT.tree = begin;\n                    if (option.adsafe && (tree.length !== 1 ||\n                            aint(tree[0], 'id', '(') ||\n                            aint(tree[0].first, 'id', '.') ||\n                            aint(tree[0].first.first, 'value', 'ADSAFE') ||\n                            aint(tree[0].first.second, 'value', 'lib') ||\n                            tree[0].second.length !== 2 ||\n                            tree[0].second[0].arity !== 'string' ||\n                            aint(tree[0].second[1], 'id', 'function'))) {\n                        stop('adsafe_lib');\n                    }\n                    if (tree.disrupt) {\n                        warn('weird_program', prev_token);\n                    }\n                }\n            }\n            indent = null;\n            advance('(end)');\n        } catch (e) {\n            if (e) {        // `~\n                JSLINT.errors.push({\n                    reason    : e.message,\n                    line      : e.line || next_token.line,\n                    character : e.character || next_token.from\n                }, null);\n            }\n        }\n        return JSLINT.errors.length === 0;\n    };\n\n\n// Data summary.\n\n    itself.data = function () {\n        var data = {functions: []},\n            function_data,\n            globals,\n            i,\n            implieds = [],\n            j,\n            kind,\n            members = [],\n            name,\n            the_function,\n            unused = [];\n        if (itself.errors.length) {\n            data.errors = itself.errors;\n        }\n\n        if (json_mode) {\n            data.json = true;\n        }\n\n        for (name in implied) {\n            if (Object.prototype.hasOwnProperty.call(implied, name)) {\n                implieds.push({\n                    name: name,\n                    line: implied[name]\n                });\n            }\n        }\n        if (implieds.length > 0) {\n            data.implieds = implieds;\n        }\n\n        if (urls.length > 0) {\n            data.urls = urls;\n        }\n\n        globals = Object.keys(functions[0]).filter(function (value) {\n            return value.charAt(0) !== '(' ? value : undefined;\n        });\n        if (globals.length > 0) {\n            data.globals = globals;\n        }\n\n        for (i = 1; i < functions.length; i += 1) {\n            the_function = functions[i];\n            function_data = {};\n            for (j = 0; j < functionicity.length; j += 1) {\n                function_data[functionicity[j]] = [];\n            }\n            for (name in the_function) {\n                if (Object.prototype.hasOwnProperty.call(the_function, name)) {\n                    if (name.charAt(0) !== '(') {\n                        kind = the_function[name];\n                        if (kind === 'unction') {\n                            kind = 'unused';\n                        } else if (typeof kind === 'boolean') {\n                            kind = 'global';\n                        }\n                        if (Array.isArray(function_data[kind])) {\n                            function_data[kind].push(name);\n                            if (kind === 'unused') {\n                                unused.push({\n                                    name: name,\n                                    line: the_function['(line)'],\n                                    'function': the_function['(name)']\n                                });\n                            }\n                        }\n                    }\n                }\n            }\n            for (j = 0; j < functionicity.length; j += 1) {\n                if (function_data[functionicity[j]].length === 0) {\n                    delete function_data[functionicity[j]];\n                }\n            }\n            function_data.name = the_function['(name)'];\n            function_data.param = the_function['(params)'];\n            function_data.line = the_function['(line)'];\n            data.functions.push(function_data);\n        }\n\n        if (unused.length > 0) {\n            data.unused = unused;\n        }\n\n        members = [];\n        for (name in member) {\n            if (typeof member[name] === 'number') {\n                data.member = member;\n                break;\n            }\n        }\n\n        return data;\n    };\n\n\n    itself.report = function (errors_only) {\n        var data = itself.data();\n\n        var err, evidence, i, j, key, keys, length, mem = '', name, names,\n            output = [], snippets, the_function, warning;\n\n        function detail(h, array) {\n            var comma_needed, i, singularity;\n            if (array) {\n                output.push('<div><i>' + h + '</i> ');\n                array = array.sort();\n                for (i = 0; i < array.length; i += 1) {\n                    if (array[i] !== singularity) {\n                        singularity = array[i];\n                        output.push((comma_needed ? ', ' : '') + singularity);\n                        comma_needed = true;\n                    }\n                }\n                output.push('</div>');\n            }\n        }\n\n        if (data.errors || data.implieds || data.unused) {\n            err = true;\n            output.push('<div id=errors><i>Error:</i>');\n            if (data.errors) {\n                for (i = 0; i < data.errors.length; i += 1) {\n                    warning = data.errors[i];\n                    if (warning) {\n                        evidence = warning.evidence || '';\n                        output.push('<p>Problem' + (isFinite(warning.line) ? ' at line ' +\n                            warning.line + ' character ' + warning.character : '') +\n                            ': ' + warning.reason.entityify() +\n                            '</p><p class=evidence>' +\n                            (evidence && (evidence.length > 80 ? evidence.slice(0, 77) + '...' :\n                            evidence).entityify()) + '</p>');\n                    }\n                }\n            }\n\n            if (data.implieds) {\n                snippets = [];\n                for (i = 0; i < data.implieds.length; i += 1) {\n                    snippets[i] = '<code>' + data.implieds[i].name + '</code>&nbsp;<i>' +\n                        data.implieds[i].line + '</i>';\n                }\n                output.push('<p><i>Implied global:</i> ' + snippets.join(', ') + '</p>');\n            }\n\n            if (data.unused) {\n                snippets = [];\n                for (i = 0; i < data.unused.length; i += 1) {\n                    snippets[i] = '<code><u>' + data.unused[i].name + '</u></code>&nbsp;<i>' +\n                        data.unused[i].line + ' </i> <small>' +\n                        data.unused[i]['function'] + '</small>';\n                }\n                output.push('<p><i>Unused variable:</i> ' + snippets.join(', ') + '</p>');\n            }\n            if (data.json) {\n                output.push('<p>JSON: bad.</p>');\n            }\n            output.push('</div>');\n        }\n\n        if (!errors_only) {\n\n            output.push('<br><div id=functions>');\n\n            if (data.urls) {\n                detail(\"URLs<br>\", data.urls, '<br>');\n            }\n\n            if (xmode === 'style') {\n                output.push('<p>CSS.</p>');\n            } else if (data.json && !err) {\n                output.push('<p>JSON: good.</p>');\n            } else if (data.globals) {\n                output.push('<div><i>Global</i> ' +\n                    data.globals.sort().join(', ') + '</div>');\n            } else {\n                output.push('<div><i>No new global variables introduced.</i></div>');\n            }\n\n            for (i = 0; i < data.functions.length; i += 1) {\n                the_function = data.functions[i];\n                names = [];\n                if (the_function.param) {\n                    for (j = 0; j < the_function.param.length; j += 1) {\n                        names[j] = the_function.param[j].value;\n                    }\n                }\n                output.push('<br><div class=function><i>' + the_function.line + '</i> ' +\n                    (the_function.name || '') + '(' + names.join(', ') + ')</div>');\n                detail('<big><b>Unused</b></big>', the_function.unused);\n                detail('Closure', the_function.closure);\n                detail('Variable', the_function['var']);\n                detail('Exception', the_function.exception);\n                detail('Outer', the_function.outer);\n                detail('Global', the_function.global);\n                detail('Label', the_function.label);\n            }\n\n            if (data.member) {\n                keys = Object.keys(data.member);\n                if (keys.length) {\n                    keys = keys.sort();\n                    mem = '<br><pre id=properties>/*properties ';\n                    length = 13;\n                    for (i = 0; i < keys.length; i += 1) {\n                        key = keys[i];\n                        name = ix.test(key) ? key :\n                            '\"' + key.entityify().replace(nx, sanitize) + '\"';\n                        if (length + name.length > 72) {\n                            output.push(mem + '<br>');\n                            mem = '    ';\n                            length = 1;\n                        }\n                        length += name.length + 2;\n                        if (data.member[key] === 1) {\n                            name = '<i>' + name + '</i>';\n                        }\n                        if (i < keys.length - 1) {\n                            name += ', ';\n                        }\n                        mem += name;\n                    }\n                    output.push(mem + '<br>*/</pre>');\n                }\n                output.push('</div>');\n            }\n        }\n        return output.join('');\n    };\n    itself.jslint = itself;\n\n    itself.edition = '2011-04-21';\n\n    return itself;\n\n}());\n\nvar input = snarf(\"jslint.js\");\nprint(input);\n\nvar bef = new Date();\nJSLINT(input, {\n    rhino: true,\n    passfail: false, \n    white: true,\n    onevar: true,\n    undef: true,\n    nomen: true,\n    regexp: true,\n    plusplus: true,\n    bitwise: true,\n    newcap: true,\n    maxerr: 50,\n    indent: 4\n});\nvar aft = new Date();\nprint(aft - bef);\n";

JSLINT(input, {
    rhino: true,
    passfail: false, 
    white: true,
    onevar: true,
    undef: true,
    nomen: true,
    regexp: true,
    plusplus: true,
    bitwise: true,
    newcap: true,
    maxerr: 50,
    indent: 4
});
