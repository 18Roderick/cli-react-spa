import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// node_modules/commander/lib/error.js
var require_error = __commonJS((exports) => {
  class CommanderError extends Error {
    constructor(exitCode, code, message) {
      super(message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
      this.code = code;
      this.exitCode = exitCode;
      this.nestedError = undefined;
    }
  }

  class InvalidArgumentError extends CommanderError {
    constructor(message) {
      super(1, "commander.invalidArgument", message);
      Error.captureStackTrace(this, this.constructor);
      this.name = this.constructor.name;
    }
  }
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
});

// node_modules/commander/lib/argument.js
var require_argument = __commonJS((exports) => {
  var { InvalidArgumentError } = require_error();

  class Argument {
    constructor(name, description) {
      this.description = description || "";
      this.variadic = false;
      this.parseArg = undefined;
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.argChoices = undefined;
      switch (name[0]) {
        case "<":
          this.required = true;
          this._name = name.slice(1, -1);
          break;
        case "[":
          this.required = false;
          this._name = name.slice(1, -1);
          break;
        default:
          this.required = true;
          this._name = name;
          break;
      }
      if (this._name.length > 3 && this._name.slice(-3) === "...") {
        this.variadic = true;
        this._name = this._name.slice(0, -3);
      }
    }
    name() {
      return this._name;
    }
    _concatValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      return previous.concat(value);
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
        }
        if (this.variadic) {
          return this._concatValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    argRequired() {
      this.required = true;
      return this;
    }
    argOptional() {
      this.required = false;
      return this;
    }
  }
  function humanReadableArgName(arg) {
    const nameOutput = arg.name() + (arg.variadic === true ? "..." : "");
    return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
  }
  exports.Argument = Argument;
  exports.humanReadableArgName = humanReadableArgName;
});

// node_modules/commander/lib/help.js
var require_help = __commonJS((exports) => {
  var { humanReadableArgName } = require_argument();

  class Help {
    constructor() {
      this.helpWidth = undefined;
      this.minWidthToWrap = 40;
      this.sortSubcommands = false;
      this.sortOptions = false;
      this.showGlobalOptions = false;
    }
    prepareContext(contextOptions) {
      this.helpWidth = this.helpWidth ?? contextOptions.helpWidth ?? 80;
    }
    visibleCommands(cmd) {
      const visibleCommands = cmd.commands.filter((cmd2) => !cmd2._hidden);
      const helpCommand = cmd._getHelpCommand();
      if (helpCommand && !helpCommand._hidden) {
        visibleCommands.push(helpCommand);
      }
      if (this.sortSubcommands) {
        visibleCommands.sort((a, b) => {
          return a.name().localeCompare(b.name());
        });
      }
      return visibleCommands;
    }
    compareOptions(a, b) {
      const getSortKey = (option) => {
        return option.short ? option.short.replace(/^-/, "") : option.long.replace(/^--/, "");
      };
      return getSortKey(a).localeCompare(getSortKey(b));
    }
    visibleOptions(cmd) {
      const visibleOptions = cmd.options.filter((option) => !option.hidden);
      const helpOption = cmd._getHelpOption();
      if (helpOption && !helpOption.hidden) {
        const removeShort = helpOption.short && cmd._findOption(helpOption.short);
        const removeLong = helpOption.long && cmd._findOption(helpOption.long);
        if (!removeShort && !removeLong) {
          visibleOptions.push(helpOption);
        } else if (helpOption.long && !removeLong) {
          visibleOptions.push(cmd.createOption(helpOption.long, helpOption.description));
        } else if (helpOption.short && !removeShort) {
          visibleOptions.push(cmd.createOption(helpOption.short, helpOption.description));
        }
      }
      if (this.sortOptions) {
        visibleOptions.sort(this.compareOptions);
      }
      return visibleOptions;
    }
    visibleGlobalOptions(cmd) {
      if (!this.showGlobalOptions)
        return [];
      const globalOptions = [];
      for (let ancestorCmd = cmd.parent;ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        const visibleOptions = ancestorCmd.options.filter((option) => !option.hidden);
        globalOptions.push(...visibleOptions);
      }
      if (this.sortOptions) {
        globalOptions.sort(this.compareOptions);
      }
      return globalOptions;
    }
    visibleArguments(cmd) {
      if (cmd._argsDescription) {
        cmd.registeredArguments.forEach((argument) => {
          argument.description = argument.description || cmd._argsDescription[argument.name()] || "";
        });
      }
      if (cmd.registeredArguments.find((argument) => argument.description)) {
        return cmd.registeredArguments;
      }
      return [];
    }
    subcommandTerm(cmd) {
      const args = cmd.registeredArguments.map((arg) => humanReadableArgName(arg)).join(" ");
      return cmd._name + (cmd._aliases[0] ? "|" + cmd._aliases[0] : "") + (cmd.options.length ? " [options]" : "") + (args ? " " + args : "");
    }
    optionTerm(option) {
      return option.flags;
    }
    argumentTerm(argument) {
      return argument.name();
    }
    longestSubcommandTermLength(cmd, helper) {
      return helper.visibleCommands(cmd).reduce((max, command) => {
        return Math.max(max, this.displayWidth(helper.styleSubcommandTerm(helper.subcommandTerm(command))));
      }, 0);
    }
    longestOptionTermLength(cmd, helper) {
      return helper.visibleOptions(cmd).reduce((max, option) => {
        return Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))));
      }, 0);
    }
    longestGlobalOptionTermLength(cmd, helper) {
      return helper.visibleGlobalOptions(cmd).reduce((max, option) => {
        return Math.max(max, this.displayWidth(helper.styleOptionTerm(helper.optionTerm(option))));
      }, 0);
    }
    longestArgumentTermLength(cmd, helper) {
      return helper.visibleArguments(cmd).reduce((max, argument) => {
        return Math.max(max, this.displayWidth(helper.styleArgumentTerm(helper.argumentTerm(argument))));
      }, 0);
    }
    commandUsage(cmd) {
      let cmdName = cmd._name;
      if (cmd._aliases[0]) {
        cmdName = cmdName + "|" + cmd._aliases[0];
      }
      let ancestorCmdNames = "";
      for (let ancestorCmd = cmd.parent;ancestorCmd; ancestorCmd = ancestorCmd.parent) {
        ancestorCmdNames = ancestorCmd.name() + " " + ancestorCmdNames;
      }
      return ancestorCmdNames + cmdName + " " + cmd.usage();
    }
    commandDescription(cmd) {
      return cmd.description();
    }
    subcommandDescription(cmd) {
      return cmd.summary() || cmd.description();
    }
    optionDescription(option) {
      const extraInfo = [];
      if (option.argChoices) {
        extraInfo.push(`choices: ${option.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
      }
      if (option.defaultValue !== undefined) {
        const showDefault = option.required || option.optional || option.isBoolean() && typeof option.defaultValue === "boolean";
        if (showDefault) {
          extraInfo.push(`default: ${option.defaultValueDescription || JSON.stringify(option.defaultValue)}`);
        }
      }
      if (option.presetArg !== undefined && option.optional) {
        extraInfo.push(`preset: ${JSON.stringify(option.presetArg)}`);
      }
      if (option.envVar !== undefined) {
        extraInfo.push(`env: ${option.envVar}`);
      }
      if (extraInfo.length > 0) {
        return `${option.description} (${extraInfo.join(", ")})`;
      }
      return option.description;
    }
    argumentDescription(argument) {
      const extraInfo = [];
      if (argument.argChoices) {
        extraInfo.push(`choices: ${argument.argChoices.map((choice) => JSON.stringify(choice)).join(", ")}`);
      }
      if (argument.defaultValue !== undefined) {
        extraInfo.push(`default: ${argument.defaultValueDescription || JSON.stringify(argument.defaultValue)}`);
      }
      if (extraInfo.length > 0) {
        const extraDescription = `(${extraInfo.join(", ")})`;
        if (argument.description) {
          return `${argument.description} ${extraDescription}`;
        }
        return extraDescription;
      }
      return argument.description;
    }
    formatHelp(cmd, helper) {
      const termWidth = helper.padWidth(cmd, helper);
      const helpWidth = helper.helpWidth ?? 80;
      function callFormatItem(term, description) {
        return helper.formatItem(term, termWidth, description, helper);
      }
      let output = [
        `${helper.styleTitle("Usage:")} ${helper.styleUsage(helper.commandUsage(cmd))}`,
        ""
      ];
      const commandDescription = helper.commandDescription(cmd);
      if (commandDescription.length > 0) {
        output = output.concat([
          helper.boxWrap(helper.styleCommandDescription(commandDescription), helpWidth),
          ""
        ]);
      }
      const argumentList = helper.visibleArguments(cmd).map((argument) => {
        return callFormatItem(helper.styleArgumentTerm(helper.argumentTerm(argument)), helper.styleArgumentDescription(helper.argumentDescription(argument)));
      });
      if (argumentList.length > 0) {
        output = output.concat([
          helper.styleTitle("Arguments:"),
          ...argumentList,
          ""
        ]);
      }
      const optionList = helper.visibleOptions(cmd).map((option) => {
        return callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option)));
      });
      if (optionList.length > 0) {
        output = output.concat([
          helper.styleTitle("Options:"),
          ...optionList,
          ""
        ]);
      }
      if (helper.showGlobalOptions) {
        const globalOptionList = helper.visibleGlobalOptions(cmd).map((option) => {
          return callFormatItem(helper.styleOptionTerm(helper.optionTerm(option)), helper.styleOptionDescription(helper.optionDescription(option)));
        });
        if (globalOptionList.length > 0) {
          output = output.concat([
            helper.styleTitle("Global Options:"),
            ...globalOptionList,
            ""
          ]);
        }
      }
      const commandList = helper.visibleCommands(cmd).map((cmd2) => {
        return callFormatItem(helper.styleSubcommandTerm(helper.subcommandTerm(cmd2)), helper.styleSubcommandDescription(helper.subcommandDescription(cmd2)));
      });
      if (commandList.length > 0) {
        output = output.concat([
          helper.styleTitle("Commands:"),
          ...commandList,
          ""
        ]);
      }
      return output.join(`
`);
    }
    displayWidth(str) {
      return stripColor(str).length;
    }
    styleTitle(str) {
      return str;
    }
    styleUsage(str) {
      return str.split(" ").map((word) => {
        if (word === "[options]")
          return this.styleOptionText(word);
        if (word === "[command]")
          return this.styleSubcommandText(word);
        if (word[0] === "[" || word[0] === "<")
          return this.styleArgumentText(word);
        return this.styleCommandText(word);
      }).join(" ");
    }
    styleCommandDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleOptionDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleSubcommandDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleArgumentDescription(str) {
      return this.styleDescriptionText(str);
    }
    styleDescriptionText(str) {
      return str;
    }
    styleOptionTerm(str) {
      return this.styleOptionText(str);
    }
    styleSubcommandTerm(str) {
      return str.split(" ").map((word) => {
        if (word === "[options]")
          return this.styleOptionText(word);
        if (word[0] === "[" || word[0] === "<")
          return this.styleArgumentText(word);
        return this.styleSubcommandText(word);
      }).join(" ");
    }
    styleArgumentTerm(str) {
      return this.styleArgumentText(str);
    }
    styleOptionText(str) {
      return str;
    }
    styleArgumentText(str) {
      return str;
    }
    styleSubcommandText(str) {
      return str;
    }
    styleCommandText(str) {
      return str;
    }
    padWidth(cmd, helper) {
      return Math.max(helper.longestOptionTermLength(cmd, helper), helper.longestGlobalOptionTermLength(cmd, helper), helper.longestSubcommandTermLength(cmd, helper), helper.longestArgumentTermLength(cmd, helper));
    }
    preformatted(str) {
      return /\n[^\S\r\n]/.test(str);
    }
    formatItem(term, termWidth, description, helper) {
      const itemIndent = 2;
      const itemIndentStr = " ".repeat(itemIndent);
      if (!description)
        return itemIndentStr + term;
      const paddedTerm = term.padEnd(termWidth + term.length - helper.displayWidth(term));
      const spacerWidth = 2;
      const helpWidth = this.helpWidth ?? 80;
      const remainingWidth = helpWidth - termWidth - spacerWidth - itemIndent;
      let formattedDescription;
      if (remainingWidth < this.minWidthToWrap || helper.preformatted(description)) {
        formattedDescription = description;
      } else {
        const wrappedDescription = helper.boxWrap(description, remainingWidth);
        formattedDescription = wrappedDescription.replace(/\n/g, `
` + " ".repeat(termWidth + spacerWidth));
      }
      return itemIndentStr + paddedTerm + " ".repeat(spacerWidth) + formattedDescription.replace(/\n/g, `
${itemIndentStr}`);
    }
    boxWrap(str, width) {
      if (width < this.minWidthToWrap)
        return str;
      const rawLines = str.split(/\r\n|\n/);
      const chunkPattern = /[\s]*[^\s]+/g;
      const wrappedLines = [];
      rawLines.forEach((line) => {
        const chunks = line.match(chunkPattern);
        if (chunks === null) {
          wrappedLines.push("");
          return;
        }
        let sumChunks = [chunks.shift()];
        let sumWidth = this.displayWidth(sumChunks[0]);
        chunks.forEach((chunk) => {
          const visibleWidth = this.displayWidth(chunk);
          if (sumWidth + visibleWidth <= width) {
            sumChunks.push(chunk);
            sumWidth += visibleWidth;
            return;
          }
          wrappedLines.push(sumChunks.join(""));
          const nextChunk = chunk.trimStart();
          sumChunks = [nextChunk];
          sumWidth = this.displayWidth(nextChunk);
        });
        wrappedLines.push(sumChunks.join(""));
      });
      return wrappedLines.join(`
`);
    }
  }
  function stripColor(str) {
    const sgrPattern = /\x1b\[\d*(;\d*)*m/g;
    return str.replace(sgrPattern, "");
  }
  exports.Help = Help;
  exports.stripColor = stripColor;
});

// node_modules/commander/lib/option.js
var require_option = __commonJS((exports) => {
  var { InvalidArgumentError } = require_error();

  class Option {
    constructor(flags, description) {
      this.flags = flags;
      this.description = description || "";
      this.required = flags.includes("<");
      this.optional = flags.includes("[");
      this.variadic = /\w\.\.\.[>\]]$/.test(flags);
      this.mandatory = false;
      const optionFlags = splitOptionFlags(flags);
      this.short = optionFlags.shortFlag;
      this.long = optionFlags.longFlag;
      this.negate = false;
      if (this.long) {
        this.negate = this.long.startsWith("--no-");
      }
      this.defaultValue = undefined;
      this.defaultValueDescription = undefined;
      this.presetArg = undefined;
      this.envVar = undefined;
      this.parseArg = undefined;
      this.hidden = false;
      this.argChoices = undefined;
      this.conflictsWith = [];
      this.implied = undefined;
    }
    default(value, description) {
      this.defaultValue = value;
      this.defaultValueDescription = description;
      return this;
    }
    preset(arg) {
      this.presetArg = arg;
      return this;
    }
    conflicts(names) {
      this.conflictsWith = this.conflictsWith.concat(names);
      return this;
    }
    implies(impliedOptionValues) {
      let newImplied = impliedOptionValues;
      if (typeof impliedOptionValues === "string") {
        newImplied = { [impliedOptionValues]: true };
      }
      this.implied = Object.assign(this.implied || {}, newImplied);
      return this;
    }
    env(name) {
      this.envVar = name;
      return this;
    }
    argParser(fn) {
      this.parseArg = fn;
      return this;
    }
    makeOptionMandatory(mandatory = true) {
      this.mandatory = !!mandatory;
      return this;
    }
    hideHelp(hide = true) {
      this.hidden = !!hide;
      return this;
    }
    _concatValue(value, previous) {
      if (previous === this.defaultValue || !Array.isArray(previous)) {
        return [value];
      }
      return previous.concat(value);
    }
    choices(values) {
      this.argChoices = values.slice();
      this.parseArg = (arg, previous) => {
        if (!this.argChoices.includes(arg)) {
          throw new InvalidArgumentError(`Allowed choices are ${this.argChoices.join(", ")}.`);
        }
        if (this.variadic) {
          return this._concatValue(arg, previous);
        }
        return arg;
      };
      return this;
    }
    name() {
      if (this.long) {
        return this.long.replace(/^--/, "");
      }
      return this.short.replace(/^-/, "");
    }
    attributeName() {
      if (this.negate) {
        return camelcase(this.name().replace(/^no-/, ""));
      }
      return camelcase(this.name());
    }
    is(arg) {
      return this.short === arg || this.long === arg;
    }
    isBoolean() {
      return !this.required && !this.optional && !this.negate;
    }
  }

  class DualOptions {
    constructor(options) {
      this.positiveOptions = new Map;
      this.negativeOptions = new Map;
      this.dualOptions = new Set;
      options.forEach((option) => {
        if (option.negate) {
          this.negativeOptions.set(option.attributeName(), option);
        } else {
          this.positiveOptions.set(option.attributeName(), option);
        }
      });
      this.negativeOptions.forEach((value, key) => {
        if (this.positiveOptions.has(key)) {
          this.dualOptions.add(key);
        }
      });
    }
    valueFromOption(value, option) {
      const optionKey = option.attributeName();
      if (!this.dualOptions.has(optionKey))
        return true;
      const preset = this.negativeOptions.get(optionKey).presetArg;
      const negativeValue = preset !== undefined ? preset : false;
      return option.negate === (negativeValue === value);
    }
  }
  function camelcase(str) {
    return str.split("-").reduce((str2, word) => {
      return str2 + word[0].toUpperCase() + word.slice(1);
    });
  }
  function splitOptionFlags(flags) {
    let shortFlag;
    let longFlag;
    const shortFlagExp = /^-[^-]$/;
    const longFlagExp = /^--[^-]/;
    const flagParts = flags.split(/[ |,]+/).concat("guard");
    if (shortFlagExp.test(flagParts[0]))
      shortFlag = flagParts.shift();
    if (longFlagExp.test(flagParts[0]))
      longFlag = flagParts.shift();
    if (!shortFlag && shortFlagExp.test(flagParts[0]))
      shortFlag = flagParts.shift();
    if (!shortFlag && longFlagExp.test(flagParts[0])) {
      shortFlag = longFlag;
      longFlag = flagParts.shift();
    }
    if (flagParts[0].startsWith("-")) {
      const unsupportedFlag = flagParts[0];
      const baseError = `option creation failed due to '${unsupportedFlag}' in option flags '${flags}'`;
      if (/^-[^-][^-]/.test(unsupportedFlag))
        throw new Error(`${baseError}
- a short flag is a single dash and a single character
  - either use a single dash and a single character (for a short flag)
  - or use a double dash for a long option (and can have two, like '--ws, --workspace')`);
      if (shortFlagExp.test(unsupportedFlag))
        throw new Error(`${baseError}
- too many short flags`);
      if (longFlagExp.test(unsupportedFlag))
        throw new Error(`${baseError}
- too many long flags`);
      throw new Error(`${baseError}
- unrecognised flag format`);
    }
    if (shortFlag === undefined && longFlag === undefined)
      throw new Error(`option creation failed due to no flags found in '${flags}'.`);
    return { shortFlag, longFlag };
  }
  exports.Option = Option;
  exports.DualOptions = DualOptions;
});

// node_modules/commander/lib/suggestSimilar.js
var require_suggestSimilar = __commonJS((exports) => {
  var maxDistance = 3;
  function editDistance(a, b) {
    if (Math.abs(a.length - b.length) > maxDistance)
      return Math.max(a.length, b.length);
    const d = [];
    for (let i = 0;i <= a.length; i++) {
      d[i] = [i];
    }
    for (let j = 0;j <= b.length; j++) {
      d[0][j] = j;
    }
    for (let j = 1;j <= b.length; j++) {
      for (let i = 1;i <= a.length; i++) {
        let cost = 1;
        if (a[i - 1] === b[j - 1]) {
          cost = 0;
        } else {
          cost = 1;
        }
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[a.length][b.length];
  }
  function suggestSimilar(word, candidates) {
    if (!candidates || candidates.length === 0)
      return "";
    candidates = Array.from(new Set(candidates));
    const searchingOptions = word.startsWith("--");
    if (searchingOptions) {
      word = word.slice(2);
      candidates = candidates.map((candidate) => candidate.slice(2));
    }
    let similar = [];
    let bestDistance = maxDistance;
    const minSimilarity = 0.4;
    candidates.forEach((candidate) => {
      if (candidate.length <= 1)
        return;
      const distance = editDistance(word, candidate);
      const length = Math.max(word.length, candidate.length);
      const similarity = (length - distance) / length;
      if (similarity > minSimilarity) {
        if (distance < bestDistance) {
          bestDistance = distance;
          similar = [candidate];
        } else if (distance === bestDistance) {
          similar.push(candidate);
        }
      }
    });
    similar.sort((a, b) => a.localeCompare(b));
    if (searchingOptions) {
      similar = similar.map((candidate) => `--${candidate}`);
    }
    if (similar.length > 1) {
      return `
(Did you mean one of ${similar.join(", ")}?)`;
    }
    if (similar.length === 1) {
      return `
(Did you mean ${similar[0]}?)`;
    }
    return "";
  }
  exports.suggestSimilar = suggestSimilar;
});

// node_modules/commander/lib/command.js
var require_command = __commonJS((exports) => {
  var EventEmitter = __require("node:events").EventEmitter;
  var childProcess = __require("node:child_process");
  var path = __require("node:path");
  var fs = __require("node:fs");
  var process2 = __require("node:process");
  var { Argument, humanReadableArgName } = require_argument();
  var { CommanderError } = require_error();
  var { Help, stripColor } = require_help();
  var { Option, DualOptions } = require_option();
  var { suggestSimilar } = require_suggestSimilar();

  class Command extends EventEmitter {
    constructor(name) {
      super();
      this.commands = [];
      this.options = [];
      this.parent = null;
      this._allowUnknownOption = false;
      this._allowExcessArguments = false;
      this.registeredArguments = [];
      this._args = this.registeredArguments;
      this.args = [];
      this.rawArgs = [];
      this.processedArgs = [];
      this._scriptPath = null;
      this._name = name || "";
      this._optionValues = {};
      this._optionValueSources = {};
      this._storeOptionsAsProperties = false;
      this._actionHandler = null;
      this._executableHandler = false;
      this._executableFile = null;
      this._executableDir = null;
      this._defaultCommandName = null;
      this._exitCallback = null;
      this._aliases = [];
      this._combineFlagAndOptionalValue = true;
      this._description = "";
      this._summary = "";
      this._argsDescription = undefined;
      this._enablePositionalOptions = false;
      this._passThroughOptions = false;
      this._lifeCycleHooks = {};
      this._showHelpAfterError = false;
      this._showSuggestionAfterError = true;
      this._savedState = null;
      this._outputConfiguration = {
        writeOut: (str) => process2.stdout.write(str),
        writeErr: (str) => process2.stderr.write(str),
        outputError: (str, write) => write(str),
        getOutHelpWidth: () => process2.stdout.isTTY ? process2.stdout.columns : undefined,
        getErrHelpWidth: () => process2.stderr.isTTY ? process2.stderr.columns : undefined,
        getOutHasColors: () => useColor() ?? (process2.stdout.isTTY && process2.stdout.hasColors?.()),
        getErrHasColors: () => useColor() ?? (process2.stderr.isTTY && process2.stderr.hasColors?.()),
        stripColor: (str) => stripColor(str)
      };
      this._hidden = false;
      this._helpOption = undefined;
      this._addImplicitHelpCommand = undefined;
      this._helpCommand = undefined;
      this._helpConfiguration = {};
    }
    copyInheritedSettings(sourceCommand) {
      this._outputConfiguration = sourceCommand._outputConfiguration;
      this._helpOption = sourceCommand._helpOption;
      this._helpCommand = sourceCommand._helpCommand;
      this._helpConfiguration = sourceCommand._helpConfiguration;
      this._exitCallback = sourceCommand._exitCallback;
      this._storeOptionsAsProperties = sourceCommand._storeOptionsAsProperties;
      this._combineFlagAndOptionalValue = sourceCommand._combineFlagAndOptionalValue;
      this._allowExcessArguments = sourceCommand._allowExcessArguments;
      this._enablePositionalOptions = sourceCommand._enablePositionalOptions;
      this._showHelpAfterError = sourceCommand._showHelpAfterError;
      this._showSuggestionAfterError = sourceCommand._showSuggestionAfterError;
      return this;
    }
    _getCommandAndAncestors() {
      const result = [];
      for (let command = this;command; command = command.parent) {
        result.push(command);
      }
      return result;
    }
    command(nameAndArgs, actionOptsOrExecDesc, execOpts) {
      let desc = actionOptsOrExecDesc;
      let opts = execOpts;
      if (typeof desc === "object" && desc !== null) {
        opts = desc;
        desc = null;
      }
      opts = opts || {};
      const [, name, args] = nameAndArgs.match(/([^ ]+) *(.*)/);
      const cmd = this.createCommand(name);
      if (desc) {
        cmd.description(desc);
        cmd._executableHandler = true;
      }
      if (opts.isDefault)
        this._defaultCommandName = cmd._name;
      cmd._hidden = !!(opts.noHelp || opts.hidden);
      cmd._executableFile = opts.executableFile || null;
      if (args)
        cmd.arguments(args);
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd.copyInheritedSettings(this);
      if (desc)
        return this;
      return cmd;
    }
    createCommand(name) {
      return new Command(name);
    }
    createHelp() {
      return Object.assign(new Help, this.configureHelp());
    }
    configureHelp(configuration) {
      if (configuration === undefined)
        return this._helpConfiguration;
      this._helpConfiguration = configuration;
      return this;
    }
    configureOutput(configuration) {
      if (configuration === undefined)
        return this._outputConfiguration;
      Object.assign(this._outputConfiguration, configuration);
      return this;
    }
    showHelpAfterError(displayHelp = true) {
      if (typeof displayHelp !== "string")
        displayHelp = !!displayHelp;
      this._showHelpAfterError = displayHelp;
      return this;
    }
    showSuggestionAfterError(displaySuggestion = true) {
      this._showSuggestionAfterError = !!displaySuggestion;
      return this;
    }
    addCommand(cmd, opts) {
      if (!cmd._name) {
        throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
      }
      opts = opts || {};
      if (opts.isDefault)
        this._defaultCommandName = cmd._name;
      if (opts.noHelp || opts.hidden)
        cmd._hidden = true;
      this._registerCommand(cmd);
      cmd.parent = this;
      cmd._checkForBrokenPassThrough();
      return this;
    }
    createArgument(name, description) {
      return new Argument(name, description);
    }
    argument(name, description, fn, defaultValue) {
      const argument = this.createArgument(name, description);
      if (typeof fn === "function") {
        argument.default(defaultValue).argParser(fn);
      } else {
        argument.default(fn);
      }
      this.addArgument(argument);
      return this;
    }
    arguments(names) {
      names.trim().split(/ +/).forEach((detail) => {
        this.argument(detail);
      });
      return this;
    }
    addArgument(argument) {
      const previousArgument = this.registeredArguments.slice(-1)[0];
      if (previousArgument && previousArgument.variadic) {
        throw new Error(`only the last argument can be variadic '${previousArgument.name()}'`);
      }
      if (argument.required && argument.defaultValue !== undefined && argument.parseArg === undefined) {
        throw new Error(`a default value for a required argument is never used: '${argument.name()}'`);
      }
      this.registeredArguments.push(argument);
      return this;
    }
    helpCommand(enableOrNameAndArgs, description) {
      if (typeof enableOrNameAndArgs === "boolean") {
        this._addImplicitHelpCommand = enableOrNameAndArgs;
        return this;
      }
      enableOrNameAndArgs = enableOrNameAndArgs ?? "help [command]";
      const [, helpName, helpArgs] = enableOrNameAndArgs.match(/([^ ]+) *(.*)/);
      const helpDescription = description ?? "display help for command";
      const helpCommand = this.createCommand(helpName);
      helpCommand.helpOption(false);
      if (helpArgs)
        helpCommand.arguments(helpArgs);
      if (helpDescription)
        helpCommand.description(helpDescription);
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      return this;
    }
    addHelpCommand(helpCommand, deprecatedDescription) {
      if (typeof helpCommand !== "object") {
        this.helpCommand(helpCommand, deprecatedDescription);
        return this;
      }
      this._addImplicitHelpCommand = true;
      this._helpCommand = helpCommand;
      return this;
    }
    _getHelpCommand() {
      const hasImplicitHelpCommand = this._addImplicitHelpCommand ?? (this.commands.length && !this._actionHandler && !this._findCommand("help"));
      if (hasImplicitHelpCommand) {
        if (this._helpCommand === undefined) {
          this.helpCommand(undefined, undefined);
        }
        return this._helpCommand;
      }
      return null;
    }
    hook(event, listener) {
      const allowedValues = ["preSubcommand", "preAction", "postAction"];
      if (!allowedValues.includes(event)) {
        throw new Error(`Unexpected value for event passed to hook : '${event}'.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      if (this._lifeCycleHooks[event]) {
        this._lifeCycleHooks[event].push(listener);
      } else {
        this._lifeCycleHooks[event] = [listener];
      }
      return this;
    }
    exitOverride(fn) {
      if (fn) {
        this._exitCallback = fn;
      } else {
        this._exitCallback = (err) => {
          if (err.code !== "commander.executeSubCommandAsync") {
            throw err;
          } else {
          }
        };
      }
      return this;
    }
    _exit(exitCode, code, message) {
      if (this._exitCallback) {
        this._exitCallback(new CommanderError(exitCode, code, message));
      }
      process2.exit(exitCode);
    }
    action(fn) {
      const listener = (args) => {
        const expectedArgsCount = this.registeredArguments.length;
        const actionArgs = args.slice(0, expectedArgsCount);
        if (this._storeOptionsAsProperties) {
          actionArgs[expectedArgsCount] = this;
        } else {
          actionArgs[expectedArgsCount] = this.opts();
        }
        actionArgs.push(this);
        return fn.apply(this, actionArgs);
      };
      this._actionHandler = listener;
      return this;
    }
    createOption(flags, description) {
      return new Option(flags, description);
    }
    _callParseArg(target, value, previous, invalidArgumentMessage) {
      try {
        return target.parseArg(value, previous);
      } catch (err) {
        if (err.code === "commander.invalidArgument") {
          const message = `${invalidArgumentMessage} ${err.message}`;
          this.error(message, { exitCode: err.exitCode, code: err.code });
        }
        throw err;
      }
    }
    _registerOption(option) {
      const matchingOption = option.short && this._findOption(option.short) || option.long && this._findOption(option.long);
      if (matchingOption) {
        const matchingFlag = option.long && this._findOption(option.long) ? option.long : option.short;
        throw new Error(`Cannot add option '${option.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${matchingFlag}'
-  already used by option '${matchingOption.flags}'`);
      }
      this.options.push(option);
    }
    _registerCommand(command) {
      const knownBy = (cmd) => {
        return [cmd.name()].concat(cmd.aliases());
      };
      const alreadyUsed = knownBy(command).find((name) => this._findCommand(name));
      if (alreadyUsed) {
        const existingCmd = knownBy(this._findCommand(alreadyUsed)).join("|");
        const newCmd = knownBy(command).join("|");
        throw new Error(`cannot add command '${newCmd}' as already have command '${existingCmd}'`);
      }
      this.commands.push(command);
    }
    addOption(option) {
      this._registerOption(option);
      const oname = option.name();
      const name = option.attributeName();
      if (option.negate) {
        const positiveLongFlag = option.long.replace(/^--no-/, "--");
        if (!this._findOption(positiveLongFlag)) {
          this.setOptionValueWithSource(name, option.defaultValue === undefined ? true : option.defaultValue, "default");
        }
      } else if (option.defaultValue !== undefined) {
        this.setOptionValueWithSource(name, option.defaultValue, "default");
      }
      const handleOptionValue = (val, invalidValueMessage, valueSource) => {
        if (val == null && option.presetArg !== undefined) {
          val = option.presetArg;
        }
        const oldValue = this.getOptionValue(name);
        if (val !== null && option.parseArg) {
          val = this._callParseArg(option, val, oldValue, invalidValueMessage);
        } else if (val !== null && option.variadic) {
          val = option._concatValue(val, oldValue);
        }
        if (val == null) {
          if (option.negate) {
            val = false;
          } else if (option.isBoolean() || option.optional) {
            val = true;
          } else {
            val = "";
          }
        }
        this.setOptionValueWithSource(name, val, valueSource);
      };
      this.on("option:" + oname, (val) => {
        const invalidValueMessage = `error: option '${option.flags}' argument '${val}' is invalid.`;
        handleOptionValue(val, invalidValueMessage, "cli");
      });
      if (option.envVar) {
        this.on("optionEnv:" + oname, (val) => {
          const invalidValueMessage = `error: option '${option.flags}' value '${val}' from env '${option.envVar}' is invalid.`;
          handleOptionValue(val, invalidValueMessage, "env");
        });
      }
      return this;
    }
    _optionEx(config, flags, description, fn, defaultValue) {
      if (typeof flags === "object" && flags instanceof Option) {
        throw new Error("To add an Option object use addOption() instead of option() or requiredOption()");
      }
      const option = this.createOption(flags, description);
      option.makeOptionMandatory(!!config.mandatory);
      if (typeof fn === "function") {
        option.default(defaultValue).argParser(fn);
      } else if (fn instanceof RegExp) {
        const regex = fn;
        fn = (val, def) => {
          const m = regex.exec(val);
          return m ? m[0] : def;
        };
        option.default(defaultValue).argParser(fn);
      } else {
        option.default(fn);
      }
      return this.addOption(option);
    }
    option(flags, description, parseArg, defaultValue) {
      return this._optionEx({}, flags, description, parseArg, defaultValue);
    }
    requiredOption(flags, description, parseArg, defaultValue) {
      return this._optionEx({ mandatory: true }, flags, description, parseArg, defaultValue);
    }
    combineFlagAndOptionalValue(combine = true) {
      this._combineFlagAndOptionalValue = !!combine;
      return this;
    }
    allowUnknownOption(allowUnknown = true) {
      this._allowUnknownOption = !!allowUnknown;
      return this;
    }
    allowExcessArguments(allowExcess = true) {
      this._allowExcessArguments = !!allowExcess;
      return this;
    }
    enablePositionalOptions(positional = true) {
      this._enablePositionalOptions = !!positional;
      return this;
    }
    passThroughOptions(passThrough = true) {
      this._passThroughOptions = !!passThrough;
      this._checkForBrokenPassThrough();
      return this;
    }
    _checkForBrokenPassThrough() {
      if (this.parent && this._passThroughOptions && !this.parent._enablePositionalOptions) {
        throw new Error(`passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`);
      }
    }
    storeOptionsAsProperties(storeAsProperties = true) {
      if (this.options.length) {
        throw new Error("call .storeOptionsAsProperties() before adding options");
      }
      if (Object.keys(this._optionValues).length) {
        throw new Error("call .storeOptionsAsProperties() before setting option values");
      }
      this._storeOptionsAsProperties = !!storeAsProperties;
      return this;
    }
    getOptionValue(key) {
      if (this._storeOptionsAsProperties) {
        return this[key];
      }
      return this._optionValues[key];
    }
    setOptionValue(key, value) {
      return this.setOptionValueWithSource(key, value, undefined);
    }
    setOptionValueWithSource(key, value, source) {
      if (this._storeOptionsAsProperties) {
        this[key] = value;
      } else {
        this._optionValues[key] = value;
      }
      this._optionValueSources[key] = source;
      return this;
    }
    getOptionValueSource(key) {
      return this._optionValueSources[key];
    }
    getOptionValueSourceWithGlobals(key) {
      let source;
      this._getCommandAndAncestors().forEach((cmd) => {
        if (cmd.getOptionValueSource(key) !== undefined) {
          source = cmd.getOptionValueSource(key);
        }
      });
      return source;
    }
    _prepareUserArgs(argv, parseOptions) {
      if (argv !== undefined && !Array.isArray(argv)) {
        throw new Error("first parameter to parse must be array or undefined");
      }
      parseOptions = parseOptions || {};
      if (argv === undefined && parseOptions.from === undefined) {
        if (process2.versions?.electron) {
          parseOptions.from = "electron";
        }
        const execArgv = process2.execArgv ?? [];
        if (execArgv.includes("-e") || execArgv.includes("--eval") || execArgv.includes("-p") || execArgv.includes("--print")) {
          parseOptions.from = "eval";
        }
      }
      if (argv === undefined) {
        argv = process2.argv;
      }
      this.rawArgs = argv.slice();
      let userArgs;
      switch (parseOptions.from) {
        case undefined:
        case "node":
          this._scriptPath = argv[1];
          userArgs = argv.slice(2);
          break;
        case "electron":
          if (process2.defaultApp) {
            this._scriptPath = argv[1];
            userArgs = argv.slice(2);
          } else {
            userArgs = argv.slice(1);
          }
          break;
        case "user":
          userArgs = argv.slice(0);
          break;
        case "eval":
          userArgs = argv.slice(1);
          break;
        default:
          throw new Error(`unexpected parse option { from: '${parseOptions.from}' }`);
      }
      if (!this._name && this._scriptPath)
        this.nameFromFilename(this._scriptPath);
      this._name = this._name || "program";
      return userArgs;
    }
    parse(argv, parseOptions) {
      this._prepareForParse();
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      this._parseCommand([], userArgs);
      return this;
    }
    async parseAsync(argv, parseOptions) {
      this._prepareForParse();
      const userArgs = this._prepareUserArgs(argv, parseOptions);
      await this._parseCommand([], userArgs);
      return this;
    }
    _prepareForParse() {
      if (this._savedState === null) {
        this.saveStateBeforeParse();
      } else {
        this.restoreStateBeforeParse();
      }
    }
    saveStateBeforeParse() {
      this._savedState = {
        _name: this._name,
        _optionValues: { ...this._optionValues },
        _optionValueSources: { ...this._optionValueSources }
      };
    }
    restoreStateBeforeParse() {
      if (this._storeOptionsAsProperties)
        throw new Error(`Can not call parse again when storeOptionsAsProperties is true.
- either make a new Command for each call to parse, or stop storing options as properties`);
      this._name = this._savedState._name;
      this._scriptPath = null;
      this.rawArgs = [];
      this._optionValues = { ...this._savedState._optionValues };
      this._optionValueSources = { ...this._savedState._optionValueSources };
      this.args = [];
      this.processedArgs = [];
    }
    _checkForMissingExecutable(executableFile, executableDir, subcommandName) {
      if (fs.existsSync(executableFile))
        return;
      const executableDirMessage = executableDir ? `searched for local subcommand relative to directory '${executableDir}'` : "no directory for search for local subcommand, use .executableDir() to supply a custom directory";
      const executableMissing = `'${executableFile}' does not exist
 - if '${subcommandName}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${executableDirMessage}`;
      throw new Error(executableMissing);
    }
    _executeSubCommand(subcommand, args) {
      args = args.slice();
      let launchWithNode = false;
      const sourceExt = [".js", ".ts", ".tsx", ".mjs", ".cjs"];
      function findFile(baseDir, baseName) {
        const localBin = path.resolve(baseDir, baseName);
        if (fs.existsSync(localBin))
          return localBin;
        if (sourceExt.includes(path.extname(baseName)))
          return;
        const foundExt = sourceExt.find((ext) => fs.existsSync(`${localBin}${ext}`));
        if (foundExt)
          return `${localBin}${foundExt}`;
        return;
      }
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      let executableFile = subcommand._executableFile || `${this._name}-${subcommand._name}`;
      let executableDir = this._executableDir || "";
      if (this._scriptPath) {
        let resolvedScriptPath;
        try {
          resolvedScriptPath = fs.realpathSync(this._scriptPath);
        } catch {
          resolvedScriptPath = this._scriptPath;
        }
        executableDir = path.resolve(path.dirname(resolvedScriptPath), executableDir);
      }
      if (executableDir) {
        let localFile = findFile(executableDir, executableFile);
        if (!localFile && !subcommand._executableFile && this._scriptPath) {
          const legacyName = path.basename(this._scriptPath, path.extname(this._scriptPath));
          if (legacyName !== this._name) {
            localFile = findFile(executableDir, `${legacyName}-${subcommand._name}`);
          }
        }
        executableFile = localFile || executableFile;
      }
      launchWithNode = sourceExt.includes(path.extname(executableFile));
      let proc;
      if (process2.platform !== "win32") {
        if (launchWithNode) {
          args.unshift(executableFile);
          args = incrementNodeInspectorPort(process2.execArgv).concat(args);
          proc = childProcess.spawn(process2.argv[0], args, { stdio: "inherit" });
        } else {
          proc = childProcess.spawn(executableFile, args, { stdio: "inherit" });
        }
      } else {
        this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
        args.unshift(executableFile);
        args = incrementNodeInspectorPort(process2.execArgv).concat(args);
        proc = childProcess.spawn(process2.execPath, args, { stdio: "inherit" });
      }
      if (!proc.killed) {
        const signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
        signals.forEach((signal) => {
          process2.on(signal, () => {
            if (proc.killed === false && proc.exitCode === null) {
              proc.kill(signal);
            }
          });
        });
      }
      const exitCallback = this._exitCallback;
      proc.on("close", (code) => {
        code = code ?? 1;
        if (!exitCallback) {
          process2.exit(code);
        } else {
          exitCallback(new CommanderError(code, "commander.executeSubCommandAsync", "(close)"));
        }
      });
      proc.on("error", (err) => {
        if (err.code === "ENOENT") {
          this._checkForMissingExecutable(executableFile, executableDir, subcommand._name);
        } else if (err.code === "EACCES") {
          throw new Error(`'${executableFile}' not executable`);
        }
        if (!exitCallback) {
          process2.exit(1);
        } else {
          const wrappedError = new CommanderError(1, "commander.executeSubCommandAsync", "(error)");
          wrappedError.nestedError = err;
          exitCallback(wrappedError);
        }
      });
      this.runningCommand = proc;
    }
    _dispatchSubcommand(commandName, operands, unknown) {
      const subCommand = this._findCommand(commandName);
      if (!subCommand)
        this.help({ error: true });
      subCommand._prepareForParse();
      let promiseChain;
      promiseChain = this._chainOrCallSubCommandHook(promiseChain, subCommand, "preSubcommand");
      promiseChain = this._chainOrCall(promiseChain, () => {
        if (subCommand._executableHandler) {
          this._executeSubCommand(subCommand, operands.concat(unknown));
        } else {
          return subCommand._parseCommand(operands, unknown);
        }
      });
      return promiseChain;
    }
    _dispatchHelpCommand(subcommandName) {
      if (!subcommandName) {
        this.help();
      }
      const subCommand = this._findCommand(subcommandName);
      if (subCommand && !subCommand._executableHandler) {
        subCommand.help();
      }
      return this._dispatchSubcommand(subcommandName, [], [this._getHelpOption()?.long ?? this._getHelpOption()?.short ?? "--help"]);
    }
    _checkNumberOfArguments() {
      this.registeredArguments.forEach((arg, i) => {
        if (arg.required && this.args[i] == null) {
          this.missingArgument(arg.name());
        }
      });
      if (this.registeredArguments.length > 0 && this.registeredArguments[this.registeredArguments.length - 1].variadic) {
        return;
      }
      if (this.args.length > this.registeredArguments.length) {
        this._excessArguments(this.args);
      }
    }
    _processArguments() {
      const myParseArg = (argument, value, previous) => {
        let parsedValue = value;
        if (value !== null && argument.parseArg) {
          const invalidValueMessage = `error: command-argument value '${value}' is invalid for argument '${argument.name()}'.`;
          parsedValue = this._callParseArg(argument, value, previous, invalidValueMessage);
        }
        return parsedValue;
      };
      this._checkNumberOfArguments();
      const processedArgs = [];
      this.registeredArguments.forEach((declaredArg, index) => {
        let value = declaredArg.defaultValue;
        if (declaredArg.variadic) {
          if (index < this.args.length) {
            value = this.args.slice(index);
            if (declaredArg.parseArg) {
              value = value.reduce((processed, v) => {
                return myParseArg(declaredArg, v, processed);
              }, declaredArg.defaultValue);
            }
          } else if (value === undefined) {
            value = [];
          }
        } else if (index < this.args.length) {
          value = this.args[index];
          if (declaredArg.parseArg) {
            value = myParseArg(declaredArg, value, declaredArg.defaultValue);
          }
        }
        processedArgs[index] = value;
      });
      this.processedArgs = processedArgs;
    }
    _chainOrCall(promise, fn) {
      if (promise && promise.then && typeof promise.then === "function") {
        return promise.then(() => fn());
      }
      return fn();
    }
    _chainOrCallHooks(promise, event) {
      let result = promise;
      const hooks = [];
      this._getCommandAndAncestors().reverse().filter((cmd) => cmd._lifeCycleHooks[event] !== undefined).forEach((hookedCommand) => {
        hookedCommand._lifeCycleHooks[event].forEach((callback) => {
          hooks.push({ hookedCommand, callback });
        });
      });
      if (event === "postAction") {
        hooks.reverse();
      }
      hooks.forEach((hookDetail) => {
        result = this._chainOrCall(result, () => {
          return hookDetail.callback(hookDetail.hookedCommand, this);
        });
      });
      return result;
    }
    _chainOrCallSubCommandHook(promise, subCommand, event) {
      let result = promise;
      if (this._lifeCycleHooks[event] !== undefined) {
        this._lifeCycleHooks[event].forEach((hook) => {
          result = this._chainOrCall(result, () => {
            return hook(this, subCommand);
          });
        });
      }
      return result;
    }
    _parseCommand(operands, unknown) {
      const parsed = this.parseOptions(unknown);
      this._parseOptionsEnv();
      this._parseOptionsImplied();
      operands = operands.concat(parsed.operands);
      unknown = parsed.unknown;
      this.args = operands.concat(unknown);
      if (operands && this._findCommand(operands[0])) {
        return this._dispatchSubcommand(operands[0], operands.slice(1), unknown);
      }
      if (this._getHelpCommand() && operands[0] === this._getHelpCommand().name()) {
        return this._dispatchHelpCommand(operands[1]);
      }
      if (this._defaultCommandName) {
        this._outputHelpIfRequested(unknown);
        return this._dispatchSubcommand(this._defaultCommandName, operands, unknown);
      }
      if (this.commands.length && this.args.length === 0 && !this._actionHandler && !this._defaultCommandName) {
        this.help({ error: true });
      }
      this._outputHelpIfRequested(parsed.unknown);
      this._checkForMissingMandatoryOptions();
      this._checkForConflictingOptions();
      const checkForUnknownOptions = () => {
        if (parsed.unknown.length > 0) {
          this.unknownOption(parsed.unknown[0]);
        }
      };
      const commandEvent = `command:${this.name()}`;
      if (this._actionHandler) {
        checkForUnknownOptions();
        this._processArguments();
        let promiseChain;
        promiseChain = this._chainOrCallHooks(promiseChain, "preAction");
        promiseChain = this._chainOrCall(promiseChain, () => this._actionHandler(this.processedArgs));
        if (this.parent) {
          promiseChain = this._chainOrCall(promiseChain, () => {
            this.parent.emit(commandEvent, operands, unknown);
          });
        }
        promiseChain = this._chainOrCallHooks(promiseChain, "postAction");
        return promiseChain;
      }
      if (this.parent && this.parent.listenerCount(commandEvent)) {
        checkForUnknownOptions();
        this._processArguments();
        this.parent.emit(commandEvent, operands, unknown);
      } else if (operands.length) {
        if (this._findCommand("*")) {
          return this._dispatchSubcommand("*", operands, unknown);
        }
        if (this.listenerCount("command:*")) {
          this.emit("command:*", operands, unknown);
        } else if (this.commands.length) {
          this.unknownCommand();
        } else {
          checkForUnknownOptions();
          this._processArguments();
        }
      } else if (this.commands.length) {
        checkForUnknownOptions();
        this.help({ error: true });
      } else {
        checkForUnknownOptions();
        this._processArguments();
      }
    }
    _findCommand(name) {
      if (!name)
        return;
      return this.commands.find((cmd) => cmd._name === name || cmd._aliases.includes(name));
    }
    _findOption(arg) {
      return this.options.find((option) => option.is(arg));
    }
    _checkForMissingMandatoryOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd.options.forEach((anOption) => {
          if (anOption.mandatory && cmd.getOptionValue(anOption.attributeName()) === undefined) {
            cmd.missingMandatoryOptionValue(anOption);
          }
        });
      });
    }
    _checkForConflictingLocalOptions() {
      const definedNonDefaultOptions = this.options.filter((option) => {
        const optionKey = option.attributeName();
        if (this.getOptionValue(optionKey) === undefined) {
          return false;
        }
        return this.getOptionValueSource(optionKey) !== "default";
      });
      const optionsWithConflicting = definedNonDefaultOptions.filter((option) => option.conflictsWith.length > 0);
      optionsWithConflicting.forEach((option) => {
        const conflictingAndDefined = definedNonDefaultOptions.find((defined) => option.conflictsWith.includes(defined.attributeName()));
        if (conflictingAndDefined) {
          this._conflictingOption(option, conflictingAndDefined);
        }
      });
    }
    _checkForConflictingOptions() {
      this._getCommandAndAncestors().forEach((cmd) => {
        cmd._checkForConflictingLocalOptions();
      });
    }
    parseOptions(argv) {
      const operands = [];
      const unknown = [];
      let dest = operands;
      const args = argv.slice();
      function maybeOption(arg) {
        return arg.length > 1 && arg[0] === "-";
      }
      let activeVariadicOption = null;
      while (args.length) {
        const arg = args.shift();
        if (arg === "--") {
          if (dest === unknown)
            dest.push(arg);
          dest.push(...args);
          break;
        }
        if (activeVariadicOption && !maybeOption(arg)) {
          this.emit(`option:${activeVariadicOption.name()}`, arg);
          continue;
        }
        activeVariadicOption = null;
        if (maybeOption(arg)) {
          const option = this._findOption(arg);
          if (option) {
            if (option.required) {
              const value = args.shift();
              if (value === undefined)
                this.optionMissingArgument(option);
              this.emit(`option:${option.name()}`, value);
            } else if (option.optional) {
              let value = null;
              if (args.length > 0 && !maybeOption(args[0])) {
                value = args.shift();
              }
              this.emit(`option:${option.name()}`, value);
            } else {
              this.emit(`option:${option.name()}`);
            }
            activeVariadicOption = option.variadic ? option : null;
            continue;
          }
        }
        if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
          const option = this._findOption(`-${arg[1]}`);
          if (option) {
            if (option.required || option.optional && this._combineFlagAndOptionalValue) {
              this.emit(`option:${option.name()}`, arg.slice(2));
            } else {
              this.emit(`option:${option.name()}`);
              args.unshift(`-${arg.slice(2)}`);
            }
            continue;
          }
        }
        if (/^--[^=]+=/.test(arg)) {
          const index = arg.indexOf("=");
          const option = this._findOption(arg.slice(0, index));
          if (option && (option.required || option.optional)) {
            this.emit(`option:${option.name()}`, arg.slice(index + 1));
            continue;
          }
        }
        if (maybeOption(arg)) {
          dest = unknown;
        }
        if ((this._enablePositionalOptions || this._passThroughOptions) && operands.length === 0 && unknown.length === 0) {
          if (this._findCommand(arg)) {
            operands.push(arg);
            if (args.length > 0)
              unknown.push(...args);
            break;
          } else if (this._getHelpCommand() && arg === this._getHelpCommand().name()) {
            operands.push(arg);
            if (args.length > 0)
              operands.push(...args);
            break;
          } else if (this._defaultCommandName) {
            unknown.push(arg);
            if (args.length > 0)
              unknown.push(...args);
            break;
          }
        }
        if (this._passThroughOptions) {
          dest.push(arg);
          if (args.length > 0)
            dest.push(...args);
          break;
        }
        dest.push(arg);
      }
      return { operands, unknown };
    }
    opts() {
      if (this._storeOptionsAsProperties) {
        const result = {};
        const len = this.options.length;
        for (let i = 0;i < len; i++) {
          const key = this.options[i].attributeName();
          result[key] = key === this._versionOptionName ? this._version : this[key];
        }
        return result;
      }
      return this._optionValues;
    }
    optsWithGlobals() {
      return this._getCommandAndAncestors().reduce((combinedOptions, cmd) => Object.assign(combinedOptions, cmd.opts()), {});
    }
    error(message, errorOptions) {
      this._outputConfiguration.outputError(`${message}
`, this._outputConfiguration.writeErr);
      if (typeof this._showHelpAfterError === "string") {
        this._outputConfiguration.writeErr(`${this._showHelpAfterError}
`);
      } else if (this._showHelpAfterError) {
        this._outputConfiguration.writeErr(`
`);
        this.outputHelp({ error: true });
      }
      const config = errorOptions || {};
      const exitCode = config.exitCode || 1;
      const code = config.code || "commander.error";
      this._exit(exitCode, code, message);
    }
    _parseOptionsEnv() {
      this.options.forEach((option) => {
        if (option.envVar && option.envVar in process2.env) {
          const optionKey = option.attributeName();
          if (this.getOptionValue(optionKey) === undefined || ["default", "config", "env"].includes(this.getOptionValueSource(optionKey))) {
            if (option.required || option.optional) {
              this.emit(`optionEnv:${option.name()}`, process2.env[option.envVar]);
            } else {
              this.emit(`optionEnv:${option.name()}`);
            }
          }
        }
      });
    }
    _parseOptionsImplied() {
      const dualHelper = new DualOptions(this.options);
      const hasCustomOptionValue = (optionKey) => {
        return this.getOptionValue(optionKey) !== undefined && !["default", "implied"].includes(this.getOptionValueSource(optionKey));
      };
      this.options.filter((option) => option.implied !== undefined && hasCustomOptionValue(option.attributeName()) && dualHelper.valueFromOption(this.getOptionValue(option.attributeName()), option)).forEach((option) => {
        Object.keys(option.implied).filter((impliedKey) => !hasCustomOptionValue(impliedKey)).forEach((impliedKey) => {
          this.setOptionValueWithSource(impliedKey, option.implied[impliedKey], "implied");
        });
      });
    }
    missingArgument(name) {
      const message = `error: missing required argument '${name}'`;
      this.error(message, { code: "commander.missingArgument" });
    }
    optionMissingArgument(option) {
      const message = `error: option '${option.flags}' argument missing`;
      this.error(message, { code: "commander.optionMissingArgument" });
    }
    missingMandatoryOptionValue(option) {
      const message = `error: required option '${option.flags}' not specified`;
      this.error(message, { code: "commander.missingMandatoryOptionValue" });
    }
    _conflictingOption(option, conflictingOption) {
      const findBestOptionFromValue = (option2) => {
        const optionKey = option2.attributeName();
        const optionValue = this.getOptionValue(optionKey);
        const negativeOption = this.options.find((target) => target.negate && optionKey === target.attributeName());
        const positiveOption = this.options.find((target) => !target.negate && optionKey === target.attributeName());
        if (negativeOption && (negativeOption.presetArg === undefined && optionValue === false || negativeOption.presetArg !== undefined && optionValue === negativeOption.presetArg)) {
          return negativeOption;
        }
        return positiveOption || option2;
      };
      const getErrorMessage = (option2) => {
        const bestOption = findBestOptionFromValue(option2);
        const optionKey = bestOption.attributeName();
        const source = this.getOptionValueSource(optionKey);
        if (source === "env") {
          return `environment variable '${bestOption.envVar}'`;
        }
        return `option '${bestOption.flags}'`;
      };
      const message = `error: ${getErrorMessage(option)} cannot be used with ${getErrorMessage(conflictingOption)}`;
      this.error(message, { code: "commander.conflictingOption" });
    }
    unknownOption(flag) {
      if (this._allowUnknownOption)
        return;
      let suggestion = "";
      if (flag.startsWith("--") && this._showSuggestionAfterError) {
        let candidateFlags = [];
        let command = this;
        do {
          const moreFlags = command.createHelp().visibleOptions(command).filter((option) => option.long).map((option) => option.long);
          candidateFlags = candidateFlags.concat(moreFlags);
          command = command.parent;
        } while (command && !command._enablePositionalOptions);
        suggestion = suggestSimilar(flag, candidateFlags);
      }
      const message = `error: unknown option '${flag}'${suggestion}`;
      this.error(message, { code: "commander.unknownOption" });
    }
    _excessArguments(receivedArgs) {
      if (this._allowExcessArguments)
        return;
      const expected = this.registeredArguments.length;
      const s = expected === 1 ? "" : "s";
      const forSubcommand = this.parent ? ` for '${this.name()}'` : "";
      const message = `error: too many arguments${forSubcommand}. Expected ${expected} argument${s} but got ${receivedArgs.length}.`;
      this.error(message, { code: "commander.excessArguments" });
    }
    unknownCommand() {
      const unknownName = this.args[0];
      let suggestion = "";
      if (this._showSuggestionAfterError) {
        const candidateNames = [];
        this.createHelp().visibleCommands(this).forEach((command) => {
          candidateNames.push(command.name());
          if (command.alias())
            candidateNames.push(command.alias());
        });
        suggestion = suggestSimilar(unknownName, candidateNames);
      }
      const message = `error: unknown command '${unknownName}'${suggestion}`;
      this.error(message, { code: "commander.unknownCommand" });
    }
    version(str, flags, description) {
      if (str === undefined)
        return this._version;
      this._version = str;
      flags = flags || "-V, --version";
      description = description || "output the version number";
      const versionOption = this.createOption(flags, description);
      this._versionOptionName = versionOption.attributeName();
      this._registerOption(versionOption);
      this.on("option:" + versionOption.name(), () => {
        this._outputConfiguration.writeOut(`${str}
`);
        this._exit(0, "commander.version", str);
      });
      return this;
    }
    description(str, argsDescription) {
      if (str === undefined && argsDescription === undefined)
        return this._description;
      this._description = str;
      if (argsDescription) {
        this._argsDescription = argsDescription;
      }
      return this;
    }
    summary(str) {
      if (str === undefined)
        return this._summary;
      this._summary = str;
      return this;
    }
    alias(alias) {
      if (alias === undefined)
        return this._aliases[0];
      let command = this;
      if (this.commands.length !== 0 && this.commands[this.commands.length - 1]._executableHandler) {
        command = this.commands[this.commands.length - 1];
      }
      if (alias === command._name)
        throw new Error("Command alias can't be the same as its name");
      const matchingCommand = this.parent?._findCommand(alias);
      if (matchingCommand) {
        const existingCmd = [matchingCommand.name()].concat(matchingCommand.aliases()).join("|");
        throw new Error(`cannot add alias '${alias}' to command '${this.name()}' as already have command '${existingCmd}'`);
      }
      command._aliases.push(alias);
      return this;
    }
    aliases(aliases) {
      if (aliases === undefined)
        return this._aliases;
      aliases.forEach((alias) => this.alias(alias));
      return this;
    }
    usage(str) {
      if (str === undefined) {
        if (this._usage)
          return this._usage;
        const args = this.registeredArguments.map((arg) => {
          return humanReadableArgName(arg);
        });
        return [].concat(this.options.length || this._helpOption !== null ? "[options]" : [], this.commands.length ? "[command]" : [], this.registeredArguments.length ? args : []).join(" ");
      }
      this._usage = str;
      return this;
    }
    name(str) {
      if (str === undefined)
        return this._name;
      this._name = str;
      return this;
    }
    nameFromFilename(filename) {
      this._name = path.basename(filename, path.extname(filename));
      return this;
    }
    executableDir(path2) {
      if (path2 === undefined)
        return this._executableDir;
      this._executableDir = path2;
      return this;
    }
    helpInformation(contextOptions) {
      const helper = this.createHelp();
      const context = this._getOutputContext(contextOptions);
      helper.prepareContext({
        error: context.error,
        helpWidth: context.helpWidth,
        outputHasColors: context.hasColors
      });
      const text = helper.formatHelp(this, helper);
      if (context.hasColors)
        return text;
      return this._outputConfiguration.stripColor(text);
    }
    _getOutputContext(contextOptions) {
      contextOptions = contextOptions || {};
      const error = !!contextOptions.error;
      let baseWrite;
      let hasColors;
      let helpWidth;
      if (error) {
        baseWrite = (str) => this._outputConfiguration.writeErr(str);
        hasColors = this._outputConfiguration.getErrHasColors();
        helpWidth = this._outputConfiguration.getErrHelpWidth();
      } else {
        baseWrite = (str) => this._outputConfiguration.writeOut(str);
        hasColors = this._outputConfiguration.getOutHasColors();
        helpWidth = this._outputConfiguration.getOutHelpWidth();
      }
      const write = (str) => {
        if (!hasColors)
          str = this._outputConfiguration.stripColor(str);
        return baseWrite(str);
      };
      return { error, write, hasColors, helpWidth };
    }
    outputHelp(contextOptions) {
      let deprecatedCallback;
      if (typeof contextOptions === "function") {
        deprecatedCallback = contextOptions;
        contextOptions = undefined;
      }
      const outputContext = this._getOutputContext(contextOptions);
      const eventContext = {
        error: outputContext.error,
        write: outputContext.write,
        command: this
      };
      this._getCommandAndAncestors().reverse().forEach((command) => command.emit("beforeAllHelp", eventContext));
      this.emit("beforeHelp", eventContext);
      let helpInformation = this.helpInformation({ error: outputContext.error });
      if (deprecatedCallback) {
        helpInformation = deprecatedCallback(helpInformation);
        if (typeof helpInformation !== "string" && !Buffer.isBuffer(helpInformation)) {
          throw new Error("outputHelp callback must return a string or a Buffer");
        }
      }
      outputContext.write(helpInformation);
      if (this._getHelpOption()?.long) {
        this.emit(this._getHelpOption().long);
      }
      this.emit("afterHelp", eventContext);
      this._getCommandAndAncestors().forEach((command) => command.emit("afterAllHelp", eventContext));
    }
    helpOption(flags, description) {
      if (typeof flags === "boolean") {
        if (flags) {
          this._helpOption = this._helpOption ?? undefined;
        } else {
          this._helpOption = null;
        }
        return this;
      }
      flags = flags ?? "-h, --help";
      description = description ?? "display help for command";
      this._helpOption = this.createOption(flags, description);
      return this;
    }
    _getHelpOption() {
      if (this._helpOption === undefined) {
        this.helpOption(undefined, undefined);
      }
      return this._helpOption;
    }
    addHelpOption(option) {
      this._helpOption = option;
      return this;
    }
    help(contextOptions) {
      this.outputHelp(contextOptions);
      let exitCode = Number(process2.exitCode ?? 0);
      if (exitCode === 0 && contextOptions && typeof contextOptions !== "function" && contextOptions.error) {
        exitCode = 1;
      }
      this._exit(exitCode, "commander.help", "(outputHelp)");
    }
    addHelpText(position, text) {
      const allowedValues = ["beforeAll", "before", "after", "afterAll"];
      if (!allowedValues.includes(position)) {
        throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${allowedValues.join("', '")}'`);
      }
      const helpEvent = `${position}Help`;
      this.on(helpEvent, (context) => {
        let helpStr;
        if (typeof text === "function") {
          helpStr = text({ error: context.error, command: context.command });
        } else {
          helpStr = text;
        }
        if (helpStr) {
          context.write(`${helpStr}
`);
        }
      });
      return this;
    }
    _outputHelpIfRequested(args) {
      const helpOption = this._getHelpOption();
      const helpRequested = helpOption && args.find((arg) => helpOption.is(arg));
      if (helpRequested) {
        this.outputHelp();
        this._exit(0, "commander.helpDisplayed", "(outputHelp)");
      }
    }
  }
  function incrementNodeInspectorPort(args) {
    return args.map((arg) => {
      if (!arg.startsWith("--inspect")) {
        return arg;
      }
      let debugOption;
      let debugHost = "127.0.0.1";
      let debugPort = "9229";
      let match;
      if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
        debugOption = match[1];
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
        debugOption = match[1];
        if (/^\d+$/.test(match[3])) {
          debugPort = match[3];
        } else {
          debugHost = match[3];
        }
      } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
        debugOption = match[1];
        debugHost = match[3];
        debugPort = match[4];
      }
      if (debugOption && debugPort !== "0") {
        return `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
      }
      return arg;
    });
  }
  function useColor() {
    if (process2.env.NO_COLOR || process2.env.FORCE_COLOR === "0" || process2.env.FORCE_COLOR === "false")
      return false;
    if (process2.env.FORCE_COLOR || process2.env.CLICOLOR_FORCE !== undefined)
      return true;
    return;
  }
  exports.Command = Command;
  exports.useColor = useColor;
});

// node_modules/commander/index.js
var require_commander = __commonJS((exports) => {
  var { Argument } = require_argument();
  var { Command } = require_command();
  var { CommanderError, InvalidArgumentError } = require_error();
  var { Help } = require_help();
  var { Option } = require_option();
  exports.program = new Command;
  exports.createCommand = (name) => new Command(name);
  exports.createOption = (flags, description) => new Option(flags, description);
  exports.createArgument = (name, description) => new Argument(name, description);
  exports.Command = Command;
  exports.Option = Option;
  exports.Argument = Argument;
  exports.Help = Help;
  exports.CommanderError = CommanderError;
  exports.InvalidArgumentError = InvalidArgumentError;
  exports.InvalidOptionArgumentError = InvalidArgumentError;
});

// node_modules/universalify/index.js
var require_universalify = __commonJS((exports) => {
  exports.fromCallback = function(fn) {
    return Object.defineProperty(function(...args) {
      if (typeof args[args.length - 1] === "function")
        fn.apply(this, args);
      else {
        return new Promise((resolve, reject) => {
          args.push((err, res) => err != null ? reject(err) : resolve(res));
          fn.apply(this, args);
        });
      }
    }, "name", { value: fn.name });
  };
  exports.fromPromise = function(fn) {
    return Object.defineProperty(function(...args) {
      const cb = args[args.length - 1];
      if (typeof cb !== "function")
        return fn.apply(this, args);
      else {
        args.pop();
        fn.apply(this, args).then((r) => cb(null, r), cb);
      }
    }, "name", { value: fn.name });
  };
});

// node_modules/graceful-fs/polyfills.js
var require_polyfills = __commonJS((exports, module) => {
  var constants = __require("constants");
  var origCwd = process.cwd;
  var cwd = null;
  var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
  process.cwd = function() {
    if (!cwd)
      cwd = origCwd.call(process);
    return cwd;
  };
  try {
    process.cwd();
  } catch (er) {
  }
  if (typeof process.chdir === "function") {
    chdir = process.chdir;
    process.chdir = function(d) {
      cwd = null;
      chdir.call(process, d);
    };
    if (Object.setPrototypeOf)
      Object.setPrototypeOf(process.chdir, chdir);
  }
  var chdir;
  module.exports = patch;
  function patch(fs) {
    if (constants.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
      patchLchmod(fs);
    }
    if (!fs.lutimes) {
      patchLutimes(fs);
    }
    fs.chown = chownFix(fs.chown);
    fs.fchown = chownFix(fs.fchown);
    fs.lchown = chownFix(fs.lchown);
    fs.chmod = chmodFix(fs.chmod);
    fs.fchmod = chmodFix(fs.fchmod);
    fs.lchmod = chmodFix(fs.lchmod);
    fs.chownSync = chownFixSync(fs.chownSync);
    fs.fchownSync = chownFixSync(fs.fchownSync);
    fs.lchownSync = chownFixSync(fs.lchownSync);
    fs.chmodSync = chmodFixSync(fs.chmodSync);
    fs.fchmodSync = chmodFixSync(fs.fchmodSync);
    fs.lchmodSync = chmodFixSync(fs.lchmodSync);
    fs.stat = statFix(fs.stat);
    fs.fstat = statFix(fs.fstat);
    fs.lstat = statFix(fs.lstat);
    fs.statSync = statFixSync(fs.statSync);
    fs.fstatSync = statFixSync(fs.fstatSync);
    fs.lstatSync = statFixSync(fs.lstatSync);
    if (fs.chmod && !fs.lchmod) {
      fs.lchmod = function(path, mode, cb) {
        if (cb)
          process.nextTick(cb);
      };
      fs.lchmodSync = function() {
      };
    }
    if (fs.chown && !fs.lchown) {
      fs.lchown = function(path, uid, gid, cb) {
        if (cb)
          process.nextTick(cb);
      };
      fs.lchownSync = function() {
      };
    }
    if (platform === "win32") {
      fs.rename = typeof fs.rename !== "function" ? fs.rename : function(fs$rename) {
        function rename(from, to, cb) {
          var start = Date.now();
          var backoff = 0;
          fs$rename(from, to, function CB(er) {
            if (er && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY") && Date.now() - start < 60000) {
              setTimeout(function() {
                fs.stat(to, function(stater, st) {
                  if (stater && stater.code === "ENOENT")
                    fs$rename(from, to, CB);
                  else
                    cb(er);
                });
              }, backoff);
              if (backoff < 100)
                backoff += 10;
              return;
            }
            if (cb)
              cb(er);
          });
        }
        if (Object.setPrototypeOf)
          Object.setPrototypeOf(rename, fs$rename);
        return rename;
      }(fs.rename);
    }
    fs.read = typeof fs.read !== "function" ? fs.read : function(fs$read) {
      function read(fd, buffer, offset, length, position, callback_) {
        var callback;
        if (callback_ && typeof callback_ === "function") {
          var eagCounter = 0;
          callback = function(er, _, __) {
            if (er && er.code === "EAGAIN" && eagCounter < 10) {
              eagCounter++;
              return fs$read.call(fs, fd, buffer, offset, length, position, callback);
            }
            callback_.apply(this, arguments);
          };
        }
        return fs$read.call(fs, fd, buffer, offset, length, position, callback);
      }
      if (Object.setPrototypeOf)
        Object.setPrototypeOf(read, fs$read);
      return read;
    }(fs.read);
    fs.readSync = typeof fs.readSync !== "function" ? fs.readSync : function(fs$readSync) {
      return function(fd, buffer, offset, length, position) {
        var eagCounter = 0;
        while (true) {
          try {
            return fs$readSync.call(fs, fd, buffer, offset, length, position);
          } catch (er) {
            if (er.code === "EAGAIN" && eagCounter < 10) {
              eagCounter++;
              continue;
            }
            throw er;
          }
        }
      };
    }(fs.readSync);
    function patchLchmod(fs2) {
      fs2.lchmod = function(path, mode, callback) {
        fs2.open(path, constants.O_WRONLY | constants.O_SYMLINK, mode, function(err, fd) {
          if (err) {
            if (callback)
              callback(err);
            return;
          }
          fs2.fchmod(fd, mode, function(err2) {
            fs2.close(fd, function(err22) {
              if (callback)
                callback(err2 || err22);
            });
          });
        });
      };
      fs2.lchmodSync = function(path, mode) {
        var fd = fs2.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode);
        var threw = true;
        var ret;
        try {
          ret = fs2.fchmodSync(fd, mode);
          threw = false;
        } finally {
          if (threw) {
            try {
              fs2.closeSync(fd);
            } catch (er) {
            }
          } else {
            fs2.closeSync(fd);
          }
        }
        return ret;
      };
    }
    function patchLutimes(fs2) {
      if (constants.hasOwnProperty("O_SYMLINK") && fs2.futimes) {
        fs2.lutimes = function(path, at, mt, cb) {
          fs2.open(path, constants.O_SYMLINK, function(er, fd) {
            if (er) {
              if (cb)
                cb(er);
              return;
            }
            fs2.futimes(fd, at, mt, function(er2) {
              fs2.close(fd, function(er22) {
                if (cb)
                  cb(er2 || er22);
              });
            });
          });
        };
        fs2.lutimesSync = function(path, at, mt) {
          var fd = fs2.openSync(path, constants.O_SYMLINK);
          var ret;
          var threw = true;
          try {
            ret = fs2.futimesSync(fd, at, mt);
            threw = false;
          } finally {
            if (threw) {
              try {
                fs2.closeSync(fd);
              } catch (er) {
              }
            } else {
              fs2.closeSync(fd);
            }
          }
          return ret;
        };
      } else if (fs2.futimes) {
        fs2.lutimes = function(_a, _b, _c, cb) {
          if (cb)
            process.nextTick(cb);
        };
        fs2.lutimesSync = function() {
        };
      }
    }
    function chmodFix(orig) {
      if (!orig)
        return orig;
      return function(target, mode, cb) {
        return orig.call(fs, target, mode, function(er) {
          if (chownErOk(er))
            er = null;
          if (cb)
            cb.apply(this, arguments);
        });
      };
    }
    function chmodFixSync(orig) {
      if (!orig)
        return orig;
      return function(target, mode) {
        try {
          return orig.call(fs, target, mode);
        } catch (er) {
          if (!chownErOk(er))
            throw er;
        }
      };
    }
    function chownFix(orig) {
      if (!orig)
        return orig;
      return function(target, uid, gid, cb) {
        return orig.call(fs, target, uid, gid, function(er) {
          if (chownErOk(er))
            er = null;
          if (cb)
            cb.apply(this, arguments);
        });
      };
    }
    function chownFixSync(orig) {
      if (!orig)
        return orig;
      return function(target, uid, gid) {
        try {
          return orig.call(fs, target, uid, gid);
        } catch (er) {
          if (!chownErOk(er))
            throw er;
        }
      };
    }
    function statFix(orig) {
      if (!orig)
        return orig;
      return function(target, options, cb) {
        if (typeof options === "function") {
          cb = options;
          options = null;
        }
        function callback(er, stats) {
          if (stats) {
            if (stats.uid < 0)
              stats.uid += 4294967296;
            if (stats.gid < 0)
              stats.gid += 4294967296;
          }
          if (cb)
            cb.apply(this, arguments);
        }
        return options ? orig.call(fs, target, options, callback) : orig.call(fs, target, callback);
      };
    }
    function statFixSync(orig) {
      if (!orig)
        return orig;
      return function(target, options) {
        var stats = options ? orig.call(fs, target, options) : orig.call(fs, target);
        if (stats) {
          if (stats.uid < 0)
            stats.uid += 4294967296;
          if (stats.gid < 0)
            stats.gid += 4294967296;
        }
        return stats;
      };
    }
    function chownErOk(er) {
      if (!er)
        return true;
      if (er.code === "ENOSYS")
        return true;
      var nonroot = !process.getuid || process.getuid() !== 0;
      if (nonroot) {
        if (er.code === "EINVAL" || er.code === "EPERM")
          return true;
      }
      return false;
    }
  }
});

// node_modules/graceful-fs/legacy-streams.js
var require_legacy_streams = __commonJS((exports, module) => {
  var Stream = __require("stream").Stream;
  module.exports = legacy;
  function legacy(fs) {
    return {
      ReadStream,
      WriteStream
    };
    function ReadStream(path, options) {
      if (!(this instanceof ReadStream))
        return new ReadStream(path, options);
      Stream.call(this);
      var self = this;
      this.path = path;
      this.fd = null;
      this.readable = true;
      this.paused = false;
      this.flags = "r";
      this.mode = 438;
      this.bufferSize = 64 * 1024;
      options = options || {};
      var keys = Object.keys(options);
      for (var index = 0, length = keys.length;index < length; index++) {
        var key = keys[index];
        this[key] = options[key];
      }
      if (this.encoding)
        this.setEncoding(this.encoding);
      if (this.start !== undefined) {
        if (typeof this.start !== "number") {
          throw TypeError("start must be a Number");
        }
        if (this.end === undefined) {
          this.end = Infinity;
        } else if (typeof this.end !== "number") {
          throw TypeError("end must be a Number");
        }
        if (this.start > this.end) {
          throw new Error("start must be <= end");
        }
        this.pos = this.start;
      }
      if (this.fd !== null) {
        process.nextTick(function() {
          self._read();
        });
        return;
      }
      fs.open(this.path, this.flags, this.mode, function(err, fd) {
        if (err) {
          self.emit("error", err);
          self.readable = false;
          return;
        }
        self.fd = fd;
        self.emit("open", fd);
        self._read();
      });
    }
    function WriteStream(path, options) {
      if (!(this instanceof WriteStream))
        return new WriteStream(path, options);
      Stream.call(this);
      this.path = path;
      this.fd = null;
      this.writable = true;
      this.flags = "w";
      this.encoding = "binary";
      this.mode = 438;
      this.bytesWritten = 0;
      options = options || {};
      var keys = Object.keys(options);
      for (var index = 0, length = keys.length;index < length; index++) {
        var key = keys[index];
        this[key] = options[key];
      }
      if (this.start !== undefined) {
        if (typeof this.start !== "number") {
          throw TypeError("start must be a Number");
        }
        if (this.start < 0) {
          throw new Error("start must be >= zero");
        }
        this.pos = this.start;
      }
      this.busy = false;
      this._queue = [];
      if (this.fd === null) {
        this._open = fs.open;
        this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);
        this.flush();
      }
    }
  }
});

// node_modules/graceful-fs/clone.js
var require_clone = __commonJS((exports, module) => {
  module.exports = clone;
  var getPrototypeOf = Object.getPrototypeOf || function(obj) {
    return obj.__proto__;
  };
  function clone(obj) {
    if (obj === null || typeof obj !== "object")
      return obj;
    if (obj instanceof Object)
      var copy = { __proto__: getPrototypeOf(obj) };
    else
      var copy = Object.create(null);
    Object.getOwnPropertyNames(obj).forEach(function(key) {
      Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
    });
    return copy;
  }
});

// node_modules/graceful-fs/graceful-fs.js
var require_graceful_fs = __commonJS((exports, module) => {
  var fs = __require("fs");
  var polyfills = require_polyfills();
  var legacy = require_legacy_streams();
  var clone = require_clone();
  var util = __require("util");
  var gracefulQueue;
  var previousSymbol;
  if (typeof Symbol === "function" && typeof Symbol.for === "function") {
    gracefulQueue = Symbol.for("graceful-fs.queue");
    previousSymbol = Symbol.for("graceful-fs.previous");
  } else {
    gracefulQueue = "___graceful-fs.queue";
    previousSymbol = "___graceful-fs.previous";
  }
  function noop() {
  }
  function publishQueue(context, queue2) {
    Object.defineProperty(context, gracefulQueue, {
      get: function() {
        return queue2;
      }
    });
  }
  var debug = noop;
  if (util.debuglog)
    debug = util.debuglog("gfs4");
  else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ""))
    debug = function() {
      var m = util.format.apply(util, arguments);
      m = "GFS4: " + m.split(/\n/).join(`
GFS4: `);
      console.error(m);
    };
  if (!fs[gracefulQueue]) {
    queue = global[gracefulQueue] || [];
    publishQueue(fs, queue);
    fs.close = function(fs$close) {
      function close(fd, cb) {
        return fs$close.call(fs, fd, function(err) {
          if (!err) {
            resetQueue();
          }
          if (typeof cb === "function")
            cb.apply(this, arguments);
        });
      }
      Object.defineProperty(close, previousSymbol, {
        value: fs$close
      });
      return close;
    }(fs.close);
    fs.closeSync = function(fs$closeSync) {
      function closeSync(fd) {
        fs$closeSync.apply(fs, arguments);
        resetQueue();
      }
      Object.defineProperty(closeSync, previousSymbol, {
        value: fs$closeSync
      });
      return closeSync;
    }(fs.closeSync);
    if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) {
      process.on("exit", function() {
        debug(fs[gracefulQueue]);
        __require("assert").equal(fs[gracefulQueue].length, 0);
      });
    }
  }
  var queue;
  if (!global[gracefulQueue]) {
    publishQueue(global, fs[gracefulQueue]);
  }
  module.exports = patch(clone(fs));
  if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs.__patched) {
    module.exports = patch(fs);
    fs.__patched = true;
  }
  function patch(fs2) {
    polyfills(fs2);
    fs2.gracefulify = patch;
    fs2.createReadStream = createReadStream;
    fs2.createWriteStream = createWriteStream;
    var fs$readFile = fs2.readFile;
    fs2.readFile = readFile;
    function readFile(path, options, cb) {
      if (typeof options === "function")
        cb = options, options = null;
      return go$readFile(path, options, cb);
      function go$readFile(path2, options2, cb2, startTime) {
        return fs$readFile(path2, options2, function(err) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$readFile, [path2, options2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    var fs$writeFile = fs2.writeFile;
    fs2.writeFile = writeFile;
    function writeFile(path, data, options, cb) {
      if (typeof options === "function")
        cb = options, options = null;
      return go$writeFile(path, data, options, cb);
      function go$writeFile(path2, data2, options2, cb2, startTime) {
        return fs$writeFile(path2, data2, options2, function(err) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$writeFile, [path2, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    var fs$appendFile = fs2.appendFile;
    if (fs$appendFile)
      fs2.appendFile = appendFile;
    function appendFile(path, data, options, cb) {
      if (typeof options === "function")
        cb = options, options = null;
      return go$appendFile(path, data, options, cb);
      function go$appendFile(path2, data2, options2, cb2, startTime) {
        return fs$appendFile(path2, data2, options2, function(err) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$appendFile, [path2, data2, options2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    var fs$copyFile = fs2.copyFile;
    if (fs$copyFile)
      fs2.copyFile = copyFile;
    function copyFile(src, dest, flags, cb) {
      if (typeof flags === "function") {
        cb = flags;
        flags = 0;
      }
      return go$copyFile(src, dest, flags, cb);
      function go$copyFile(src2, dest2, flags2, cb2, startTime) {
        return fs$copyFile(src2, dest2, flags2, function(err) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$copyFile, [src2, dest2, flags2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    var fs$readdir = fs2.readdir;
    fs2.readdir = readdir;
    var noReaddirOptionVersions = /^v[0-5]\./;
    function readdir(path, options, cb) {
      if (typeof options === "function")
        cb = options, options = null;
      var go$readdir = noReaddirOptionVersions.test(process.version) ? function go$readdir(path2, options2, cb2, startTime) {
        return fs$readdir(path2, fs$readdirCallback(path2, options2, cb2, startTime));
      } : function go$readdir(path2, options2, cb2, startTime) {
        return fs$readdir(path2, options2, fs$readdirCallback(path2, options2, cb2, startTime));
      };
      return go$readdir(path, options, cb);
      function fs$readdirCallback(path2, options2, cb2, startTime) {
        return function(err, files) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([
              go$readdir,
              [path2, options2, cb2],
              err,
              startTime || Date.now(),
              Date.now()
            ]);
          else {
            if (files && files.sort)
              files.sort();
            if (typeof cb2 === "function")
              cb2.call(this, err, files);
          }
        };
      }
    }
    if (process.version.substr(0, 4) === "v0.8") {
      var legStreams = legacy(fs2);
      ReadStream = legStreams.ReadStream;
      WriteStream = legStreams.WriteStream;
    }
    var fs$ReadStream = fs2.ReadStream;
    if (fs$ReadStream) {
      ReadStream.prototype = Object.create(fs$ReadStream.prototype);
      ReadStream.prototype.open = ReadStream$open;
    }
    var fs$WriteStream = fs2.WriteStream;
    if (fs$WriteStream) {
      WriteStream.prototype = Object.create(fs$WriteStream.prototype);
      WriteStream.prototype.open = WriteStream$open;
    }
    Object.defineProperty(fs2, "ReadStream", {
      get: function() {
        return ReadStream;
      },
      set: function(val) {
        ReadStream = val;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(fs2, "WriteStream", {
      get: function() {
        return WriteStream;
      },
      set: function(val) {
        WriteStream = val;
      },
      enumerable: true,
      configurable: true
    });
    var FileReadStream = ReadStream;
    Object.defineProperty(fs2, "FileReadStream", {
      get: function() {
        return FileReadStream;
      },
      set: function(val) {
        FileReadStream = val;
      },
      enumerable: true,
      configurable: true
    });
    var FileWriteStream = WriteStream;
    Object.defineProperty(fs2, "FileWriteStream", {
      get: function() {
        return FileWriteStream;
      },
      set: function(val) {
        FileWriteStream = val;
      },
      enumerable: true,
      configurable: true
    });
    function ReadStream(path, options) {
      if (this instanceof ReadStream)
        return fs$ReadStream.apply(this, arguments), this;
      else
        return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
    }
    function ReadStream$open() {
      var that = this;
      open(that.path, that.flags, that.mode, function(err, fd) {
        if (err) {
          if (that.autoClose)
            that.destroy();
          that.emit("error", err);
        } else {
          that.fd = fd;
          that.emit("open", fd);
          that.read();
        }
      });
    }
    function WriteStream(path, options) {
      if (this instanceof WriteStream)
        return fs$WriteStream.apply(this, arguments), this;
      else
        return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
    }
    function WriteStream$open() {
      var that = this;
      open(that.path, that.flags, that.mode, function(err, fd) {
        if (err) {
          that.destroy();
          that.emit("error", err);
        } else {
          that.fd = fd;
          that.emit("open", fd);
        }
      });
    }
    function createReadStream(path, options) {
      return new fs2.ReadStream(path, options);
    }
    function createWriteStream(path, options) {
      return new fs2.WriteStream(path, options);
    }
    var fs$open = fs2.open;
    fs2.open = open;
    function open(path, flags, mode, cb) {
      if (typeof mode === "function")
        cb = mode, mode = null;
      return go$open(path, flags, mode, cb);
      function go$open(path2, flags2, mode2, cb2, startTime) {
        return fs$open(path2, flags2, mode2, function(err, fd) {
          if (err && (err.code === "EMFILE" || err.code === "ENFILE"))
            enqueue([go$open, [path2, flags2, mode2, cb2], err, startTime || Date.now(), Date.now()]);
          else {
            if (typeof cb2 === "function")
              cb2.apply(this, arguments);
          }
        });
      }
    }
    return fs2;
  }
  function enqueue(elem) {
    debug("ENQUEUE", elem[0].name, elem[1]);
    fs[gracefulQueue].push(elem);
    retry();
  }
  var retryTimer;
  function resetQueue() {
    var now = Date.now();
    for (var i = 0;i < fs[gracefulQueue].length; ++i) {
      if (fs[gracefulQueue][i].length > 2) {
        fs[gracefulQueue][i][3] = now;
        fs[gracefulQueue][i][4] = now;
      }
    }
    retry();
  }
  function retry() {
    clearTimeout(retryTimer);
    retryTimer = undefined;
    if (fs[gracefulQueue].length === 0)
      return;
    var elem = fs[gracefulQueue].shift();
    var fn = elem[0];
    var args = elem[1];
    var err = elem[2];
    var startTime = elem[3];
    var lastTime = elem[4];
    if (startTime === undefined) {
      debug("RETRY", fn.name, args);
      fn.apply(null, args);
    } else if (Date.now() - startTime >= 60000) {
      debug("TIMEOUT", fn.name, args);
      var cb = args.pop();
      if (typeof cb === "function")
        cb.call(null, err);
    } else {
      var sinceAttempt = Date.now() - lastTime;
      var sinceStart = Math.max(lastTime - startTime, 1);
      var desiredDelay = Math.min(sinceStart * 1.2, 100);
      if (sinceAttempt >= desiredDelay) {
        debug("RETRY", fn.name, args);
        fn.apply(null, args.concat([startTime]));
      } else {
        fs[gracefulQueue].push(elem);
      }
    }
    if (retryTimer === undefined) {
      retryTimer = setTimeout(retry, 0);
    }
  }
});

// node_modules/fs-extra/lib/fs/index.js
var require_fs = __commonJS((exports) => {
  var u = require_universalify().fromCallback;
  var fs = require_graceful_fs();
  var api = [
    "access",
    "appendFile",
    "chmod",
    "chown",
    "close",
    "copyFile",
    "cp",
    "fchmod",
    "fchown",
    "fdatasync",
    "fstat",
    "fsync",
    "ftruncate",
    "futimes",
    "glob",
    "lchmod",
    "lchown",
    "lutimes",
    "link",
    "lstat",
    "mkdir",
    "mkdtemp",
    "open",
    "opendir",
    "readdir",
    "readFile",
    "readlink",
    "realpath",
    "rename",
    "rm",
    "rmdir",
    "stat",
    "statfs",
    "symlink",
    "truncate",
    "unlink",
    "utimes",
    "writeFile"
  ].filter((key) => {
    return typeof fs[key] === "function";
  });
  Object.assign(exports, fs);
  api.forEach((method) => {
    exports[method] = u(fs[method]);
  });
  exports.exists = function(filename, callback) {
    if (typeof callback === "function") {
      return fs.exists(filename, callback);
    }
    return new Promise((resolve) => {
      return fs.exists(filename, resolve);
    });
  };
  exports.read = function(fd, buffer, offset, length, position, callback) {
    if (typeof callback === "function") {
      return fs.read(fd, buffer, offset, length, position, callback);
    }
    return new Promise((resolve, reject) => {
      fs.read(fd, buffer, offset, length, position, (err, bytesRead, buffer2) => {
        if (err)
          return reject(err);
        resolve({ bytesRead, buffer: buffer2 });
      });
    });
  };
  exports.write = function(fd, buffer, ...args) {
    if (typeof args[args.length - 1] === "function") {
      return fs.write(fd, buffer, ...args);
    }
    return new Promise((resolve, reject) => {
      fs.write(fd, buffer, ...args, (err, bytesWritten, buffer2) => {
        if (err)
          return reject(err);
        resolve({ bytesWritten, buffer: buffer2 });
      });
    });
  };
  exports.readv = function(fd, buffers, ...args) {
    if (typeof args[args.length - 1] === "function") {
      return fs.readv(fd, buffers, ...args);
    }
    return new Promise((resolve, reject) => {
      fs.readv(fd, buffers, ...args, (err, bytesRead, buffers2) => {
        if (err)
          return reject(err);
        resolve({ bytesRead, buffers: buffers2 });
      });
    });
  };
  exports.writev = function(fd, buffers, ...args) {
    if (typeof args[args.length - 1] === "function") {
      return fs.writev(fd, buffers, ...args);
    }
    return new Promise((resolve, reject) => {
      fs.writev(fd, buffers, ...args, (err, bytesWritten, buffers2) => {
        if (err)
          return reject(err);
        resolve({ bytesWritten, buffers: buffers2 });
      });
    });
  };
  if (typeof fs.realpath.native === "function") {
    exports.realpath.native = u(fs.realpath.native);
  } else {
    process.emitWarning("fs.realpath.native is not a function. Is fs being monkey-patched?", "Warning", "fs-extra-WARN0003");
  }
});

// node_modules/fs-extra/lib/mkdirs/utils.js
var require_utils = __commonJS((exports, module) => {
  var path = __require("path");
  exports.checkPath = function checkPath(pth) {
    if (process.platform === "win32") {
      const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path.parse(pth).root, ""));
      if (pathHasInvalidWinCharacters) {
        const error = new Error(`Path contains invalid characters: ${pth}`);
        error.code = "EINVAL";
        throw error;
      }
    }
  };
});

// node_modules/fs-extra/lib/mkdirs/make-dir.js
var require_make_dir = __commonJS((exports, module) => {
  var fs = require_fs();
  var { checkPath } = require_utils();
  var getMode = (options) => {
    const defaults = { mode: 511 };
    if (typeof options === "number")
      return options;
    return { ...defaults, ...options }.mode;
  };
  exports.makeDir = async (dir, options) => {
    checkPath(dir);
    return fs.mkdir(dir, {
      mode: getMode(options),
      recursive: true
    });
  };
  exports.makeDirSync = (dir, options) => {
    checkPath(dir);
    return fs.mkdirSync(dir, {
      mode: getMode(options),
      recursive: true
    });
  };
});

// node_modules/fs-extra/lib/mkdirs/index.js
var require_mkdirs = __commonJS((exports, module) => {
  var u = require_universalify().fromPromise;
  var { makeDir: _makeDir, makeDirSync } = require_make_dir();
  var makeDir = u(_makeDir);
  module.exports = {
    mkdirs: makeDir,
    mkdirsSync: makeDirSync,
    mkdirp: makeDir,
    mkdirpSync: makeDirSync,
    ensureDir: makeDir,
    ensureDirSync: makeDirSync
  };
});

// node_modules/fs-extra/lib/path-exists/index.js
var require_path_exists = __commonJS((exports, module) => {
  var u = require_universalify().fromPromise;
  var fs = require_fs();
  function pathExists(path) {
    return fs.access(path).then(() => true).catch(() => false);
  }
  module.exports = {
    pathExists: u(pathExists),
    pathExistsSync: fs.existsSync
  };
});

// node_modules/fs-extra/lib/util/utimes.js
var require_utimes = __commonJS((exports, module) => {
  var fs = require_fs();
  var u = require_universalify().fromPromise;
  async function utimesMillis(path, atime, mtime) {
    const fd = await fs.open(path, "r+");
    let closeErr = null;
    try {
      await fs.futimes(fd, atime, mtime);
    } finally {
      try {
        await fs.close(fd);
      } catch (e) {
        closeErr = e;
      }
    }
    if (closeErr) {
      throw closeErr;
    }
  }
  function utimesMillisSync(path, atime, mtime) {
    const fd = fs.openSync(path, "r+");
    fs.futimesSync(fd, atime, mtime);
    return fs.closeSync(fd);
  }
  module.exports = {
    utimesMillis: u(utimesMillis),
    utimesMillisSync
  };
});

// node_modules/fs-extra/lib/util/stat.js
var require_stat = __commonJS((exports, module) => {
  var fs = require_fs();
  var path = __require("path");
  var u = require_universalify().fromPromise;
  function getStats(src, dest, opts) {
    const statFunc = opts.dereference ? (file) => fs.stat(file, { bigint: true }) : (file) => fs.lstat(file, { bigint: true });
    return Promise.all([
      statFunc(src),
      statFunc(dest).catch((err) => {
        if (err.code === "ENOENT")
          return null;
        throw err;
      })
    ]).then(([srcStat, destStat]) => ({ srcStat, destStat }));
  }
  function getStatsSync(src, dest, opts) {
    let destStat;
    const statFunc = opts.dereference ? (file) => fs.statSync(file, { bigint: true }) : (file) => fs.lstatSync(file, { bigint: true });
    const srcStat = statFunc(src);
    try {
      destStat = statFunc(dest);
    } catch (err) {
      if (err.code === "ENOENT")
        return { srcStat, destStat: null };
      throw err;
    }
    return { srcStat, destStat };
  }
  async function checkPaths(src, dest, funcName, opts) {
    const { srcStat, destStat } = await getStats(src, dest, opts);
    if (destStat) {
      if (areIdentical(srcStat, destStat)) {
        const srcBaseName = path.basename(src);
        const destBaseName = path.basename(dest);
        if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
          return { srcStat, destStat, isChangingCase: true };
        }
        throw new Error("Source and destination must not be the same.");
      }
      if (srcStat.isDirectory() && !destStat.isDirectory()) {
        throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
      }
      if (!srcStat.isDirectory() && destStat.isDirectory()) {
        throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
      }
    }
    if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
      throw new Error(errMsg(src, dest, funcName));
    }
    return { srcStat, destStat };
  }
  function checkPathsSync(src, dest, funcName, opts) {
    const { srcStat, destStat } = getStatsSync(src, dest, opts);
    if (destStat) {
      if (areIdentical(srcStat, destStat)) {
        const srcBaseName = path.basename(src);
        const destBaseName = path.basename(dest);
        if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) {
          return { srcStat, destStat, isChangingCase: true };
        }
        throw new Error("Source and destination must not be the same.");
      }
      if (srcStat.isDirectory() && !destStat.isDirectory()) {
        throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
      }
      if (!srcStat.isDirectory() && destStat.isDirectory()) {
        throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
      }
    }
    if (srcStat.isDirectory() && isSrcSubdir(src, dest)) {
      throw new Error(errMsg(src, dest, funcName));
    }
    return { srcStat, destStat };
  }
  async function checkParentPaths(src, srcStat, dest, funcName) {
    const srcParent = path.resolve(path.dirname(src));
    const destParent = path.resolve(path.dirname(dest));
    if (destParent === srcParent || destParent === path.parse(destParent).root)
      return;
    let destStat;
    try {
      destStat = await fs.stat(destParent, { bigint: true });
    } catch (err) {
      if (err.code === "ENOENT")
        return;
      throw err;
    }
    if (areIdentical(srcStat, destStat)) {
      throw new Error(errMsg(src, dest, funcName));
    }
    return checkParentPaths(src, srcStat, destParent, funcName);
  }
  function checkParentPathsSync(src, srcStat, dest, funcName) {
    const srcParent = path.resolve(path.dirname(src));
    const destParent = path.resolve(path.dirname(dest));
    if (destParent === srcParent || destParent === path.parse(destParent).root)
      return;
    let destStat;
    try {
      destStat = fs.statSync(destParent, { bigint: true });
    } catch (err) {
      if (err.code === "ENOENT")
        return;
      throw err;
    }
    if (areIdentical(srcStat, destStat)) {
      throw new Error(errMsg(src, dest, funcName));
    }
    return checkParentPathsSync(src, srcStat, destParent, funcName);
  }
  function areIdentical(srcStat, destStat) {
    return destStat.ino && destStat.dev && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev;
  }
  function isSrcSubdir(src, dest) {
    const srcArr = path.resolve(src).split(path.sep).filter((i) => i);
    const destArr = path.resolve(dest).split(path.sep).filter((i) => i);
    return srcArr.every((cur, i) => destArr[i] === cur);
  }
  function errMsg(src, dest, funcName) {
    return `Cannot ${funcName} '${src}' to a subdirectory of itself, '${dest}'.`;
  }
  module.exports = {
    checkPaths: u(checkPaths),
    checkPathsSync,
    checkParentPaths: u(checkParentPaths),
    checkParentPathsSync,
    isSrcSubdir,
    areIdentical
  };
});

// node_modules/fs-extra/lib/copy/copy.js
var require_copy = __commonJS((exports, module) => {
  var fs = require_fs();
  var path = __require("path");
  var { mkdirs } = require_mkdirs();
  var { pathExists } = require_path_exists();
  var { utimesMillis } = require_utimes();
  var stat = require_stat();
  async function copy(src, dest, opts = {}) {
    if (typeof opts === "function") {
      opts = { filter: opts };
    }
    opts.clobber = "clobber" in opts ? !!opts.clobber : true;
    opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
    if (opts.preserveTimestamps && process.arch === "ia32") {
      process.emitWarning(`Using the preserveTimestamps option in 32-bit node is not recommended;

` + "\tsee https://github.com/jprichardson/node-fs-extra/issues/269", "Warning", "fs-extra-WARN0001");
    }
    const { srcStat, destStat } = await stat.checkPaths(src, dest, "copy", opts);
    await stat.checkParentPaths(src, srcStat, dest, "copy");
    const include = await runFilter(src, dest, opts);
    if (!include)
      return;
    const destParent = path.dirname(dest);
    const dirExists = await pathExists(destParent);
    if (!dirExists) {
      await mkdirs(destParent);
    }
    await getStatsAndPerformCopy(destStat, src, dest, opts);
  }
  async function runFilter(src, dest, opts) {
    if (!opts.filter)
      return true;
    return opts.filter(src, dest);
  }
  async function getStatsAndPerformCopy(destStat, src, dest, opts) {
    const statFn = opts.dereference ? fs.stat : fs.lstat;
    const srcStat = await statFn(src);
    if (srcStat.isDirectory())
      return onDir(srcStat, destStat, src, dest, opts);
    if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice())
      return onFile(srcStat, destStat, src, dest, opts);
    if (srcStat.isSymbolicLink())
      return onLink(destStat, src, dest, opts);
    if (srcStat.isSocket())
      throw new Error(`Cannot copy a socket file: ${src}`);
    if (srcStat.isFIFO())
      throw new Error(`Cannot copy a FIFO pipe: ${src}`);
    throw new Error(`Unknown file: ${src}`);
  }
  async function onFile(srcStat, destStat, src, dest, opts) {
    if (!destStat)
      return copyFile(srcStat, src, dest, opts);
    if (opts.overwrite) {
      await fs.unlink(dest);
      return copyFile(srcStat, src, dest, opts);
    }
    if (opts.errorOnExist) {
      throw new Error(`'${dest}' already exists`);
    }
  }
  async function copyFile(srcStat, src, dest, opts) {
    await fs.copyFile(src, dest);
    if (opts.preserveTimestamps) {
      if (fileIsNotWritable(srcStat.mode)) {
        await makeFileWritable(dest, srcStat.mode);
      }
      const updatedSrcStat = await fs.stat(src);
      await utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
    }
    return fs.chmod(dest, srcStat.mode);
  }
  function fileIsNotWritable(srcMode) {
    return (srcMode & 128) === 0;
  }
  function makeFileWritable(dest, srcMode) {
    return fs.chmod(dest, srcMode | 128);
  }
  async function onDir(srcStat, destStat, src, dest, opts) {
    if (!destStat) {
      await fs.mkdir(dest);
    }
    const promises = [];
    for await (const item of await fs.opendir(src)) {
      const srcItem = path.join(src, item.name);
      const destItem = path.join(dest, item.name);
      promises.push(runFilter(srcItem, destItem, opts).then((include) => {
        if (include) {
          return stat.checkPaths(srcItem, destItem, "copy", opts).then(({ destStat: destStat2 }) => {
            return getStatsAndPerformCopy(destStat2, srcItem, destItem, opts);
          });
        }
      }));
    }
    await Promise.all(promises);
    if (!destStat) {
      await fs.chmod(dest, srcStat.mode);
    }
  }
  async function onLink(destStat, src, dest, opts) {
    let resolvedSrc = await fs.readlink(src);
    if (opts.dereference) {
      resolvedSrc = path.resolve(process.cwd(), resolvedSrc);
    }
    if (!destStat) {
      return fs.symlink(resolvedSrc, dest);
    }
    let resolvedDest = null;
    try {
      resolvedDest = await fs.readlink(dest);
    } catch (e) {
      if (e.code === "EINVAL" || e.code === "UNKNOWN")
        return fs.symlink(resolvedSrc, dest);
      throw e;
    }
    if (opts.dereference) {
      resolvedDest = path.resolve(process.cwd(), resolvedDest);
    }
    if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
      throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
    }
    if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
      throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
    }
    await fs.unlink(dest);
    return fs.symlink(resolvedSrc, dest);
  }
  module.exports = copy;
});

// node_modules/fs-extra/lib/copy/copy-sync.js
var require_copy_sync = __commonJS((exports, module) => {
  var fs = require_graceful_fs();
  var path = __require("path");
  var mkdirsSync = require_mkdirs().mkdirsSync;
  var utimesMillisSync = require_utimes().utimesMillisSync;
  var stat = require_stat();
  function copySync(src, dest, opts) {
    if (typeof opts === "function") {
      opts = { filter: opts };
    }
    opts = opts || {};
    opts.clobber = "clobber" in opts ? !!opts.clobber : true;
    opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
    if (opts.preserveTimestamps && process.arch === "ia32") {
      process.emitWarning(`Using the preserveTimestamps option in 32-bit node is not recommended;

` + "\tsee https://github.com/jprichardson/node-fs-extra/issues/269", "Warning", "fs-extra-WARN0002");
    }
    const { srcStat, destStat } = stat.checkPathsSync(src, dest, "copy", opts);
    stat.checkParentPathsSync(src, srcStat, dest, "copy");
    if (opts.filter && !opts.filter(src, dest))
      return;
    const destParent = path.dirname(dest);
    if (!fs.existsSync(destParent))
      mkdirsSync(destParent);
    return getStats(destStat, src, dest, opts);
  }
  function getStats(destStat, src, dest, opts) {
    const statSync = opts.dereference ? fs.statSync : fs.lstatSync;
    const srcStat = statSync(src);
    if (srcStat.isDirectory())
      return onDir(srcStat, destStat, src, dest, opts);
    else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice())
      return onFile(srcStat, destStat, src, dest, opts);
    else if (srcStat.isSymbolicLink())
      return onLink(destStat, src, dest, opts);
    else if (srcStat.isSocket())
      throw new Error(`Cannot copy a socket file: ${src}`);
    else if (srcStat.isFIFO())
      throw new Error(`Cannot copy a FIFO pipe: ${src}`);
    throw new Error(`Unknown file: ${src}`);
  }
  function onFile(srcStat, destStat, src, dest, opts) {
    if (!destStat)
      return copyFile(srcStat, src, dest, opts);
    return mayCopyFile(srcStat, src, dest, opts);
  }
  function mayCopyFile(srcStat, src, dest, opts) {
    if (opts.overwrite) {
      fs.unlinkSync(dest);
      return copyFile(srcStat, src, dest, opts);
    } else if (opts.errorOnExist) {
      throw new Error(`'${dest}' already exists`);
    }
  }
  function copyFile(srcStat, src, dest, opts) {
    fs.copyFileSync(src, dest);
    if (opts.preserveTimestamps)
      handleTimestamps(srcStat.mode, src, dest);
    return setDestMode(dest, srcStat.mode);
  }
  function handleTimestamps(srcMode, src, dest) {
    if (fileIsNotWritable(srcMode))
      makeFileWritable(dest, srcMode);
    return setDestTimestamps(src, dest);
  }
  function fileIsNotWritable(srcMode) {
    return (srcMode & 128) === 0;
  }
  function makeFileWritable(dest, srcMode) {
    return setDestMode(dest, srcMode | 128);
  }
  function setDestMode(dest, srcMode) {
    return fs.chmodSync(dest, srcMode);
  }
  function setDestTimestamps(src, dest) {
    const updatedSrcStat = fs.statSync(src);
    return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
  }
  function onDir(srcStat, destStat, src, dest, opts) {
    if (!destStat)
      return mkDirAndCopy(srcStat.mode, src, dest, opts);
    return copyDir(src, dest, opts);
  }
  function mkDirAndCopy(srcMode, src, dest, opts) {
    fs.mkdirSync(dest);
    copyDir(src, dest, opts);
    return setDestMode(dest, srcMode);
  }
  function copyDir(src, dest, opts) {
    const dir = fs.opendirSync(src);
    try {
      let dirent;
      while ((dirent = dir.readSync()) !== null) {
        copyDirItem(dirent.name, src, dest, opts);
      }
    } finally {
      dir.closeSync();
    }
  }
  function copyDirItem(item, src, dest, opts) {
    const srcItem = path.join(src, item);
    const destItem = path.join(dest, item);
    if (opts.filter && !opts.filter(srcItem, destItem))
      return;
    const { destStat } = stat.checkPathsSync(srcItem, destItem, "copy", opts);
    return getStats(destStat, srcItem, destItem, opts);
  }
  function onLink(destStat, src, dest, opts) {
    let resolvedSrc = fs.readlinkSync(src);
    if (opts.dereference) {
      resolvedSrc = path.resolve(process.cwd(), resolvedSrc);
    }
    if (!destStat) {
      return fs.symlinkSync(resolvedSrc, dest);
    } else {
      let resolvedDest;
      try {
        resolvedDest = fs.readlinkSync(dest);
      } catch (err) {
        if (err.code === "EINVAL" || err.code === "UNKNOWN")
          return fs.symlinkSync(resolvedSrc, dest);
        throw err;
      }
      if (opts.dereference) {
        resolvedDest = path.resolve(process.cwd(), resolvedDest);
      }
      if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) {
        throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
      }
      if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) {
        throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
      }
      return copyLink(resolvedSrc, dest);
    }
  }
  function copyLink(resolvedSrc, dest) {
    fs.unlinkSync(dest);
    return fs.symlinkSync(resolvedSrc, dest);
  }
  module.exports = copySync;
});

// node_modules/fs-extra/lib/copy/index.js
var require_copy2 = __commonJS((exports, module) => {
  var u = require_universalify().fromPromise;
  module.exports = {
    copy: u(require_copy()),
    copySync: require_copy_sync()
  };
});

// node_modules/fs-extra/lib/remove/index.js
var require_remove = __commonJS((exports, module) => {
  var fs = require_graceful_fs();
  var u = require_universalify().fromCallback;
  function remove(path, callback) {
    fs.rm(path, { recursive: true, force: true }, callback);
  }
  function removeSync(path) {
    fs.rmSync(path, { recursive: true, force: true });
  }
  module.exports = {
    remove: u(remove),
    removeSync
  };
});

// node_modules/fs-extra/lib/empty/index.js
var require_empty = __commonJS((exports, module) => {
  var u = require_universalify().fromPromise;
  var fs = require_fs();
  var path = __require("path");
  var mkdir = require_mkdirs();
  var remove = require_remove();
  var emptyDir = u(async function emptyDir(dir) {
    let items;
    try {
      items = await fs.readdir(dir);
    } catch {
      return mkdir.mkdirs(dir);
    }
    return Promise.all(items.map((item) => remove.remove(path.join(dir, item))));
  });
  function emptyDirSync(dir) {
    let items;
    try {
      items = fs.readdirSync(dir);
    } catch {
      return mkdir.mkdirsSync(dir);
    }
    items.forEach((item) => {
      item = path.join(dir, item);
      remove.removeSync(item);
    });
  }
  module.exports = {
    emptyDirSync,
    emptydirSync: emptyDirSync,
    emptyDir,
    emptydir: emptyDir
  };
});

// node_modules/fs-extra/lib/ensure/file.js
var require_file = __commonJS((exports, module) => {
  var u = require_universalify().fromPromise;
  var path = __require("path");
  var fs = require_fs();
  var mkdir = require_mkdirs();
  async function createFile(file) {
    let stats;
    try {
      stats = await fs.stat(file);
    } catch {
    }
    if (stats && stats.isFile())
      return;
    const dir = path.dirname(file);
    let dirStats = null;
    try {
      dirStats = await fs.stat(dir);
    } catch (err) {
      if (err.code === "ENOENT") {
        await mkdir.mkdirs(dir);
        await fs.writeFile(file, "");
        return;
      } else {
        throw err;
      }
    }
    if (dirStats.isDirectory()) {
      await fs.writeFile(file, "");
    } else {
      await fs.readdir(dir);
    }
  }
  function createFileSync(file) {
    let stats;
    try {
      stats = fs.statSync(file);
    } catch {
    }
    if (stats && stats.isFile())
      return;
    const dir = path.dirname(file);
    try {
      if (!fs.statSync(dir).isDirectory()) {
        fs.readdirSync(dir);
      }
    } catch (err) {
      if (err && err.code === "ENOENT")
        mkdir.mkdirsSync(dir);
      else
        throw err;
    }
    fs.writeFileSync(file, "");
  }
  module.exports = {
    createFile: u(createFile),
    createFileSync
  };
});

// node_modules/fs-extra/lib/ensure/link.js
var require_link = __commonJS((exports, module) => {
  var u = require_universalify().fromPromise;
  var path = __require("path");
  var fs = require_fs();
  var mkdir = require_mkdirs();
  var { pathExists } = require_path_exists();
  var { areIdentical } = require_stat();
  async function createLink(srcpath, dstpath) {
    let dstStat;
    try {
      dstStat = await fs.lstat(dstpath);
    } catch {
    }
    let srcStat;
    try {
      srcStat = await fs.lstat(srcpath);
    } catch (err) {
      err.message = err.message.replace("lstat", "ensureLink");
      throw err;
    }
    if (dstStat && areIdentical(srcStat, dstStat))
      return;
    const dir = path.dirname(dstpath);
    const dirExists = await pathExists(dir);
    if (!dirExists) {
      await mkdir.mkdirs(dir);
    }
    await fs.link(srcpath, dstpath);
  }
  function createLinkSync(srcpath, dstpath) {
    let dstStat;
    try {
      dstStat = fs.lstatSync(dstpath);
    } catch {
    }
    try {
      const srcStat = fs.lstatSync(srcpath);
      if (dstStat && areIdentical(srcStat, dstStat))
        return;
    } catch (err) {
      err.message = err.message.replace("lstat", "ensureLink");
      throw err;
    }
    const dir = path.dirname(dstpath);
    const dirExists = fs.existsSync(dir);
    if (dirExists)
      return fs.linkSync(srcpath, dstpath);
    mkdir.mkdirsSync(dir);
    return fs.linkSync(srcpath, dstpath);
  }
  module.exports = {
    createLink: u(createLink),
    createLinkSync
  };
});

// node_modules/fs-extra/lib/ensure/symlink-paths.js
var require_symlink_paths = __commonJS((exports, module) => {
  var path = __require("path");
  var fs = require_fs();
  var { pathExists } = require_path_exists();
  var u = require_universalify().fromPromise;
  async function symlinkPaths(srcpath, dstpath) {
    if (path.isAbsolute(srcpath)) {
      try {
        await fs.lstat(srcpath);
      } catch (err) {
        err.message = err.message.replace("lstat", "ensureSymlink");
        throw err;
      }
      return {
        toCwd: srcpath,
        toDst: srcpath
      };
    }
    const dstdir = path.dirname(dstpath);
    const relativeToDst = path.join(dstdir, srcpath);
    const exists = await pathExists(relativeToDst);
    if (exists) {
      return {
        toCwd: relativeToDst,
        toDst: srcpath
      };
    }
    try {
      await fs.lstat(srcpath);
    } catch (err) {
      err.message = err.message.replace("lstat", "ensureSymlink");
      throw err;
    }
    return {
      toCwd: srcpath,
      toDst: path.relative(dstdir, srcpath)
    };
  }
  function symlinkPathsSync(srcpath, dstpath) {
    if (path.isAbsolute(srcpath)) {
      const exists2 = fs.existsSync(srcpath);
      if (!exists2)
        throw new Error("absolute srcpath does not exist");
      return {
        toCwd: srcpath,
        toDst: srcpath
      };
    }
    const dstdir = path.dirname(dstpath);
    const relativeToDst = path.join(dstdir, srcpath);
    const exists = fs.existsSync(relativeToDst);
    if (exists) {
      return {
        toCwd: relativeToDst,
        toDst: srcpath
      };
    }
    const srcExists = fs.existsSync(srcpath);
    if (!srcExists)
      throw new Error("relative srcpath does not exist");
    return {
      toCwd: srcpath,
      toDst: path.relative(dstdir, srcpath)
    };
  }
  module.exports = {
    symlinkPaths: u(symlinkPaths),
    symlinkPathsSync
  };
});

// node_modules/fs-extra/lib/ensure/symlink-type.js
var require_symlink_type = __commonJS((exports, module) => {
  var fs = require_fs();
  var u = require_universalify().fromPromise;
  async function symlinkType(srcpath, type) {
    if (type)
      return type;
    let stats;
    try {
      stats = await fs.lstat(srcpath);
    } catch {
      return "file";
    }
    return stats && stats.isDirectory() ? "dir" : "file";
  }
  function symlinkTypeSync(srcpath, type) {
    if (type)
      return type;
    let stats;
    try {
      stats = fs.lstatSync(srcpath);
    } catch {
      return "file";
    }
    return stats && stats.isDirectory() ? "dir" : "file";
  }
  module.exports = {
    symlinkType: u(symlinkType),
    symlinkTypeSync
  };
});

// node_modules/fs-extra/lib/ensure/symlink.js
var require_symlink = __commonJS((exports, module) => {
  var u = require_universalify().fromPromise;
  var path = __require("path");
  var fs = require_fs();
  var { mkdirs, mkdirsSync } = require_mkdirs();
  var { symlinkPaths, symlinkPathsSync } = require_symlink_paths();
  var { symlinkType, symlinkTypeSync } = require_symlink_type();
  var { pathExists } = require_path_exists();
  var { areIdentical } = require_stat();
  async function createSymlink(srcpath, dstpath, type) {
    let stats;
    try {
      stats = await fs.lstat(dstpath);
    } catch {
    }
    if (stats && stats.isSymbolicLink()) {
      const [srcStat, dstStat] = await Promise.all([
        fs.stat(srcpath),
        fs.stat(dstpath)
      ]);
      if (areIdentical(srcStat, dstStat))
        return;
    }
    const relative = await symlinkPaths(srcpath, dstpath);
    srcpath = relative.toDst;
    const toType = await symlinkType(relative.toCwd, type);
    const dir = path.dirname(dstpath);
    if (!await pathExists(dir)) {
      await mkdirs(dir);
    }
    return fs.symlink(srcpath, dstpath, toType);
  }
  function createSymlinkSync(srcpath, dstpath, type) {
    let stats;
    try {
      stats = fs.lstatSync(dstpath);
    } catch {
    }
    if (stats && stats.isSymbolicLink()) {
      const srcStat = fs.statSync(srcpath);
      const dstStat = fs.statSync(dstpath);
      if (areIdentical(srcStat, dstStat))
        return;
    }
    const relative = symlinkPathsSync(srcpath, dstpath);
    srcpath = relative.toDst;
    type = symlinkTypeSync(relative.toCwd, type);
    const dir = path.dirname(dstpath);
    const exists = fs.existsSync(dir);
    if (exists)
      return fs.symlinkSync(srcpath, dstpath, type);
    mkdirsSync(dir);
    return fs.symlinkSync(srcpath, dstpath, type);
  }
  module.exports = {
    createSymlink: u(createSymlink),
    createSymlinkSync
  };
});

// node_modules/fs-extra/lib/ensure/index.js
var require_ensure = __commonJS((exports, module) => {
  var { createFile, createFileSync } = require_file();
  var { createLink, createLinkSync } = require_link();
  var { createSymlink, createSymlinkSync } = require_symlink();
  module.exports = {
    createFile,
    createFileSync,
    ensureFile: createFile,
    ensureFileSync: createFileSync,
    createLink,
    createLinkSync,
    ensureLink: createLink,
    ensureLinkSync: createLinkSync,
    createSymlink,
    createSymlinkSync,
    ensureSymlink: createSymlink,
    ensureSymlinkSync: createSymlinkSync
  };
});

// node_modules/jsonfile/utils.js
var require_utils2 = __commonJS((exports, module) => {
  function stringify(obj, { EOL = `
`, finalEOL = true, replacer = null, spaces } = {}) {
    const EOF = finalEOL ? EOL : "";
    const str = JSON.stringify(obj, replacer, spaces);
    return str.replace(/\n/g, EOL) + EOF;
  }
  function stripBom(content) {
    if (Buffer.isBuffer(content))
      content = content.toString("utf8");
    return content.replace(/^\uFEFF/, "");
  }
  module.exports = { stringify, stripBom };
});

// node_modules/jsonfile/index.js
var require_jsonfile = __commonJS((exports, module) => {
  var _fs;
  try {
    _fs = require_graceful_fs();
  } catch (_) {
    _fs = __require("fs");
  }
  var universalify = require_universalify();
  var { stringify, stripBom } = require_utils2();
  async function _readFile(file, options = {}) {
    if (typeof options === "string") {
      options = { encoding: options };
    }
    const fs = options.fs || _fs;
    const shouldThrow = "throws" in options ? options.throws : true;
    let data = await universalify.fromCallback(fs.readFile)(file, options);
    data = stripBom(data);
    let obj;
    try {
      obj = JSON.parse(data, options ? options.reviver : null);
    } catch (err) {
      if (shouldThrow) {
        err.message = `${file}: ${err.message}`;
        throw err;
      } else {
        return null;
      }
    }
    return obj;
  }
  var readFile = universalify.fromPromise(_readFile);
  function readFileSync(file, options = {}) {
    if (typeof options === "string") {
      options = { encoding: options };
    }
    const fs = options.fs || _fs;
    const shouldThrow = "throws" in options ? options.throws : true;
    try {
      let content = fs.readFileSync(file, options);
      content = stripBom(content);
      return JSON.parse(content, options.reviver);
    } catch (err) {
      if (shouldThrow) {
        err.message = `${file}: ${err.message}`;
        throw err;
      } else {
        return null;
      }
    }
  }
  async function _writeFile(file, obj, options = {}) {
    const fs = options.fs || _fs;
    const str = stringify(obj, options);
    await universalify.fromCallback(fs.writeFile)(file, str, options);
  }
  var writeFile = universalify.fromPromise(_writeFile);
  function writeFileSync(file, obj, options = {}) {
    const fs = options.fs || _fs;
    const str = stringify(obj, options);
    return fs.writeFileSync(file, str, options);
  }
  var jsonfile = {
    readFile,
    readFileSync,
    writeFile,
    writeFileSync
  };
  module.exports = jsonfile;
});

// node_modules/fs-extra/lib/json/jsonfile.js
var require_jsonfile2 = __commonJS((exports, module) => {
  var jsonFile = require_jsonfile();
  module.exports = {
    readJson: jsonFile.readFile,
    readJsonSync: jsonFile.readFileSync,
    writeJson: jsonFile.writeFile,
    writeJsonSync: jsonFile.writeFileSync
  };
});

// node_modules/fs-extra/lib/output-file/index.js
var require_output_file = __commonJS((exports, module) => {
  var u = require_universalify().fromPromise;
  var fs = require_fs();
  var path = __require("path");
  var mkdir = require_mkdirs();
  var pathExists = require_path_exists().pathExists;
  async function outputFile(file, data, encoding = "utf-8") {
    const dir = path.dirname(file);
    if (!await pathExists(dir)) {
      await mkdir.mkdirs(dir);
    }
    return fs.writeFile(file, data, encoding);
  }
  function outputFileSync(file, ...args) {
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) {
      mkdir.mkdirsSync(dir);
    }
    fs.writeFileSync(file, ...args);
  }
  module.exports = {
    outputFile: u(outputFile),
    outputFileSync
  };
});

// node_modules/fs-extra/lib/json/output-json.js
var require_output_json = __commonJS((exports, module) => {
  var { stringify } = require_utils2();
  var { outputFile } = require_output_file();
  async function outputJson(file, data, options = {}) {
    const str = stringify(data, options);
    await outputFile(file, str, options);
  }
  module.exports = outputJson;
});

// node_modules/fs-extra/lib/json/output-json-sync.js
var require_output_json_sync = __commonJS((exports, module) => {
  var { stringify } = require_utils2();
  var { outputFileSync } = require_output_file();
  function outputJsonSync(file, data, options) {
    const str = stringify(data, options);
    outputFileSync(file, str, options);
  }
  module.exports = outputJsonSync;
});

// node_modules/fs-extra/lib/json/index.js
var require_json = __commonJS((exports, module) => {
  var u = require_universalify().fromPromise;
  var jsonFile = require_jsonfile2();
  jsonFile.outputJson = u(require_output_json());
  jsonFile.outputJsonSync = require_output_json_sync();
  jsonFile.outputJSON = jsonFile.outputJson;
  jsonFile.outputJSONSync = jsonFile.outputJsonSync;
  jsonFile.writeJSON = jsonFile.writeJson;
  jsonFile.writeJSONSync = jsonFile.writeJsonSync;
  jsonFile.readJSON = jsonFile.readJson;
  jsonFile.readJSONSync = jsonFile.readJsonSync;
  module.exports = jsonFile;
});

// node_modules/fs-extra/lib/move/move.js
var require_move = __commonJS((exports, module) => {
  var fs = require_fs();
  var path = __require("path");
  var { copy } = require_copy2();
  var { remove } = require_remove();
  var { mkdirp } = require_mkdirs();
  var { pathExists } = require_path_exists();
  var stat = require_stat();
  async function move(src, dest, opts = {}) {
    const overwrite = opts.overwrite || opts.clobber || false;
    const { srcStat, isChangingCase = false } = await stat.checkPaths(src, dest, "move", opts);
    await stat.checkParentPaths(src, srcStat, dest, "move");
    const destParent = path.dirname(dest);
    const parsedParentPath = path.parse(destParent);
    if (parsedParentPath.root !== destParent) {
      await mkdirp(destParent);
    }
    return doRename(src, dest, overwrite, isChangingCase);
  }
  async function doRename(src, dest, overwrite, isChangingCase) {
    if (!isChangingCase) {
      if (overwrite) {
        await remove(dest);
      } else if (await pathExists(dest)) {
        throw new Error("dest already exists.");
      }
    }
    try {
      await fs.rename(src, dest);
    } catch (err) {
      if (err.code !== "EXDEV") {
        throw err;
      }
      await moveAcrossDevice(src, dest, overwrite);
    }
  }
  async function moveAcrossDevice(src, dest, overwrite) {
    const opts = {
      overwrite,
      errorOnExist: true,
      preserveTimestamps: true
    };
    await copy(src, dest, opts);
    return remove(src);
  }
  module.exports = move;
});

// node_modules/fs-extra/lib/move/move-sync.js
var require_move_sync = __commonJS((exports, module) => {
  var fs = require_graceful_fs();
  var path = __require("path");
  var copySync = require_copy2().copySync;
  var removeSync = require_remove().removeSync;
  var mkdirpSync = require_mkdirs().mkdirpSync;
  var stat = require_stat();
  function moveSync(src, dest, opts) {
    opts = opts || {};
    const overwrite = opts.overwrite || opts.clobber || false;
    const { srcStat, isChangingCase = false } = stat.checkPathsSync(src, dest, "move", opts);
    stat.checkParentPathsSync(src, srcStat, dest, "move");
    if (!isParentRoot(dest))
      mkdirpSync(path.dirname(dest));
    return doRename(src, dest, overwrite, isChangingCase);
  }
  function isParentRoot(dest) {
    const parent = path.dirname(dest);
    const parsedPath = path.parse(parent);
    return parsedPath.root === parent;
  }
  function doRename(src, dest, overwrite, isChangingCase) {
    if (isChangingCase)
      return rename(src, dest, overwrite);
    if (overwrite) {
      removeSync(dest);
      return rename(src, dest, overwrite);
    }
    if (fs.existsSync(dest))
      throw new Error("dest already exists.");
    return rename(src, dest, overwrite);
  }
  function rename(src, dest, overwrite) {
    try {
      fs.renameSync(src, dest);
    } catch (err) {
      if (err.code !== "EXDEV")
        throw err;
      return moveAcrossDevice(src, dest, overwrite);
    }
  }
  function moveAcrossDevice(src, dest, overwrite) {
    const opts = {
      overwrite,
      errorOnExist: true,
      preserveTimestamps: true
    };
    copySync(src, dest, opts);
    return removeSync(src);
  }
  module.exports = moveSync;
});

// node_modules/fs-extra/lib/move/index.js
var require_move2 = __commonJS((exports, module) => {
  var u = require_universalify().fromPromise;
  module.exports = {
    move: u(require_move()),
    moveSync: require_move_sync()
  };
});

// node_modules/fs-extra/lib/index.js
var require_lib = __commonJS((exports, module) => {
  module.exports = {
    ...require_fs(),
    ...require_copy2(),
    ...require_empty(),
    ...require_ensure(),
    ...require_json(),
    ...require_mkdirs(),
    ...require_move2(),
    ...require_output_file(),
    ...require_path_exists(),
    ...require_remove()
  };
});

// node_modules/cli-spinners/spinners.json
var require_spinners = __commonJS((exports, module) => {
  module.exports = {
    dots: {
      interval: 80,
      frames: [
        "⠋",
        "⠙",
        "⠹",
        "⠸",
        "⠼",
        "⠴",
        "⠦",
        "⠧",
        "⠇",
        "⠏"
      ]
    },
    dots2: {
      interval: 80,
      frames: [
        "⣾",
        "⣽",
        "⣻",
        "⢿",
        "⡿",
        "⣟",
        "⣯",
        "⣷"
      ]
    },
    dots3: {
      interval: 80,
      frames: [
        "⠋",
        "⠙",
        "⠚",
        "⠞",
        "⠖",
        "⠦",
        "⠴",
        "⠲",
        "⠳",
        "⠓"
      ]
    },
    dots4: {
      interval: 80,
      frames: [
        "⠄",
        "⠆",
        "⠇",
        "⠋",
        "⠙",
        "⠸",
        "⠰",
        "⠠",
        "⠰",
        "⠸",
        "⠙",
        "⠋",
        "⠇",
        "⠆"
      ]
    },
    dots5: {
      interval: 80,
      frames: [
        "⠋",
        "⠙",
        "⠚",
        "⠒",
        "⠂",
        "⠂",
        "⠒",
        "⠲",
        "⠴",
        "⠦",
        "⠖",
        "⠒",
        "⠐",
        "⠐",
        "⠒",
        "⠓",
        "⠋"
      ]
    },
    dots6: {
      interval: 80,
      frames: [
        "⠁",
        "⠉",
        "⠙",
        "⠚",
        "⠒",
        "⠂",
        "⠂",
        "⠒",
        "⠲",
        "⠴",
        "⠤",
        "⠄",
        "⠄",
        "⠤",
        "⠴",
        "⠲",
        "⠒",
        "⠂",
        "⠂",
        "⠒",
        "⠚",
        "⠙",
        "⠉",
        "⠁"
      ]
    },
    dots7: {
      interval: 80,
      frames: [
        "⠈",
        "⠉",
        "⠋",
        "⠓",
        "⠒",
        "⠐",
        "⠐",
        "⠒",
        "⠖",
        "⠦",
        "⠤",
        "⠠",
        "⠠",
        "⠤",
        "⠦",
        "⠖",
        "⠒",
        "⠐",
        "⠐",
        "⠒",
        "⠓",
        "⠋",
        "⠉",
        "⠈"
      ]
    },
    dots8: {
      interval: 80,
      frames: [
        "⠁",
        "⠁",
        "⠉",
        "⠙",
        "⠚",
        "⠒",
        "⠂",
        "⠂",
        "⠒",
        "⠲",
        "⠴",
        "⠤",
        "⠄",
        "⠄",
        "⠤",
        "⠠",
        "⠠",
        "⠤",
        "⠦",
        "⠖",
        "⠒",
        "⠐",
        "⠐",
        "⠒",
        "⠓",
        "⠋",
        "⠉",
        "⠈",
        "⠈"
      ]
    },
    dots9: {
      interval: 80,
      frames: [
        "⢹",
        "⢺",
        "⢼",
        "⣸",
        "⣇",
        "⡧",
        "⡗",
        "⡏"
      ]
    },
    dots10: {
      interval: 80,
      frames: [
        "⢄",
        "⢂",
        "⢁",
        "⡁",
        "⡈",
        "⡐",
        "⡠"
      ]
    },
    dots11: {
      interval: 100,
      frames: [
        "⠁",
        "⠂",
        "⠄",
        "⡀",
        "⢀",
        "⠠",
        "⠐",
        "⠈"
      ]
    },
    dots12: {
      interval: 80,
      frames: [
        "⢀⠀",
        "⡀⠀",
        "⠄⠀",
        "⢂⠀",
        "⡂⠀",
        "⠅⠀",
        "⢃⠀",
        "⡃⠀",
        "⠍⠀",
        "⢋⠀",
        "⡋⠀",
        "⠍⠁",
        "⢋⠁",
        "⡋⠁",
        "⠍⠉",
        "⠋⠉",
        "⠋⠉",
        "⠉⠙",
        "⠉⠙",
        "⠉⠩",
        "⠈⢙",
        "⠈⡙",
        "⢈⠩",
        "⡀⢙",
        "⠄⡙",
        "⢂⠩",
        "⡂⢘",
        "⠅⡘",
        "⢃⠨",
        "⡃⢐",
        "⠍⡐",
        "⢋⠠",
        "⡋⢀",
        "⠍⡁",
        "⢋⠁",
        "⡋⠁",
        "⠍⠉",
        "⠋⠉",
        "⠋⠉",
        "⠉⠙",
        "⠉⠙",
        "⠉⠩",
        "⠈⢙",
        "⠈⡙",
        "⠈⠩",
        "⠀⢙",
        "⠀⡙",
        "⠀⠩",
        "⠀⢘",
        "⠀⡘",
        "⠀⠨",
        "⠀⢐",
        "⠀⡐",
        "⠀⠠",
        "⠀⢀",
        "⠀⡀"
      ]
    },
    dots13: {
      interval: 80,
      frames: [
        "⣼",
        "⣹",
        "⢻",
        "⠿",
        "⡟",
        "⣏",
        "⣧",
        "⣶"
      ]
    },
    dots8Bit: {
      interval: 80,
      frames: [
        "⠀",
        "⠁",
        "⠂",
        "⠃",
        "⠄",
        "⠅",
        "⠆",
        "⠇",
        "⡀",
        "⡁",
        "⡂",
        "⡃",
        "⡄",
        "⡅",
        "⡆",
        "⡇",
        "⠈",
        "⠉",
        "⠊",
        "⠋",
        "⠌",
        "⠍",
        "⠎",
        "⠏",
        "⡈",
        "⡉",
        "⡊",
        "⡋",
        "⡌",
        "⡍",
        "⡎",
        "⡏",
        "⠐",
        "⠑",
        "⠒",
        "⠓",
        "⠔",
        "⠕",
        "⠖",
        "⠗",
        "⡐",
        "⡑",
        "⡒",
        "⡓",
        "⡔",
        "⡕",
        "⡖",
        "⡗",
        "⠘",
        "⠙",
        "⠚",
        "⠛",
        "⠜",
        "⠝",
        "⠞",
        "⠟",
        "⡘",
        "⡙",
        "⡚",
        "⡛",
        "⡜",
        "⡝",
        "⡞",
        "⡟",
        "⠠",
        "⠡",
        "⠢",
        "⠣",
        "⠤",
        "⠥",
        "⠦",
        "⠧",
        "⡠",
        "⡡",
        "⡢",
        "⡣",
        "⡤",
        "⡥",
        "⡦",
        "⡧",
        "⠨",
        "⠩",
        "⠪",
        "⠫",
        "⠬",
        "⠭",
        "⠮",
        "⠯",
        "⡨",
        "⡩",
        "⡪",
        "⡫",
        "⡬",
        "⡭",
        "⡮",
        "⡯",
        "⠰",
        "⠱",
        "⠲",
        "⠳",
        "⠴",
        "⠵",
        "⠶",
        "⠷",
        "⡰",
        "⡱",
        "⡲",
        "⡳",
        "⡴",
        "⡵",
        "⡶",
        "⡷",
        "⠸",
        "⠹",
        "⠺",
        "⠻",
        "⠼",
        "⠽",
        "⠾",
        "⠿",
        "⡸",
        "⡹",
        "⡺",
        "⡻",
        "⡼",
        "⡽",
        "⡾",
        "⡿",
        "⢀",
        "⢁",
        "⢂",
        "⢃",
        "⢄",
        "⢅",
        "⢆",
        "⢇",
        "⣀",
        "⣁",
        "⣂",
        "⣃",
        "⣄",
        "⣅",
        "⣆",
        "⣇",
        "⢈",
        "⢉",
        "⢊",
        "⢋",
        "⢌",
        "⢍",
        "⢎",
        "⢏",
        "⣈",
        "⣉",
        "⣊",
        "⣋",
        "⣌",
        "⣍",
        "⣎",
        "⣏",
        "⢐",
        "⢑",
        "⢒",
        "⢓",
        "⢔",
        "⢕",
        "⢖",
        "⢗",
        "⣐",
        "⣑",
        "⣒",
        "⣓",
        "⣔",
        "⣕",
        "⣖",
        "⣗",
        "⢘",
        "⢙",
        "⢚",
        "⢛",
        "⢜",
        "⢝",
        "⢞",
        "⢟",
        "⣘",
        "⣙",
        "⣚",
        "⣛",
        "⣜",
        "⣝",
        "⣞",
        "⣟",
        "⢠",
        "⢡",
        "⢢",
        "⢣",
        "⢤",
        "⢥",
        "⢦",
        "⢧",
        "⣠",
        "⣡",
        "⣢",
        "⣣",
        "⣤",
        "⣥",
        "⣦",
        "⣧",
        "⢨",
        "⢩",
        "⢪",
        "⢫",
        "⢬",
        "⢭",
        "⢮",
        "⢯",
        "⣨",
        "⣩",
        "⣪",
        "⣫",
        "⣬",
        "⣭",
        "⣮",
        "⣯",
        "⢰",
        "⢱",
        "⢲",
        "⢳",
        "⢴",
        "⢵",
        "⢶",
        "⢷",
        "⣰",
        "⣱",
        "⣲",
        "⣳",
        "⣴",
        "⣵",
        "⣶",
        "⣷",
        "⢸",
        "⢹",
        "⢺",
        "⢻",
        "⢼",
        "⢽",
        "⢾",
        "⢿",
        "⣸",
        "⣹",
        "⣺",
        "⣻",
        "⣼",
        "⣽",
        "⣾",
        "⣿"
      ]
    },
    sand: {
      interval: 80,
      frames: [
        "⠁",
        "⠂",
        "⠄",
        "⡀",
        "⡈",
        "⡐",
        "⡠",
        "⣀",
        "⣁",
        "⣂",
        "⣄",
        "⣌",
        "⣔",
        "⣤",
        "⣥",
        "⣦",
        "⣮",
        "⣶",
        "⣷",
        "⣿",
        "⡿",
        "⠿",
        "⢟",
        "⠟",
        "⡛",
        "⠛",
        "⠫",
        "⢋",
        "⠋",
        "⠍",
        "⡉",
        "⠉",
        "⠑",
        "⠡",
        "⢁"
      ]
    },
    line: {
      interval: 130,
      frames: [
        "-",
        "\\",
        "|",
        "/"
      ]
    },
    line2: {
      interval: 100,
      frames: [
        "⠂",
        "-",
        "–",
        "—",
        "–",
        "-"
      ]
    },
    pipe: {
      interval: 100,
      frames: [
        "┤",
        "┘",
        "┴",
        "└",
        "├",
        "┌",
        "┬",
        "┐"
      ]
    },
    simpleDots: {
      interval: 400,
      frames: [
        ".  ",
        ".. ",
        "...",
        "   "
      ]
    },
    simpleDotsScrolling: {
      interval: 200,
      frames: [
        ".  ",
        ".. ",
        "...",
        " ..",
        "  .",
        "   "
      ]
    },
    star: {
      interval: 70,
      frames: [
        "✶",
        "✸",
        "✹",
        "✺",
        "✹",
        "✷"
      ]
    },
    star2: {
      interval: 80,
      frames: [
        "+",
        "x",
        "*"
      ]
    },
    flip: {
      interval: 70,
      frames: [
        "_",
        "_",
        "_",
        "-",
        "`",
        "`",
        "'",
        "´",
        "-",
        "_",
        "_",
        "_"
      ]
    },
    hamburger: {
      interval: 100,
      frames: [
        "☱",
        "☲",
        "☴"
      ]
    },
    growVertical: {
      interval: 120,
      frames: [
        "▁",
        "▃",
        "▄",
        "▅",
        "▆",
        "▇",
        "▆",
        "▅",
        "▄",
        "▃"
      ]
    },
    growHorizontal: {
      interval: 120,
      frames: [
        "▏",
        "▎",
        "▍",
        "▌",
        "▋",
        "▊",
        "▉",
        "▊",
        "▋",
        "▌",
        "▍",
        "▎"
      ]
    },
    balloon: {
      interval: 140,
      frames: [
        " ",
        ".",
        "o",
        "O",
        "@",
        "*",
        " "
      ]
    },
    balloon2: {
      interval: 120,
      frames: [
        ".",
        "o",
        "O",
        "°",
        "O",
        "o",
        "."
      ]
    },
    noise: {
      interval: 100,
      frames: [
        "▓",
        "▒",
        "░"
      ]
    },
    bounce: {
      interval: 120,
      frames: [
        "⠁",
        "⠂",
        "⠄",
        "⠂"
      ]
    },
    boxBounce: {
      interval: 120,
      frames: [
        "▖",
        "▘",
        "▝",
        "▗"
      ]
    },
    boxBounce2: {
      interval: 100,
      frames: [
        "▌",
        "▀",
        "▐",
        "▄"
      ]
    },
    triangle: {
      interval: 50,
      frames: [
        "◢",
        "◣",
        "◤",
        "◥"
      ]
    },
    binary: {
      interval: 80,
      frames: [
        "010010",
        "001100",
        "100101",
        "111010",
        "111101",
        "010111",
        "101011",
        "111000",
        "110011",
        "110101"
      ]
    },
    arc: {
      interval: 100,
      frames: [
        "◜",
        "◠",
        "◝",
        "◞",
        "◡",
        "◟"
      ]
    },
    circle: {
      interval: 120,
      frames: [
        "◡",
        "⊙",
        "◠"
      ]
    },
    squareCorners: {
      interval: 180,
      frames: [
        "◰",
        "◳",
        "◲",
        "◱"
      ]
    },
    circleQuarters: {
      interval: 120,
      frames: [
        "◴",
        "◷",
        "◶",
        "◵"
      ]
    },
    circleHalves: {
      interval: 50,
      frames: [
        "◐",
        "◓",
        "◑",
        "◒"
      ]
    },
    squish: {
      interval: 100,
      frames: [
        "╫",
        "╪"
      ]
    },
    toggle: {
      interval: 250,
      frames: [
        "⊶",
        "⊷"
      ]
    },
    toggle2: {
      interval: 80,
      frames: [
        "▫",
        "▪"
      ]
    },
    toggle3: {
      interval: 120,
      frames: [
        "□",
        "■"
      ]
    },
    toggle4: {
      interval: 100,
      frames: [
        "■",
        "□",
        "▪",
        "▫"
      ]
    },
    toggle5: {
      interval: 100,
      frames: [
        "▮",
        "▯"
      ]
    },
    toggle6: {
      interval: 300,
      frames: [
        "ဝ",
        "၀"
      ]
    },
    toggle7: {
      interval: 80,
      frames: [
        "⦾",
        "⦿"
      ]
    },
    toggle8: {
      interval: 100,
      frames: [
        "◍",
        "◌"
      ]
    },
    toggle9: {
      interval: 100,
      frames: [
        "◉",
        "◎"
      ]
    },
    toggle10: {
      interval: 100,
      frames: [
        "㊂",
        "㊀",
        "㊁"
      ]
    },
    toggle11: {
      interval: 50,
      frames: [
        "⧇",
        "⧆"
      ]
    },
    toggle12: {
      interval: 120,
      frames: [
        "☗",
        "☖"
      ]
    },
    toggle13: {
      interval: 80,
      frames: [
        "=",
        "*",
        "-"
      ]
    },
    arrow: {
      interval: 100,
      frames: [
        "←",
        "↖",
        "↑",
        "↗",
        "→",
        "↘",
        "↓",
        "↙"
      ]
    },
    arrow2: {
      interval: 80,
      frames: [
        "⬆️ ",
        "↗️ ",
        "➡️ ",
        "↘️ ",
        "⬇️ ",
        "↙️ ",
        "⬅️ ",
        "↖️ "
      ]
    },
    arrow3: {
      interval: 120,
      frames: [
        "▹▹▹▹▹",
        "▸▹▹▹▹",
        "▹▸▹▹▹",
        "▹▹▸▹▹",
        "▹▹▹▸▹",
        "▹▹▹▹▸"
      ]
    },
    bouncingBar: {
      interval: 80,
      frames: [
        "[    ]",
        "[=   ]",
        "[==  ]",
        "[=== ]",
        "[====]",
        "[ ===]",
        "[  ==]",
        "[   =]",
        "[    ]",
        "[   =]",
        "[  ==]",
        "[ ===]",
        "[====]",
        "[=== ]",
        "[==  ]",
        "[=   ]"
      ]
    },
    bouncingBall: {
      interval: 80,
      frames: [
        "( ●    )",
        "(  ●   )",
        "(   ●  )",
        "(    ● )",
        "(     ●)",
        "(    ● )",
        "(   ●  )",
        "(  ●   )",
        "( ●    )",
        "(●     )"
      ]
    },
    smiley: {
      interval: 200,
      frames: [
        "\uD83D\uDE04 ",
        "\uD83D\uDE1D "
      ]
    },
    monkey: {
      interval: 300,
      frames: [
        "\uD83D\uDE48 ",
        "\uD83D\uDE48 ",
        "\uD83D\uDE49 ",
        "\uD83D\uDE4A "
      ]
    },
    hearts: {
      interval: 100,
      frames: [
        "\uD83D\uDC9B ",
        "\uD83D\uDC99 ",
        "\uD83D\uDC9C ",
        "\uD83D\uDC9A ",
        "❤️ "
      ]
    },
    clock: {
      interval: 100,
      frames: [
        "\uD83D\uDD5B ",
        "\uD83D\uDD50 ",
        "\uD83D\uDD51 ",
        "\uD83D\uDD52 ",
        "\uD83D\uDD53 ",
        "\uD83D\uDD54 ",
        "\uD83D\uDD55 ",
        "\uD83D\uDD56 ",
        "\uD83D\uDD57 ",
        "\uD83D\uDD58 ",
        "\uD83D\uDD59 ",
        "\uD83D\uDD5A "
      ]
    },
    earth: {
      interval: 180,
      frames: [
        "\uD83C\uDF0D ",
        "\uD83C\uDF0E ",
        "\uD83C\uDF0F "
      ]
    },
    material: {
      interval: 17,
      frames: [
        "█▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
        "██▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
        "███▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
        "████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
        "██████▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
        "██████▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
        "███████▁▁▁▁▁▁▁▁▁▁▁▁▁",
        "████████▁▁▁▁▁▁▁▁▁▁▁▁",
        "█████████▁▁▁▁▁▁▁▁▁▁▁",
        "█████████▁▁▁▁▁▁▁▁▁▁▁",
        "██████████▁▁▁▁▁▁▁▁▁▁",
        "███████████▁▁▁▁▁▁▁▁▁",
        "█████████████▁▁▁▁▁▁▁",
        "██████████████▁▁▁▁▁▁",
        "██████████████▁▁▁▁▁▁",
        "▁██████████████▁▁▁▁▁",
        "▁██████████████▁▁▁▁▁",
        "▁██████████████▁▁▁▁▁",
        "▁▁██████████████▁▁▁▁",
        "▁▁▁██████████████▁▁▁",
        "▁▁▁▁█████████████▁▁▁",
        "▁▁▁▁██████████████▁▁",
        "▁▁▁▁██████████████▁▁",
        "▁▁▁▁▁██████████████▁",
        "▁▁▁▁▁██████████████▁",
        "▁▁▁▁▁██████████████▁",
        "▁▁▁▁▁▁██████████████",
        "▁▁▁▁▁▁██████████████",
        "▁▁▁▁▁▁▁█████████████",
        "▁▁▁▁▁▁▁█████████████",
        "▁▁▁▁▁▁▁▁████████████",
        "▁▁▁▁▁▁▁▁████████████",
        "▁▁▁▁▁▁▁▁▁███████████",
        "▁▁▁▁▁▁▁▁▁███████████",
        "▁▁▁▁▁▁▁▁▁▁██████████",
        "▁▁▁▁▁▁▁▁▁▁██████████",
        "▁▁▁▁▁▁▁▁▁▁▁▁████████",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁███████",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁██████",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█████",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█████",
        "█▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁████",
        "██▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁███",
        "██▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁███",
        "███▁▁▁▁▁▁▁▁▁▁▁▁▁▁███",
        "████▁▁▁▁▁▁▁▁▁▁▁▁▁▁██",
        "█████▁▁▁▁▁▁▁▁▁▁▁▁▁▁█",
        "█████▁▁▁▁▁▁▁▁▁▁▁▁▁▁█",
        "██████▁▁▁▁▁▁▁▁▁▁▁▁▁█",
        "████████▁▁▁▁▁▁▁▁▁▁▁▁",
        "█████████▁▁▁▁▁▁▁▁▁▁▁",
        "█████████▁▁▁▁▁▁▁▁▁▁▁",
        "█████████▁▁▁▁▁▁▁▁▁▁▁",
        "█████████▁▁▁▁▁▁▁▁▁▁▁",
        "███████████▁▁▁▁▁▁▁▁▁",
        "████████████▁▁▁▁▁▁▁▁",
        "████████████▁▁▁▁▁▁▁▁",
        "██████████████▁▁▁▁▁▁",
        "██████████████▁▁▁▁▁▁",
        "▁██████████████▁▁▁▁▁",
        "▁██████████████▁▁▁▁▁",
        "▁▁▁█████████████▁▁▁▁",
        "▁▁▁▁▁████████████▁▁▁",
        "▁▁▁▁▁████████████▁▁▁",
        "▁▁▁▁▁▁███████████▁▁▁",
        "▁▁▁▁▁▁▁▁█████████▁▁▁",
        "▁▁▁▁▁▁▁▁█████████▁▁▁",
        "▁▁▁▁▁▁▁▁▁█████████▁▁",
        "▁▁▁▁▁▁▁▁▁█████████▁▁",
        "▁▁▁▁▁▁▁▁▁▁█████████▁",
        "▁▁▁▁▁▁▁▁▁▁▁████████▁",
        "▁▁▁▁▁▁▁▁▁▁▁████████▁",
        "▁▁▁▁▁▁▁▁▁▁▁▁███████▁",
        "▁▁▁▁▁▁▁▁▁▁▁▁███████▁",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁███████",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁███████",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█████",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁████",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁████",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁████",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁███",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁███",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁██",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁██",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁██",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
        "▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁"
      ]
    },
    moon: {
      interval: 80,
      frames: [
        "\uD83C\uDF11 ",
        "\uD83C\uDF12 ",
        "\uD83C\uDF13 ",
        "\uD83C\uDF14 ",
        "\uD83C\uDF15 ",
        "\uD83C\uDF16 ",
        "\uD83C\uDF17 ",
        "\uD83C\uDF18 "
      ]
    },
    runner: {
      interval: 140,
      frames: [
        "\uD83D\uDEB6 ",
        "\uD83C\uDFC3 "
      ]
    },
    pong: {
      interval: 80,
      frames: [
        "▐⠂       ▌",
        "▐⠈       ▌",
        "▐ ⠂      ▌",
        "▐ ⠠      ▌",
        "▐  ⡀     ▌",
        "▐  ⠠     ▌",
        "▐   ⠂    ▌",
        "▐   ⠈    ▌",
        "▐    ⠂   ▌",
        "▐    ⠠   ▌",
        "▐     ⡀  ▌",
        "▐     ⠠  ▌",
        "▐      ⠂ ▌",
        "▐      ⠈ ▌",
        "▐       ⠂▌",
        "▐       ⠠▌",
        "▐       ⡀▌",
        "▐      ⠠ ▌",
        "▐      ⠂ ▌",
        "▐     ⠈  ▌",
        "▐     ⠂  ▌",
        "▐    ⠠   ▌",
        "▐    ⡀   ▌",
        "▐   ⠠    ▌",
        "▐   ⠂    ▌",
        "▐  ⠈     ▌",
        "▐  ⠂     ▌",
        "▐ ⠠      ▌",
        "▐ ⡀      ▌",
        "▐⠠       ▌"
      ]
    },
    shark: {
      interval: 120,
      frames: [
        "▐|\\____________▌",
        "▐_|\\___________▌",
        "▐__|\\__________▌",
        "▐___|\\_________▌",
        "▐____|\\________▌",
        "▐_____|\\_______▌",
        "▐______|\\______▌",
        "▐_______|\\_____▌",
        "▐________|\\____▌",
        "▐_________|\\___▌",
        "▐__________|\\__▌",
        "▐___________|\\_▌",
        "▐____________|\\▌",
        "▐____________/|▌",
        "▐___________/|_▌",
        "▐__________/|__▌",
        "▐_________/|___▌",
        "▐________/|____▌",
        "▐_______/|_____▌",
        "▐______/|______▌",
        "▐_____/|_______▌",
        "▐____/|________▌",
        "▐___/|_________▌",
        "▐__/|__________▌",
        "▐_/|___________▌",
        "▐/|____________▌"
      ]
    },
    dqpb: {
      interval: 100,
      frames: [
        "d",
        "q",
        "p",
        "b"
      ]
    },
    weather: {
      interval: 100,
      frames: [
        "☀️ ",
        "☀️ ",
        "☀️ ",
        "\uD83C\uDF24 ",
        "⛅️ ",
        "\uD83C\uDF25 ",
        "☁️ ",
        "\uD83C\uDF27 ",
        "\uD83C\uDF28 ",
        "\uD83C\uDF27 ",
        "\uD83C\uDF28 ",
        "\uD83C\uDF27 ",
        "\uD83C\uDF28 ",
        "⛈ ",
        "\uD83C\uDF28 ",
        "\uD83C\uDF27 ",
        "\uD83C\uDF28 ",
        "☁️ ",
        "\uD83C\uDF25 ",
        "⛅️ ",
        "\uD83C\uDF24 ",
        "☀️ ",
        "☀️ "
      ]
    },
    christmas: {
      interval: 400,
      frames: [
        "\uD83C\uDF32",
        "\uD83C\uDF84"
      ]
    },
    grenade: {
      interval: 80,
      frames: [
        "،  ",
        "′  ",
        " ´ ",
        " ‾ ",
        "  ⸌",
        "  ⸊",
        "  |",
        "  ⁎",
        "  ⁕",
        " ෴ ",
        "  ⁓",
        "   ",
        "   ",
        "   "
      ]
    },
    point: {
      interval: 125,
      frames: [
        "∙∙∙",
        "●∙∙",
        "∙●∙",
        "∙∙●",
        "∙∙∙"
      ]
    },
    layer: {
      interval: 150,
      frames: [
        "-",
        "=",
        "≡"
      ]
    },
    betaWave: {
      interval: 80,
      frames: [
        "ρββββββ",
        "βρβββββ",
        "ββρββββ",
        "βββρβββ",
        "ββββρββ",
        "βββββρβ",
        "ββββββρ"
      ]
    },
    fingerDance: {
      interval: 160,
      frames: [
        "\uD83E\uDD18 ",
        "\uD83E\uDD1F ",
        "\uD83D\uDD96 ",
        "✋ ",
        "\uD83E\uDD1A ",
        "\uD83D\uDC46 "
      ]
    },
    fistBump: {
      interval: 80,
      frames: [
        "\uD83E\uDD1C　　　　\uD83E\uDD1B ",
        "\uD83E\uDD1C　　　　\uD83E\uDD1B ",
        "\uD83E\uDD1C　　　　\uD83E\uDD1B ",
        "　\uD83E\uDD1C　　\uD83E\uDD1B　 ",
        "　　\uD83E\uDD1C\uD83E\uDD1B　　 ",
        "　\uD83E\uDD1C✨\uD83E\uDD1B　　 ",
        "\uD83E\uDD1C　✨　\uD83E\uDD1B　 "
      ]
    },
    soccerHeader: {
      interval: 80,
      frames: [
        " \uD83E\uDDD1⚽️       \uD83E\uDDD1 ",
        "\uD83E\uDDD1  ⚽️      \uD83E\uDDD1 ",
        "\uD83E\uDDD1   ⚽️     \uD83E\uDDD1 ",
        "\uD83E\uDDD1    ⚽️    \uD83E\uDDD1 ",
        "\uD83E\uDDD1     ⚽️   \uD83E\uDDD1 ",
        "\uD83E\uDDD1      ⚽️  \uD83E\uDDD1 ",
        "\uD83E\uDDD1       ⚽️\uD83E\uDDD1  ",
        "\uD83E\uDDD1      ⚽️  \uD83E\uDDD1 ",
        "\uD83E\uDDD1     ⚽️   \uD83E\uDDD1 ",
        "\uD83E\uDDD1    ⚽️    \uD83E\uDDD1 ",
        "\uD83E\uDDD1   ⚽️     \uD83E\uDDD1 ",
        "\uD83E\uDDD1  ⚽️      \uD83E\uDDD1 "
      ]
    },
    mindblown: {
      interval: 160,
      frames: [
        "\uD83D\uDE10 ",
        "\uD83D\uDE10 ",
        "\uD83D\uDE2E ",
        "\uD83D\uDE2E ",
        "\uD83D\uDE26 ",
        "\uD83D\uDE26 ",
        "\uD83D\uDE27 ",
        "\uD83D\uDE27 ",
        "\uD83E\uDD2F ",
        "\uD83D\uDCA5 ",
        "✨ ",
        "　 ",
        "　 ",
        "　 "
      ]
    },
    speaker: {
      interval: 160,
      frames: [
        "\uD83D\uDD08 ",
        "\uD83D\uDD09 ",
        "\uD83D\uDD0A ",
        "\uD83D\uDD09 "
      ]
    },
    orangePulse: {
      interval: 100,
      frames: [
        "\uD83D\uDD38 ",
        "\uD83D\uDD36 ",
        "\uD83D\uDFE0 ",
        "\uD83D\uDFE0 ",
        "\uD83D\uDD36 "
      ]
    },
    bluePulse: {
      interval: 100,
      frames: [
        "\uD83D\uDD39 ",
        "\uD83D\uDD37 ",
        "\uD83D\uDD35 ",
        "\uD83D\uDD35 ",
        "\uD83D\uDD37 "
      ]
    },
    orangeBluePulse: {
      interval: 100,
      frames: [
        "\uD83D\uDD38 ",
        "\uD83D\uDD36 ",
        "\uD83D\uDFE0 ",
        "\uD83D\uDFE0 ",
        "\uD83D\uDD36 ",
        "\uD83D\uDD39 ",
        "\uD83D\uDD37 ",
        "\uD83D\uDD35 ",
        "\uD83D\uDD35 ",
        "\uD83D\uDD37 "
      ]
    },
    timeTravel: {
      interval: 100,
      frames: [
        "\uD83D\uDD5B ",
        "\uD83D\uDD5A ",
        "\uD83D\uDD59 ",
        "\uD83D\uDD58 ",
        "\uD83D\uDD57 ",
        "\uD83D\uDD56 ",
        "\uD83D\uDD55 ",
        "\uD83D\uDD54 ",
        "\uD83D\uDD53 ",
        "\uD83D\uDD52 ",
        "\uD83D\uDD51 ",
        "\uD83D\uDD50 "
      ]
    },
    aesthetic: {
      interval: 80,
      frames: [
        "▰▱▱▱▱▱▱",
        "▰▰▱▱▱▱▱",
        "▰▰▰▱▱▱▱",
        "▰▰▰▰▱▱▱",
        "▰▰▰▰▰▱▱",
        "▰▰▰▰▰▰▱",
        "▰▰▰▰▰▰▰",
        "▰▱▱▱▱▱▱"
      ]
    },
    dwarfFortress: {
      interval: 80,
      frames: [
        " ██████£££  ",
        "☺██████£££  ",
        "☺██████£££  ",
        "☺▓█████£££  ",
        "☺▓█████£££  ",
        "☺▒█████£££  ",
        "☺▒█████£££  ",
        "☺░█████£££  ",
        "☺░█████£££  ",
        "☺ █████£££  ",
        " ☺█████£££  ",
        " ☺█████£££  ",
        " ☺▓████£££  ",
        " ☺▓████£££  ",
        " ☺▒████£££  ",
        " ☺▒████£££  ",
        " ☺░████£££  ",
        " ☺░████£££  ",
        " ☺ ████£££  ",
        "  ☺████£££  ",
        "  ☺████£££  ",
        "  ☺▓███£££  ",
        "  ☺▓███£££  ",
        "  ☺▒███£££  ",
        "  ☺▒███£££  ",
        "  ☺░███£££  ",
        "  ☺░███£££  ",
        "  ☺ ███£££  ",
        "   ☺███£££  ",
        "   ☺███£££  ",
        "   ☺▓██£££  ",
        "   ☺▓██£££  ",
        "   ☺▒██£££  ",
        "   ☺▒██£££  ",
        "   ☺░██£££  ",
        "   ☺░██£££  ",
        "   ☺ ██£££  ",
        "    ☺██£££  ",
        "    ☺██£££  ",
        "    ☺▓█£££  ",
        "    ☺▓█£££  ",
        "    ☺▒█£££  ",
        "    ☺▒█£££  ",
        "    ☺░█£££  ",
        "    ☺░█£££  ",
        "    ☺ █£££  ",
        "     ☺█£££  ",
        "     ☺█£££  ",
        "     ☺▓£££  ",
        "     ☺▓£££  ",
        "     ☺▒£££  ",
        "     ☺▒£££  ",
        "     ☺░£££  ",
        "     ☺░£££  ",
        "     ☺ £££  ",
        "      ☺£££  ",
        "      ☺£££  ",
        "      ☺▓££  ",
        "      ☺▓££  ",
        "      ☺▒££  ",
        "      ☺▒££  ",
        "      ☺░££  ",
        "      ☺░££  ",
        "      ☺ ££  ",
        "       ☺££  ",
        "       ☺££  ",
        "       ☺▓£  ",
        "       ☺▓£  ",
        "       ☺▒£  ",
        "       ☺▒£  ",
        "       ☺░£  ",
        "       ☺░£  ",
        "       ☺ £  ",
        "        ☺£  ",
        "        ☺£  ",
        "        ☺▓  ",
        "        ☺▓  ",
        "        ☺▒  ",
        "        ☺▒  ",
        "        ☺░  ",
        "        ☺░  ",
        "        ☺   ",
        "        ☺  &",
        "        ☺ ☼&",
        "       ☺ ☼ &",
        "       ☺☼  &",
        "      ☺☼  & ",
        "      ‼   & ",
        "     ☺   &  ",
        "    ‼    &  ",
        "   ☺    &   ",
        "  ‼     &   ",
        " ☺     &    ",
        "‼      &    ",
        "      &     ",
        "      &     ",
        "     &   ░  ",
        "     &   ▒  ",
        "    &    ▓  ",
        "    &    £  ",
        "   &    ░£  ",
        "   &    ▒£  ",
        "  &     ▓£  ",
        "  &     ££  ",
        " &     ░££  ",
        " &     ▒££  ",
        "&      ▓££  ",
        "&      £££  ",
        "      ░£££  ",
        "      ▒£££  ",
        "      ▓£££  ",
        "      █£££  ",
        "     ░█£££  ",
        "     ▒█£££  ",
        "     ▓█£££  ",
        "     ██£££  ",
        "    ░██£££  ",
        "    ▒██£££  ",
        "    ▓██£££  ",
        "    ███£££  ",
        "   ░███£££  ",
        "   ▒███£££  ",
        "   ▓███£££  ",
        "   ████£££  ",
        "  ░████£££  ",
        "  ▒████£££  ",
        "  ▓████£££  ",
        "  █████£££  ",
        " ░█████£££  ",
        " ▒█████£££  ",
        " ▓█████£££  ",
        " ██████£££  ",
        " ██████£££  "
      ]
    }
  };
});

// node_modules/cli-spinners/index.js
var require_cli_spinners = __commonJS((exports, module) => {
  var spinners = Object.assign({}, require_spinners());
  var spinnersList = Object.keys(spinners);
  Object.defineProperty(spinners, "random", {
    get() {
      const randomIndex = Math.floor(Math.random() * spinnersList.length);
      const spinnerName = spinnersList[randomIndex];
      return spinners[spinnerName];
    }
  });
  module.exports = spinners;
});

// node_modules/emoji-regex/index.js
var require_emoji_regex = __commonJS((exports, module) => {
  module.exports = () => {
    return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E\uDC70\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED7\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE])))?))?|\uDC6F(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE89\uDE8F-\uDEC2\uDEC6\uDECE-\uDEDC\uDEDF-\uDEE9]|\uDD3C(?:\u200D[\u2640\u2642]\uFE0F?|\uD83C[\uDFFB-\uDFFF])?|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
  };
});

// node_modules/yoctocolors-cjs/index.js
var require_yoctocolors_cjs = __commonJS((exports, module) => {
  var tty2 = __require("node:tty");
  var hasColors = tty2?.WriteStream?.prototype?.hasColors?.() ?? false;
  var format = (open, close) => {
    if (!hasColors) {
      return (input) => input;
    }
    const openCode = `\x1B[${open}m`;
    const closeCode = `\x1B[${close}m`;
    return (input) => {
      const string = input + "";
      let index = string.indexOf(closeCode);
      if (index === -1) {
        return openCode + string + closeCode;
      }
      let result = openCode;
      let lastIndex = 0;
      while (index !== -1) {
        result += string.slice(lastIndex, index) + openCode;
        lastIndex = index + closeCode.length;
        index = string.indexOf(closeCode, lastIndex);
      }
      result += string.slice(lastIndex) + closeCode;
      return result;
    };
  };
  var colors = {};
  colors.reset = format(0, 0);
  colors.bold = format(1, 22);
  colors.dim = format(2, 22);
  colors.italic = format(3, 23);
  colors.underline = format(4, 24);
  colors.overline = format(53, 55);
  colors.inverse = format(7, 27);
  colors.hidden = format(8, 28);
  colors.strikethrough = format(9, 29);
  colors.black = format(30, 39);
  colors.red = format(31, 39);
  colors.green = format(32, 39);
  colors.yellow = format(33, 39);
  colors.blue = format(34, 39);
  colors.magenta = format(35, 39);
  colors.cyan = format(36, 39);
  colors.white = format(37, 39);
  colors.gray = format(90, 39);
  colors.bgBlack = format(40, 49);
  colors.bgRed = format(41, 49);
  colors.bgGreen = format(42, 49);
  colors.bgYellow = format(43, 49);
  colors.bgBlue = format(44, 49);
  colors.bgMagenta = format(45, 49);
  colors.bgCyan = format(46, 49);
  colors.bgWhite = format(47, 49);
  colors.bgGray = format(100, 49);
  colors.redBright = format(91, 39);
  colors.greenBright = format(92, 39);
  colors.yellowBright = format(93, 39);
  colors.blueBright = format(94, 39);
  colors.magentaBright = format(95, 39);
  colors.cyanBright = format(96, 39);
  colors.whiteBright = format(97, 39);
  colors.bgRedBright = format(101, 49);
  colors.bgGreenBright = format(102, 49);
  colors.bgYellowBright = format(103, 49);
  colors.bgBlueBright = format(104, 49);
  colors.bgMagentaBright = format(105, 49);
  colors.bgCyanBright = format(106, 49);
  colors.bgWhiteBright = format(107, 49);
  module.exports = colors;
});

// node_modules/cli-width/index.js
var require_cli_width = __commonJS((exports, module) => {
  module.exports = cliWidth;
  function normalizeOpts(options) {
    const defaultOpts = {
      defaultWidth: 0,
      output: process.stdout,
      tty: __require("tty")
    };
    if (!options) {
      return defaultOpts;
    }
    Object.keys(defaultOpts).forEach(function(key) {
      if (!options[key]) {
        options[key] = defaultOpts[key];
      }
    });
    return options;
  }
  function cliWidth(options) {
    const opts = normalizeOpts(options);
    if (opts.output.getWindowSize) {
      return opts.output.getWindowSize()[0] || opts.defaultWidth;
    }
    if (opts.tty.getWindowSize) {
      return opts.tty.getWindowSize()[1] || opts.defaultWidth;
    }
    if (opts.output.columns) {
      return opts.output.columns;
    }
    if (process.env.CLI_WIDTH) {
      const width = parseInt(process.env.CLI_WIDTH, 10);
      if (!isNaN(width) && width !== 0) {
        return width;
      }
    }
    return opts.defaultWidth;
  }
});

// node_modules/wrap-ansi/node_modules/strip-ansi/node_modules/ansi-regex/index.js
var require_ansi_regex = __commonJS((exports, module) => {
  module.exports = ({ onlyFirst = false } = {}) => {
    const pattern = [
      "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
      "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
    ].join("|");
    return new RegExp(pattern, onlyFirst ? undefined : "g");
  };
});

// node_modules/wrap-ansi/node_modules/strip-ansi/index.js
var require_strip_ansi = __commonJS((exports, module) => {
  var ansiRegex2 = require_ansi_regex();
  module.exports = (string) => typeof string === "string" ? string.replace(ansiRegex2(), "") : string;
});

// node_modules/is-fullwidth-code-point/index.js
var require_is_fullwidth_code_point = __commonJS((exports, module) => {
  var isFullwidthCodePoint = (codePoint) => {
    if (Number.isNaN(codePoint)) {
      return false;
    }
    if (codePoint >= 4352 && (codePoint <= 4447 || codePoint === 9001 || codePoint === 9002 || 11904 <= codePoint && codePoint <= 12871 && codePoint !== 12351 || 12880 <= codePoint && codePoint <= 19903 || 19968 <= codePoint && codePoint <= 42182 || 43360 <= codePoint && codePoint <= 43388 || 44032 <= codePoint && codePoint <= 55203 || 63744 <= codePoint && codePoint <= 64255 || 65040 <= codePoint && codePoint <= 65049 || 65072 <= codePoint && codePoint <= 65131 || 65281 <= codePoint && codePoint <= 65376 || 65504 <= codePoint && codePoint <= 65510 || 110592 <= codePoint && codePoint <= 110593 || 127488 <= codePoint && codePoint <= 127569 || 131072 <= codePoint && codePoint <= 262141)) {
      return true;
    }
    return false;
  };
  module.exports = isFullwidthCodePoint;
  module.exports.default = isFullwidthCodePoint;
});

// node_modules/wrap-ansi/node_modules/string-width/node_modules/emoji-regex/index.js
var require_emoji_regex2 = __commonJS((exports, module) => {
  module.exports = function() {
    return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F|\uD83D\uDC68(?:\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68\uD83C\uDFFB|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|[\u2695\u2696\u2708]\uFE0F|\uD83D[\uDC66\uDC67]|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708])\uFE0F|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C[\uDFFB-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)\uD83C\uDFFB|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB\uDFFC])|\uD83D\uDC69(?:\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB-\uDFFD])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83C\uDFF4\u200D\u2620)\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDF6\uD83C\uDDE6|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDB5\uDDB6\uDDBB\uDDD2-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5\uDEEB\uDEEC\uDEF4-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
  };
});

// node_modules/wrap-ansi/node_modules/string-width/index.js
var require_string_width = __commonJS((exports, module) => {
  var stripAnsi2 = require_strip_ansi();
  var isFullwidthCodePoint = require_is_fullwidth_code_point();
  var emojiRegex2 = require_emoji_regex2();
  var stringWidth2 = (string) => {
    if (typeof string !== "string" || string.length === 0) {
      return 0;
    }
    string = stripAnsi2(string);
    if (string.length === 0) {
      return 0;
    }
    string = string.replace(emojiRegex2(), "  ");
    let width = 0;
    for (let i = 0;i < string.length; i++) {
      const code = string.codePointAt(i);
      if (code <= 31 || code >= 127 && code <= 159) {
        continue;
      }
      if (code >= 768 && code <= 879) {
        continue;
      }
      if (code > 65535) {
        i++;
      }
      width += isFullwidthCodePoint(code) ? 2 : 1;
    }
    return width;
  };
  module.exports = stringWidth2;
  module.exports.default = stringWidth2;
});

// node_modules/color-name/index.js
var require_color_name = __commonJS((exports, module) => {
  module.exports = {
    aliceblue: [240, 248, 255],
    antiquewhite: [250, 235, 215],
    aqua: [0, 255, 255],
    aquamarine: [127, 255, 212],
    azure: [240, 255, 255],
    beige: [245, 245, 220],
    bisque: [255, 228, 196],
    black: [0, 0, 0],
    blanchedalmond: [255, 235, 205],
    blue: [0, 0, 255],
    blueviolet: [138, 43, 226],
    brown: [165, 42, 42],
    burlywood: [222, 184, 135],
    cadetblue: [95, 158, 160],
    chartreuse: [127, 255, 0],
    chocolate: [210, 105, 30],
    coral: [255, 127, 80],
    cornflowerblue: [100, 149, 237],
    cornsilk: [255, 248, 220],
    crimson: [220, 20, 60],
    cyan: [0, 255, 255],
    darkblue: [0, 0, 139],
    darkcyan: [0, 139, 139],
    darkgoldenrod: [184, 134, 11],
    darkgray: [169, 169, 169],
    darkgreen: [0, 100, 0],
    darkgrey: [169, 169, 169],
    darkkhaki: [189, 183, 107],
    darkmagenta: [139, 0, 139],
    darkolivegreen: [85, 107, 47],
    darkorange: [255, 140, 0],
    darkorchid: [153, 50, 204],
    darkred: [139, 0, 0],
    darksalmon: [233, 150, 122],
    darkseagreen: [143, 188, 143],
    darkslateblue: [72, 61, 139],
    darkslategray: [47, 79, 79],
    darkslategrey: [47, 79, 79],
    darkturquoise: [0, 206, 209],
    darkviolet: [148, 0, 211],
    deeppink: [255, 20, 147],
    deepskyblue: [0, 191, 255],
    dimgray: [105, 105, 105],
    dimgrey: [105, 105, 105],
    dodgerblue: [30, 144, 255],
    firebrick: [178, 34, 34],
    floralwhite: [255, 250, 240],
    forestgreen: [34, 139, 34],
    fuchsia: [255, 0, 255],
    gainsboro: [220, 220, 220],
    ghostwhite: [248, 248, 255],
    gold: [255, 215, 0],
    goldenrod: [218, 165, 32],
    gray: [128, 128, 128],
    green: [0, 128, 0],
    greenyellow: [173, 255, 47],
    grey: [128, 128, 128],
    honeydew: [240, 255, 240],
    hotpink: [255, 105, 180],
    indianred: [205, 92, 92],
    indigo: [75, 0, 130],
    ivory: [255, 255, 240],
    khaki: [240, 230, 140],
    lavender: [230, 230, 250],
    lavenderblush: [255, 240, 245],
    lawngreen: [124, 252, 0],
    lemonchiffon: [255, 250, 205],
    lightblue: [173, 216, 230],
    lightcoral: [240, 128, 128],
    lightcyan: [224, 255, 255],
    lightgoldenrodyellow: [250, 250, 210],
    lightgray: [211, 211, 211],
    lightgreen: [144, 238, 144],
    lightgrey: [211, 211, 211],
    lightpink: [255, 182, 193],
    lightsalmon: [255, 160, 122],
    lightseagreen: [32, 178, 170],
    lightskyblue: [135, 206, 250],
    lightslategray: [119, 136, 153],
    lightslategrey: [119, 136, 153],
    lightsteelblue: [176, 196, 222],
    lightyellow: [255, 255, 224],
    lime: [0, 255, 0],
    limegreen: [50, 205, 50],
    linen: [250, 240, 230],
    magenta: [255, 0, 255],
    maroon: [128, 0, 0],
    mediumaquamarine: [102, 205, 170],
    mediumblue: [0, 0, 205],
    mediumorchid: [186, 85, 211],
    mediumpurple: [147, 112, 219],
    mediumseagreen: [60, 179, 113],
    mediumslateblue: [123, 104, 238],
    mediumspringgreen: [0, 250, 154],
    mediumturquoise: [72, 209, 204],
    mediumvioletred: [199, 21, 133],
    midnightblue: [25, 25, 112],
    mintcream: [245, 255, 250],
    mistyrose: [255, 228, 225],
    moccasin: [255, 228, 181],
    navajowhite: [255, 222, 173],
    navy: [0, 0, 128],
    oldlace: [253, 245, 230],
    olive: [128, 128, 0],
    olivedrab: [107, 142, 35],
    orange: [255, 165, 0],
    orangered: [255, 69, 0],
    orchid: [218, 112, 214],
    palegoldenrod: [238, 232, 170],
    palegreen: [152, 251, 152],
    paleturquoise: [175, 238, 238],
    palevioletred: [219, 112, 147],
    papayawhip: [255, 239, 213],
    peachpuff: [255, 218, 185],
    peru: [205, 133, 63],
    pink: [255, 192, 203],
    plum: [221, 160, 221],
    powderblue: [176, 224, 230],
    purple: [128, 0, 128],
    rebeccapurple: [102, 51, 153],
    red: [255, 0, 0],
    rosybrown: [188, 143, 143],
    royalblue: [65, 105, 225],
    saddlebrown: [139, 69, 19],
    salmon: [250, 128, 114],
    sandybrown: [244, 164, 96],
    seagreen: [46, 139, 87],
    seashell: [255, 245, 238],
    sienna: [160, 82, 45],
    silver: [192, 192, 192],
    skyblue: [135, 206, 235],
    slateblue: [106, 90, 205],
    slategray: [112, 128, 144],
    slategrey: [112, 128, 144],
    snow: [255, 250, 250],
    springgreen: [0, 255, 127],
    steelblue: [70, 130, 180],
    tan: [210, 180, 140],
    teal: [0, 128, 128],
    thistle: [216, 191, 216],
    tomato: [255, 99, 71],
    turquoise: [64, 224, 208],
    violet: [238, 130, 238],
    wheat: [245, 222, 179],
    white: [255, 255, 255],
    whitesmoke: [245, 245, 245],
    yellow: [255, 255, 0],
    yellowgreen: [154, 205, 50]
  };
});

// node_modules/color-convert/conversions.js
var require_conversions = __commonJS((exports, module) => {
  var cssKeywords = require_color_name();
  var reverseKeywords = {};
  for (const key of Object.keys(cssKeywords)) {
    reverseKeywords[cssKeywords[key]] = key;
  }
  var convert = {
    rgb: { channels: 3, labels: "rgb" },
    hsl: { channels: 3, labels: "hsl" },
    hsv: { channels: 3, labels: "hsv" },
    hwb: { channels: 3, labels: "hwb" },
    cmyk: { channels: 4, labels: "cmyk" },
    xyz: { channels: 3, labels: "xyz" },
    lab: { channels: 3, labels: "lab" },
    lch: { channels: 3, labels: "lch" },
    hex: { channels: 1, labels: ["hex"] },
    keyword: { channels: 1, labels: ["keyword"] },
    ansi16: { channels: 1, labels: ["ansi16"] },
    ansi256: { channels: 1, labels: ["ansi256"] },
    hcg: { channels: 3, labels: ["h", "c", "g"] },
    apple: { channels: 3, labels: ["r16", "g16", "b16"] },
    gray: { channels: 1, labels: ["gray"] }
  };
  module.exports = convert;
  for (const model of Object.keys(convert)) {
    if (!("channels" in convert[model])) {
      throw new Error("missing channels property: " + model);
    }
    if (!("labels" in convert[model])) {
      throw new Error("missing channel labels property: " + model);
    }
    if (convert[model].labels.length !== convert[model].channels) {
      throw new Error("channel and label counts mismatch: " + model);
    }
    const { channels, labels } = convert[model];
    delete convert[model].channels;
    delete convert[model].labels;
    Object.defineProperty(convert[model], "channels", { value: channels });
    Object.defineProperty(convert[model], "labels", { value: labels });
  }
  convert.rgb.hsl = function(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const min = Math.min(r, g, b);
    const max = Math.max(r, g, b);
    const delta = max - min;
    let h;
    let s;
    if (max === min) {
      h = 0;
    } else if (r === max) {
      h = (g - b) / delta;
    } else if (g === max) {
      h = 2 + (b - r) / delta;
    } else if (b === max) {
      h = 4 + (r - g) / delta;
    }
    h = Math.min(h * 60, 360);
    if (h < 0) {
      h += 360;
    }
    const l = (min + max) / 2;
    if (max === min) {
      s = 0;
    } else if (l <= 0.5) {
      s = delta / (max + min);
    } else {
      s = delta / (2 - max - min);
    }
    return [h, s * 100, l * 100];
  };
  convert.rgb.hsv = function(rgb) {
    let rdif;
    let gdif;
    let bdif;
    let h;
    let s;
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const v = Math.max(r, g, b);
    const diff = v - Math.min(r, g, b);
    const diffc = function(c) {
      return (v - c) / 6 / diff + 1 / 2;
    };
    if (diff === 0) {
      h = 0;
      s = 0;
    } else {
      s = diff / v;
      rdif = diffc(r);
      gdif = diffc(g);
      bdif = diffc(b);
      if (r === v) {
        h = bdif - gdif;
      } else if (g === v) {
        h = 1 / 3 + rdif - bdif;
      } else if (b === v) {
        h = 2 / 3 + gdif - rdif;
      }
      if (h < 0) {
        h += 1;
      } else if (h > 1) {
        h -= 1;
      }
    }
    return [
      h * 360,
      s * 100,
      v * 100
    ];
  };
  convert.rgb.hwb = function(rgb) {
    const r = rgb[0];
    const g = rgb[1];
    let b = rgb[2];
    const h = convert.rgb.hsl(rgb)[0];
    const w = 1 / 255 * Math.min(r, Math.min(g, b));
    b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));
    return [h, w * 100, b * 100];
  };
  convert.rgb.cmyk = function(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const k = Math.min(1 - r, 1 - g, 1 - b);
    const c = (1 - r - k) / (1 - k) || 0;
    const m = (1 - g - k) / (1 - k) || 0;
    const y = (1 - b - k) / (1 - k) || 0;
    return [c * 100, m * 100, y * 100, k * 100];
  };
  function comparativeDistance(x, y) {
    return (x[0] - y[0]) ** 2 + (x[1] - y[1]) ** 2 + (x[2] - y[2]) ** 2;
  }
  convert.rgb.keyword = function(rgb) {
    const reversed = reverseKeywords[rgb];
    if (reversed) {
      return reversed;
    }
    let currentClosestDistance = Infinity;
    let currentClosestKeyword;
    for (const keyword of Object.keys(cssKeywords)) {
      const value = cssKeywords[keyword];
      const distance = comparativeDistance(rgb, value);
      if (distance < currentClosestDistance) {
        currentClosestDistance = distance;
        currentClosestKeyword = keyword;
      }
    }
    return currentClosestKeyword;
  };
  convert.keyword.rgb = function(keyword) {
    return cssKeywords[keyword];
  };
  convert.rgb.xyz = function(rgb) {
    let r = rgb[0] / 255;
    let g = rgb[1] / 255;
    let b = rgb[2] / 255;
    r = r > 0.04045 ? ((r + 0.055) / 1.055) ** 2.4 : r / 12.92;
    g = g > 0.04045 ? ((g + 0.055) / 1.055) ** 2.4 : g / 12.92;
    b = b > 0.04045 ? ((b + 0.055) / 1.055) ** 2.4 : b / 12.92;
    const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
    const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
    return [x * 100, y * 100, z * 100];
  };
  convert.rgb.lab = function(rgb) {
    const xyz = convert.rgb.xyz(rgb);
    let x = xyz[0];
    let y = xyz[1];
    let z = xyz[2];
    x /= 95.047;
    y /= 100;
    z /= 108.883;
    x = x > 0.008856 ? x ** (1 / 3) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? y ** (1 / 3) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? z ** (1 / 3) : 7.787 * z + 16 / 116;
    const l = 116 * y - 16;
    const a = 500 * (x - y);
    const b = 200 * (y - z);
    return [l, a, b];
  };
  convert.hsl.rgb = function(hsl) {
    const h = hsl[0] / 360;
    const s = hsl[1] / 100;
    const l = hsl[2] / 100;
    let t2;
    let t3;
    let val;
    if (s === 0) {
      val = l * 255;
      return [val, val, val];
    }
    if (l < 0.5) {
      t2 = l * (1 + s);
    } else {
      t2 = l + s - l * s;
    }
    const t1 = 2 * l - t2;
    const rgb = [0, 0, 0];
    for (let i = 0;i < 3; i++) {
      t3 = h + 1 / 3 * -(i - 1);
      if (t3 < 0) {
        t3++;
      }
      if (t3 > 1) {
        t3--;
      }
      if (6 * t3 < 1) {
        val = t1 + (t2 - t1) * 6 * t3;
      } else if (2 * t3 < 1) {
        val = t2;
      } else if (3 * t3 < 2) {
        val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
      } else {
        val = t1;
      }
      rgb[i] = val * 255;
    }
    return rgb;
  };
  convert.hsl.hsv = function(hsl) {
    const h = hsl[0];
    let s = hsl[1] / 100;
    let l = hsl[2] / 100;
    let smin = s;
    const lmin = Math.max(l, 0.01);
    l *= 2;
    s *= l <= 1 ? l : 2 - l;
    smin *= lmin <= 1 ? lmin : 2 - lmin;
    const v = (l + s) / 2;
    const sv = l === 0 ? 2 * smin / (lmin + smin) : 2 * s / (l + s);
    return [h, sv * 100, v * 100];
  };
  convert.hsv.rgb = function(hsv) {
    const h = hsv[0] / 60;
    const s = hsv[1] / 100;
    let v = hsv[2] / 100;
    const hi = Math.floor(h) % 6;
    const f = h - Math.floor(h);
    const p = 255 * v * (1 - s);
    const q = 255 * v * (1 - s * f);
    const t = 255 * v * (1 - s * (1 - f));
    v *= 255;
    switch (hi) {
      case 0:
        return [v, t, p];
      case 1:
        return [q, v, p];
      case 2:
        return [p, v, t];
      case 3:
        return [p, q, v];
      case 4:
        return [t, p, v];
      case 5:
        return [v, p, q];
    }
  };
  convert.hsv.hsl = function(hsv) {
    const h = hsv[0];
    const s = hsv[1] / 100;
    const v = hsv[2] / 100;
    const vmin = Math.max(v, 0.01);
    let sl;
    let l;
    l = (2 - s) * v;
    const lmin = (2 - s) * vmin;
    sl = s * vmin;
    sl /= lmin <= 1 ? lmin : 2 - lmin;
    sl = sl || 0;
    l /= 2;
    return [h, sl * 100, l * 100];
  };
  convert.hwb.rgb = function(hwb) {
    const h = hwb[0] / 360;
    let wh = hwb[1] / 100;
    let bl = hwb[2] / 100;
    const ratio = wh + bl;
    let f;
    if (ratio > 1) {
      wh /= ratio;
      bl /= ratio;
    }
    const i = Math.floor(6 * h);
    const v = 1 - bl;
    f = 6 * h - i;
    if ((i & 1) !== 0) {
      f = 1 - f;
    }
    const n = wh + f * (v - wh);
    let r;
    let g;
    let b;
    switch (i) {
      default:
      case 6:
      case 0:
        r = v;
        g = n;
        b = wh;
        break;
      case 1:
        r = n;
        g = v;
        b = wh;
        break;
      case 2:
        r = wh;
        g = v;
        b = n;
        break;
      case 3:
        r = wh;
        g = n;
        b = v;
        break;
      case 4:
        r = n;
        g = wh;
        b = v;
        break;
      case 5:
        r = v;
        g = wh;
        b = n;
        break;
    }
    return [r * 255, g * 255, b * 255];
  };
  convert.cmyk.rgb = function(cmyk) {
    const c = cmyk[0] / 100;
    const m = cmyk[1] / 100;
    const y = cmyk[2] / 100;
    const k = cmyk[3] / 100;
    const r = 1 - Math.min(1, c * (1 - k) + k);
    const g = 1 - Math.min(1, m * (1 - k) + k);
    const b = 1 - Math.min(1, y * (1 - k) + k);
    return [r * 255, g * 255, b * 255];
  };
  convert.xyz.rgb = function(xyz) {
    const x = xyz[0] / 100;
    const y = xyz[1] / 100;
    const z = xyz[2] / 100;
    let r;
    let g;
    let b;
    r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    b = x * 0.0557 + y * -0.204 + z * 1.057;
    r = r > 0.0031308 ? 1.055 * r ** (1 / 2.4) - 0.055 : r * 12.92;
    g = g > 0.0031308 ? 1.055 * g ** (1 / 2.4) - 0.055 : g * 12.92;
    b = b > 0.0031308 ? 1.055 * b ** (1 / 2.4) - 0.055 : b * 12.92;
    r = Math.min(Math.max(0, r), 1);
    g = Math.min(Math.max(0, g), 1);
    b = Math.min(Math.max(0, b), 1);
    return [r * 255, g * 255, b * 255];
  };
  convert.xyz.lab = function(xyz) {
    let x = xyz[0];
    let y = xyz[1];
    let z = xyz[2];
    x /= 95.047;
    y /= 100;
    z /= 108.883;
    x = x > 0.008856 ? x ** (1 / 3) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? y ** (1 / 3) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? z ** (1 / 3) : 7.787 * z + 16 / 116;
    const l = 116 * y - 16;
    const a = 500 * (x - y);
    const b = 200 * (y - z);
    return [l, a, b];
  };
  convert.lab.xyz = function(lab) {
    const l = lab[0];
    const a = lab[1];
    const b = lab[2];
    let x;
    let y;
    let z;
    y = (l + 16) / 116;
    x = a / 500 + y;
    z = y - b / 200;
    const y2 = y ** 3;
    const x2 = x ** 3;
    const z2 = z ** 3;
    y = y2 > 0.008856 ? y2 : (y - 16 / 116) / 7.787;
    x = x2 > 0.008856 ? x2 : (x - 16 / 116) / 7.787;
    z = z2 > 0.008856 ? z2 : (z - 16 / 116) / 7.787;
    x *= 95.047;
    y *= 100;
    z *= 108.883;
    return [x, y, z];
  };
  convert.lab.lch = function(lab) {
    const l = lab[0];
    const a = lab[1];
    const b = lab[2];
    let h;
    const hr = Math.atan2(b, a);
    h = hr * 360 / 2 / Math.PI;
    if (h < 0) {
      h += 360;
    }
    const c = Math.sqrt(a * a + b * b);
    return [l, c, h];
  };
  convert.lch.lab = function(lch) {
    const l = lch[0];
    const c = lch[1];
    const h = lch[2];
    const hr = h / 360 * 2 * Math.PI;
    const a = c * Math.cos(hr);
    const b = c * Math.sin(hr);
    return [l, a, b];
  };
  convert.rgb.ansi16 = function(args, saturation = null) {
    const [r, g, b] = args;
    let value = saturation === null ? convert.rgb.hsv(args)[2] : saturation;
    value = Math.round(value / 50);
    if (value === 0) {
      return 30;
    }
    let ansi = 30 + (Math.round(b / 255) << 2 | Math.round(g / 255) << 1 | Math.round(r / 255));
    if (value === 2) {
      ansi += 60;
    }
    return ansi;
  };
  convert.hsv.ansi16 = function(args) {
    return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
  };
  convert.rgb.ansi256 = function(args) {
    const r = args[0];
    const g = args[1];
    const b = args[2];
    if (r === g && g === b) {
      if (r < 8) {
        return 16;
      }
      if (r > 248) {
        return 231;
      }
      return Math.round((r - 8) / 247 * 24) + 232;
    }
    const ansi = 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
    return ansi;
  };
  convert.ansi16.rgb = function(args) {
    let color = args % 10;
    if (color === 0 || color === 7) {
      if (args > 50) {
        color += 3.5;
      }
      color = color / 10.5 * 255;
      return [color, color, color];
    }
    const mult = (~~(args > 50) + 1) * 0.5;
    const r = (color & 1) * mult * 255;
    const g = (color >> 1 & 1) * mult * 255;
    const b = (color >> 2 & 1) * mult * 255;
    return [r, g, b];
  };
  convert.ansi256.rgb = function(args) {
    if (args >= 232) {
      const c = (args - 232) * 10 + 8;
      return [c, c, c];
    }
    args -= 16;
    let rem;
    const r = Math.floor(args / 36) / 5 * 255;
    const g = Math.floor((rem = args % 36) / 6) / 5 * 255;
    const b = rem % 6 / 5 * 255;
    return [r, g, b];
  };
  convert.rgb.hex = function(args) {
    const integer = ((Math.round(args[0]) & 255) << 16) + ((Math.round(args[1]) & 255) << 8) + (Math.round(args[2]) & 255);
    const string = integer.toString(16).toUpperCase();
    return "000000".substring(string.length) + string;
  };
  convert.hex.rgb = function(args) {
    const match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
    if (!match) {
      return [0, 0, 0];
    }
    let colorString = match[0];
    if (match[0].length === 3) {
      colorString = colorString.split("").map((char) => {
        return char + char;
      }).join("");
    }
    const integer = parseInt(colorString, 16);
    const r = integer >> 16 & 255;
    const g = integer >> 8 & 255;
    const b = integer & 255;
    return [r, g, b];
  };
  convert.rgb.hcg = function(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    const max = Math.max(Math.max(r, g), b);
    const min = Math.min(Math.min(r, g), b);
    const chroma = max - min;
    let grayscale;
    let hue;
    if (chroma < 1) {
      grayscale = min / (1 - chroma);
    } else {
      grayscale = 0;
    }
    if (chroma <= 0) {
      hue = 0;
    } else if (max === r) {
      hue = (g - b) / chroma % 6;
    } else if (max === g) {
      hue = 2 + (b - r) / chroma;
    } else {
      hue = 4 + (r - g) / chroma;
    }
    hue /= 6;
    hue %= 1;
    return [hue * 360, chroma * 100, grayscale * 100];
  };
  convert.hsl.hcg = function(hsl) {
    const s = hsl[1] / 100;
    const l = hsl[2] / 100;
    const c = l < 0.5 ? 2 * s * l : 2 * s * (1 - l);
    let f = 0;
    if (c < 1) {
      f = (l - 0.5 * c) / (1 - c);
    }
    return [hsl[0], c * 100, f * 100];
  };
  convert.hsv.hcg = function(hsv) {
    const s = hsv[1] / 100;
    const v = hsv[2] / 100;
    const c = s * v;
    let f = 0;
    if (c < 1) {
      f = (v - c) / (1 - c);
    }
    return [hsv[0], c * 100, f * 100];
  };
  convert.hcg.rgb = function(hcg) {
    const h = hcg[0] / 360;
    const c = hcg[1] / 100;
    const g = hcg[2] / 100;
    if (c === 0) {
      return [g * 255, g * 255, g * 255];
    }
    const pure = [0, 0, 0];
    const hi = h % 1 * 6;
    const v = hi % 1;
    const w = 1 - v;
    let mg = 0;
    switch (Math.floor(hi)) {
      case 0:
        pure[0] = 1;
        pure[1] = v;
        pure[2] = 0;
        break;
      case 1:
        pure[0] = w;
        pure[1] = 1;
        pure[2] = 0;
        break;
      case 2:
        pure[0] = 0;
        pure[1] = 1;
        pure[2] = v;
        break;
      case 3:
        pure[0] = 0;
        pure[1] = w;
        pure[2] = 1;
        break;
      case 4:
        pure[0] = v;
        pure[1] = 0;
        pure[2] = 1;
        break;
      default:
        pure[0] = 1;
        pure[1] = 0;
        pure[2] = w;
    }
    mg = (1 - c) * g;
    return [
      (c * pure[0] + mg) * 255,
      (c * pure[1] + mg) * 255,
      (c * pure[2] + mg) * 255
    ];
  };
  convert.hcg.hsv = function(hcg) {
    const c = hcg[1] / 100;
    const g = hcg[2] / 100;
    const v = c + g * (1 - c);
    let f = 0;
    if (v > 0) {
      f = c / v;
    }
    return [hcg[0], f * 100, v * 100];
  };
  convert.hcg.hsl = function(hcg) {
    const c = hcg[1] / 100;
    const g = hcg[2] / 100;
    const l = g * (1 - c) + 0.5 * c;
    let s = 0;
    if (l > 0 && l < 0.5) {
      s = c / (2 * l);
    } else if (l >= 0.5 && l < 1) {
      s = c / (2 * (1 - l));
    }
    return [hcg[0], s * 100, l * 100];
  };
  convert.hcg.hwb = function(hcg) {
    const c = hcg[1] / 100;
    const g = hcg[2] / 100;
    const v = c + g * (1 - c);
    return [hcg[0], (v - c) * 100, (1 - v) * 100];
  };
  convert.hwb.hcg = function(hwb) {
    const w = hwb[1] / 100;
    const b = hwb[2] / 100;
    const v = 1 - b;
    const c = v - w;
    let g = 0;
    if (c < 1) {
      g = (v - c) / (1 - c);
    }
    return [hwb[0], c * 100, g * 100];
  };
  convert.apple.rgb = function(apple) {
    return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
  };
  convert.rgb.apple = function(rgb) {
    return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
  };
  convert.gray.rgb = function(args) {
    return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
  };
  convert.gray.hsl = function(args) {
    return [0, 0, args[0]];
  };
  convert.gray.hsv = convert.gray.hsl;
  convert.gray.hwb = function(gray) {
    return [0, 100, gray[0]];
  };
  convert.gray.cmyk = function(gray) {
    return [0, 0, 0, gray[0]];
  };
  convert.gray.lab = function(gray) {
    return [gray[0], 0, 0];
  };
  convert.gray.hex = function(gray) {
    const val = Math.round(gray[0] / 100 * 255) & 255;
    const integer = (val << 16) + (val << 8) + val;
    const string = integer.toString(16).toUpperCase();
    return "000000".substring(string.length) + string;
  };
  convert.rgb.gray = function(rgb) {
    const val = (rgb[0] + rgb[1] + rgb[2]) / 3;
    return [val / 255 * 100];
  };
});

// node_modules/color-convert/route.js
var require_route = __commonJS((exports, module) => {
  var conversions = require_conversions();
  function buildGraph() {
    const graph = {};
    const models = Object.keys(conversions);
    for (let len = models.length, i = 0;i < len; i++) {
      graph[models[i]] = {
        distance: -1,
        parent: null
      };
    }
    return graph;
  }
  function deriveBFS(fromModel) {
    const graph = buildGraph();
    const queue = [fromModel];
    graph[fromModel].distance = 0;
    while (queue.length) {
      const current = queue.pop();
      const adjacents = Object.keys(conversions[current]);
      for (let len = adjacents.length, i = 0;i < len; i++) {
        const adjacent = adjacents[i];
        const node = graph[adjacent];
        if (node.distance === -1) {
          node.distance = graph[current].distance + 1;
          node.parent = current;
          queue.unshift(adjacent);
        }
      }
    }
    return graph;
  }
  function link(from, to) {
    return function(args) {
      return to(from(args));
    };
  }
  function wrapConversion(toModel, graph) {
    const path = [graph[toModel].parent, toModel];
    let fn = conversions[graph[toModel].parent][toModel];
    let cur = graph[toModel].parent;
    while (graph[cur].parent) {
      path.unshift(graph[cur].parent);
      fn = link(conversions[graph[cur].parent][cur], fn);
      cur = graph[cur].parent;
    }
    fn.conversion = path;
    return fn;
  }
  module.exports = function(fromModel) {
    const graph = deriveBFS(fromModel);
    const conversion = {};
    const models = Object.keys(graph);
    for (let len = models.length, i = 0;i < len; i++) {
      const toModel = models[i];
      const node = graph[toModel];
      if (node.parent === null) {
        continue;
      }
      conversion[toModel] = wrapConversion(toModel, graph);
    }
    return conversion;
  };
});

// node_modules/color-convert/index.js
var require_color_convert = __commonJS((exports, module) => {
  var conversions = require_conversions();
  var route = require_route();
  var convert = {};
  var models = Object.keys(conversions);
  function wrapRaw(fn) {
    const wrappedFn = function(...args) {
      const arg0 = args[0];
      if (arg0 === undefined || arg0 === null) {
        return arg0;
      }
      if (arg0.length > 1) {
        args = arg0;
      }
      return fn(args);
    };
    if ("conversion" in fn) {
      wrappedFn.conversion = fn.conversion;
    }
    return wrappedFn;
  }
  function wrapRounded(fn) {
    const wrappedFn = function(...args) {
      const arg0 = args[0];
      if (arg0 === undefined || arg0 === null) {
        return arg0;
      }
      if (arg0.length > 1) {
        args = arg0;
      }
      const result = fn(args);
      if (typeof result === "object") {
        for (let len = result.length, i = 0;i < len; i++) {
          result[i] = Math.round(result[i]);
        }
      }
      return result;
    };
    if ("conversion" in fn) {
      wrappedFn.conversion = fn.conversion;
    }
    return wrappedFn;
  }
  models.forEach((fromModel) => {
    convert[fromModel] = {};
    Object.defineProperty(convert[fromModel], "channels", { value: conversions[fromModel].channels });
    Object.defineProperty(convert[fromModel], "labels", { value: conversions[fromModel].labels });
    const routes = route(fromModel);
    const routeModels = Object.keys(routes);
    routeModels.forEach((toModel) => {
      const fn = routes[toModel];
      convert[fromModel][toModel] = wrapRounded(fn);
      convert[fromModel][toModel].raw = wrapRaw(fn);
    });
  });
  module.exports = convert;
});

// node_modules/ansi-styles/index.js
var require_ansi_styles = __commonJS((exports, module) => {
  var wrapAnsi162 = (fn, offset) => (...args) => {
    const code = fn(...args);
    return `\x1B[${code + offset}m`;
  };
  var wrapAnsi2562 = (fn, offset) => (...args) => {
    const code = fn(...args);
    return `\x1B[${38 + offset};5;${code}m`;
  };
  var wrapAnsi16m2 = (fn, offset) => (...args) => {
    const rgb = fn(...args);
    return `\x1B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
  };
  var ansi2ansi = (n) => n;
  var rgb2rgb = (r, g, b) => [r, g, b];
  var setLazyProperty = (object, property, get) => {
    Object.defineProperty(object, property, {
      get: () => {
        const value = get();
        Object.defineProperty(object, property, {
          value,
          enumerable: true,
          configurable: true
        });
        return value;
      },
      enumerable: true,
      configurable: true
    });
  };
  var colorConvert;
  var makeDynamicStyles = (wrap, targetSpace, identity, isBackground) => {
    if (colorConvert === undefined) {
      colorConvert = require_color_convert();
    }
    const offset = isBackground ? 10 : 0;
    const styles3 = {};
    for (const [sourceSpace, suite] of Object.entries(colorConvert)) {
      const name = sourceSpace === "ansi16" ? "ansi" : sourceSpace;
      if (sourceSpace === targetSpace) {
        styles3[name] = wrap(identity, offset);
      } else if (typeof suite === "object") {
        styles3[name] = wrap(suite[targetSpace], offset);
      }
    }
    return styles3;
  };
  function assembleStyles2() {
    const codes = new Map;
    const styles3 = {
      modifier: {
        reset: [0, 0],
        bold: [1, 22],
        dim: [2, 22],
        italic: [3, 23],
        underline: [4, 24],
        inverse: [7, 27],
        hidden: [8, 28],
        strikethrough: [9, 29]
      },
      color: {
        black: [30, 39],
        red: [31, 39],
        green: [32, 39],
        yellow: [33, 39],
        blue: [34, 39],
        magenta: [35, 39],
        cyan: [36, 39],
        white: [37, 39],
        blackBright: [90, 39],
        redBright: [91, 39],
        greenBright: [92, 39],
        yellowBright: [93, 39],
        blueBright: [94, 39],
        magentaBright: [95, 39],
        cyanBright: [96, 39],
        whiteBright: [97, 39]
      },
      bgColor: {
        bgBlack: [40, 49],
        bgRed: [41, 49],
        bgGreen: [42, 49],
        bgYellow: [43, 49],
        bgBlue: [44, 49],
        bgMagenta: [45, 49],
        bgCyan: [46, 49],
        bgWhite: [47, 49],
        bgBlackBright: [100, 49],
        bgRedBright: [101, 49],
        bgGreenBright: [102, 49],
        bgYellowBright: [103, 49],
        bgBlueBright: [104, 49],
        bgMagentaBright: [105, 49],
        bgCyanBright: [106, 49],
        bgWhiteBright: [107, 49]
      }
    };
    styles3.color.gray = styles3.color.blackBright;
    styles3.bgColor.bgGray = styles3.bgColor.bgBlackBright;
    styles3.color.grey = styles3.color.blackBright;
    styles3.bgColor.bgGrey = styles3.bgColor.bgBlackBright;
    for (const [groupName, group] of Object.entries(styles3)) {
      for (const [styleName, style] of Object.entries(group)) {
        styles3[styleName] = {
          open: `\x1B[${style[0]}m`,
          close: `\x1B[${style[1]}m`
        };
        group[styleName] = styles3[styleName];
        codes.set(style[0], style[1]);
      }
      Object.defineProperty(styles3, groupName, {
        value: group,
        enumerable: false
      });
    }
    Object.defineProperty(styles3, "codes", {
      value: codes,
      enumerable: false
    });
    styles3.color.close = "\x1B[39m";
    styles3.bgColor.close = "\x1B[49m";
    setLazyProperty(styles3.color, "ansi", () => makeDynamicStyles(wrapAnsi162, "ansi16", ansi2ansi, false));
    setLazyProperty(styles3.color, "ansi256", () => makeDynamicStyles(wrapAnsi2562, "ansi256", ansi2ansi, false));
    setLazyProperty(styles3.color, "ansi16m", () => makeDynamicStyles(wrapAnsi16m2, "rgb", rgb2rgb, false));
    setLazyProperty(styles3.bgColor, "ansi", () => makeDynamicStyles(wrapAnsi162, "ansi16", ansi2ansi, true));
    setLazyProperty(styles3.bgColor, "ansi256", () => makeDynamicStyles(wrapAnsi2562, "ansi256", ansi2ansi, true));
    setLazyProperty(styles3.bgColor, "ansi16m", () => makeDynamicStyles(wrapAnsi16m2, "rgb", rgb2rgb, true));
    return styles3;
  }
  Object.defineProperty(module, "exports", {
    enumerable: true,
    get: assembleStyles2
  });
});

// node_modules/wrap-ansi/index.js
var require_wrap_ansi = __commonJS((exports, module) => {
  var stringWidth2 = require_string_width();
  var stripAnsi2 = require_strip_ansi();
  var ansiStyles2 = require_ansi_styles();
  var ESCAPES = new Set([
    "\x1B",
    ""
  ]);
  var END_CODE = 39;
  var wrapAnsi = (code) => `${ESCAPES.values().next().value}[${code}m`;
  var wordLengths = (string) => string.split(" ").map((character) => stringWidth2(character));
  var wrapWord = (rows, word, columns) => {
    const characters = [...word];
    let isInsideEscape = false;
    let visible = stringWidth2(stripAnsi2(rows[rows.length - 1]));
    for (const [index, character] of characters.entries()) {
      const characterLength = stringWidth2(character);
      if (visible + characterLength <= columns) {
        rows[rows.length - 1] += character;
      } else {
        rows.push(character);
        visible = 0;
      }
      if (ESCAPES.has(character)) {
        isInsideEscape = true;
      } else if (isInsideEscape && character === "m") {
        isInsideEscape = false;
        continue;
      }
      if (isInsideEscape) {
        continue;
      }
      visible += characterLength;
      if (visible === columns && index < characters.length - 1) {
        rows.push("");
        visible = 0;
      }
    }
    if (!visible && rows[rows.length - 1].length > 0 && rows.length > 1) {
      rows[rows.length - 2] += rows.pop();
    }
  };
  var stringVisibleTrimSpacesRight = (str) => {
    const words = str.split(" ");
    let last = words.length;
    while (last > 0) {
      if (stringWidth2(words[last - 1]) > 0) {
        break;
      }
      last--;
    }
    if (last === words.length) {
      return str;
    }
    return words.slice(0, last).join(" ") + words.slice(last).join("");
  };
  var exec = (string, columns, options = {}) => {
    if (options.trim !== false && string.trim() === "") {
      return "";
    }
    let pre = "";
    let ret = "";
    let escapeCode;
    const lengths = wordLengths(string);
    let rows = [""];
    for (const [index, word] of string.split(" ").entries()) {
      if (options.trim !== false) {
        rows[rows.length - 1] = rows[rows.length - 1].trimLeft();
      }
      let rowLength = stringWidth2(rows[rows.length - 1]);
      if (index !== 0) {
        if (rowLength >= columns && (options.wordWrap === false || options.trim === false)) {
          rows.push("");
          rowLength = 0;
        }
        if (rowLength > 0 || options.trim === false) {
          rows[rows.length - 1] += " ";
          rowLength++;
        }
      }
      if (options.hard && lengths[index] > columns) {
        const remainingColumns = columns - rowLength;
        const breaksStartingThisLine = 1 + Math.floor((lengths[index] - remainingColumns - 1) / columns);
        const breaksStartingNextLine = Math.floor((lengths[index] - 1) / columns);
        if (breaksStartingNextLine < breaksStartingThisLine) {
          rows.push("");
        }
        wrapWord(rows, word, columns);
        continue;
      }
      if (rowLength + lengths[index] > columns && rowLength > 0 && lengths[index] > 0) {
        if (options.wordWrap === false && rowLength < columns) {
          wrapWord(rows, word, columns);
          continue;
        }
        rows.push("");
      }
      if (rowLength + lengths[index] > columns && options.wordWrap === false) {
        wrapWord(rows, word, columns);
        continue;
      }
      rows[rows.length - 1] += word;
    }
    if (options.trim !== false) {
      rows = rows.map(stringVisibleTrimSpacesRight);
    }
    pre = rows.join(`
`);
    for (const [index, character] of [...pre].entries()) {
      ret += character;
      if (ESCAPES.has(character)) {
        const code2 = parseFloat(/\d[^m]*/.exec(pre.slice(index, index + 4)));
        escapeCode = code2 === END_CODE ? null : code2;
      }
      const code = ansiStyles2.codes.get(Number(escapeCode));
      if (escapeCode && code) {
        if (pre[index + 1] === `
`) {
          ret += wrapAnsi(code);
        } else if (character === `
`) {
          ret += wrapAnsi(escapeCode);
        }
      }
    }
    return ret;
  };
  module.exports = (string, columns, options) => {
    return String(string).normalize().replace(/\r\n/g, `
`).split(`
`).map((line) => exec(line, columns, options)).join(`
`);
  };
});

// node_modules/mute-stream/lib/index.js
var require_lib2 = __commonJS((exports, module) => {
  var Stream = __require("stream");

  class MuteStream extends Stream {
    #isTTY = null;
    constructor(opts = {}) {
      super(opts);
      this.writable = this.readable = true;
      this.muted = false;
      this.on("pipe", this._onpipe);
      this.replace = opts.replace;
      this._prompt = opts.prompt || null;
      this._hadControl = false;
    }
    #destSrc(key, def) {
      if (this._dest) {
        return this._dest[key];
      }
      if (this._src) {
        return this._src[key];
      }
      return def;
    }
    #proxy(method, ...args) {
      if (typeof this._dest?.[method] === "function") {
        this._dest[method](...args);
      }
      if (typeof this._src?.[method] === "function") {
        this._src[method](...args);
      }
    }
    get isTTY() {
      if (this.#isTTY !== null) {
        return this.#isTTY;
      }
      return this.#destSrc("isTTY", false);
    }
    set isTTY(val) {
      this.#isTTY = val;
    }
    get rows() {
      return this.#destSrc("rows");
    }
    get columns() {
      return this.#destSrc("columns");
    }
    mute() {
      this.muted = true;
    }
    unmute() {
      this.muted = false;
    }
    _onpipe(src) {
      this._src = src;
    }
    pipe(dest, options) {
      this._dest = dest;
      return super.pipe(dest, options);
    }
    pause() {
      if (this._src) {
        return this._src.pause();
      }
    }
    resume() {
      if (this._src) {
        return this._src.resume();
      }
    }
    write(c) {
      if (this.muted) {
        if (!this.replace) {
          return true;
        }
        if (c.match(/^\u001b/)) {
          if (c.indexOf(this._prompt) === 0) {
            c = c.slice(this._prompt.length);
            c = c.replace(/./g, this.replace);
            c = this._prompt + c;
          }
          this._hadControl = true;
          return this.emit("data", c);
        } else {
          if (this._prompt && this._hadControl && c.indexOf(this._prompt) === 0) {
            this._hadControl = false;
            this.emit("data", this._prompt);
            c = c.slice(this._prompt.length);
          }
          c = c.toString().replace(/./g, this.replace);
        }
      }
      this.emit("data", c);
    }
    end(c) {
      if (this.muted) {
        if (c && this.replace) {
          c = c.toString().replace(/./g, this.replace);
        } else {
          c = null;
        }
      }
      if (c) {
        this.emit("data", c);
      }
      this.emit("end");
    }
    destroy(...args) {
      return this.#proxy("destroy", ...args);
    }
    destroySoon(...args) {
      return this.#proxy("destroySoon", ...args);
    }
    close(...args) {
      return this.#proxy("close", ...args);
    }
  }
  module.exports = MuteStream;
});

// node_modules/ansi-escapes/index.js
var require_ansi_escapes = __commonJS((exports, module) => {
  var ansiEscapes = exports;
  exports.default = ansiEscapes;
  var ESC = "\x1B[";
  var OSC = "\x1B]";
  var BEL = "\x07";
  var SEP = ";";
  var isTerminalApp = process.env.TERM_PROGRAM === "Apple_Terminal";
  ansiEscapes.cursorTo = (x, y) => {
    if (typeof x !== "number") {
      throw new TypeError("The `x` argument is required");
    }
    if (typeof y !== "number") {
      return ESC + (x + 1) + "G";
    }
    return ESC + (y + 1) + ";" + (x + 1) + "H";
  };
  ansiEscapes.cursorMove = (x, y) => {
    if (typeof x !== "number") {
      throw new TypeError("The `x` argument is required");
    }
    let ret = "";
    if (x < 0) {
      ret += ESC + -x + "D";
    } else if (x > 0) {
      ret += ESC + x + "C";
    }
    if (y < 0) {
      ret += ESC + -y + "A";
    } else if (y > 0) {
      ret += ESC + y + "B";
    }
    return ret;
  };
  ansiEscapes.cursorUp = (count = 1) => ESC + count + "A";
  ansiEscapes.cursorDown = (count = 1) => ESC + count + "B";
  ansiEscapes.cursorForward = (count = 1) => ESC + count + "C";
  ansiEscapes.cursorBackward = (count = 1) => ESC + count + "D";
  ansiEscapes.cursorLeft = ESC + "G";
  ansiEscapes.cursorSavePosition = isTerminalApp ? "\x1B7" : ESC + "s";
  ansiEscapes.cursorRestorePosition = isTerminalApp ? "\x1B8" : ESC + "u";
  ansiEscapes.cursorGetPosition = ESC + "6n";
  ansiEscapes.cursorNextLine = ESC + "E";
  ansiEscapes.cursorPrevLine = ESC + "F";
  ansiEscapes.cursorHide = ESC + "?25l";
  ansiEscapes.cursorShow = ESC + "?25h";
  ansiEscapes.eraseLines = (count) => {
    let clear = "";
    for (let i = 0;i < count; i++) {
      clear += ansiEscapes.eraseLine + (i < count - 1 ? ansiEscapes.cursorUp() : "");
    }
    if (count) {
      clear += ansiEscapes.cursorLeft;
    }
    return clear;
  };
  ansiEscapes.eraseEndLine = ESC + "K";
  ansiEscapes.eraseStartLine = ESC + "1K";
  ansiEscapes.eraseLine = ESC + "2K";
  ansiEscapes.eraseDown = ESC + "J";
  ansiEscapes.eraseUp = ESC + "1J";
  ansiEscapes.eraseScreen = ESC + "2J";
  ansiEscapes.scrollUp = ESC + "S";
  ansiEscapes.scrollDown = ESC + "T";
  ansiEscapes.clearScreen = "\x1Bc";
  ansiEscapes.clearTerminal = process.platform === "win32" ? `${ansiEscapes.eraseScreen}${ESC}0f` : `${ansiEscapes.eraseScreen}${ESC}3J${ESC}H`;
  ansiEscapes.beep = BEL;
  ansiEscapes.link = (text, url) => {
    return [
      OSC,
      "8",
      SEP,
      SEP,
      url,
      BEL,
      text,
      OSC,
      "8",
      SEP,
      SEP,
      BEL
    ].join("");
  };
  ansiEscapes.image = (buffer, options = {}) => {
    let ret = `${OSC}1337;File=inline=1`;
    if (options.width) {
      ret += `;width=${options.width}`;
    }
    if (options.height) {
      ret += `;height=${options.height}`;
    }
    if (options.preserveAspectRatio === false) {
      ret += ";preserveAspectRatio=0";
    }
    return ret + ":" + buffer.toString("base64") + BEL;
  };
  ansiEscapes.iTerm = {
    setCwd: (cwd = process.cwd()) => `${OSC}50;CurrentDir=${cwd}${BEL}`,
    annotation: (message, options = {}) => {
      let ret = `${OSC}1337;`;
      const hasX = typeof options.x !== "undefined";
      const hasY = typeof options.y !== "undefined";
      if ((hasX || hasY) && !(hasX && hasY && typeof options.length !== "undefined")) {
        throw new Error("`x`, `y` and `length` must be defined when `x` or `y` is defined");
      }
      message = message.replace(/\|/g, "");
      ret += options.isHidden ? "AddHiddenAnnotation=" : "AddAnnotation=";
      if (options.length > 0) {
        ret += (hasX ? [message, options.length, options.x, options.y] : [options.length, message]).join("|");
      } else {
        ret += message;
      }
      return ret + BEL;
    }
  };
});

// node_modules/chardet/match.js
var require_match = __commonJS((exports, module) => {
  module.exports = function(det, rec, confidence, name, lang) {
    this.confidence = confidence;
    this.name = name || rec.name(det);
    this.lang = lang;
  };
});

// node_modules/chardet/encoding/utf8.js
var require_utf8 = __commonJS((exports, module) => {
  var Match = require_match();
  module.exports = function() {
    this.name = function() {
      return "UTF-8";
    };
    this.match = function(det) {
      var hasBOM = false, numValid = 0, numInvalid = 0, input = det.fRawInput, trailBytes = 0, confidence;
      if (det.fRawLength >= 3 && (input[0] & 255) == 239 && (input[1] & 255) == 187 && (input[2] & 255) == 191) {
        hasBOM = true;
      }
      for (var i = 0;i < det.fRawLength; i++) {
        var b = input[i];
        if ((b & 128) == 0)
          continue;
        if ((b & 224) == 192) {
          trailBytes = 1;
        } else if ((b & 240) == 224) {
          trailBytes = 2;
        } else if ((b & 248) == 240) {
          trailBytes = 3;
        } else {
          numInvalid++;
          if (numInvalid > 5)
            break;
          trailBytes = 0;
        }
        for (;; ) {
          i++;
          if (i >= det.fRawLength)
            break;
          if ((input[i] & 192) != 128) {
            numInvalid++;
            break;
          }
          if (--trailBytes == 0) {
            numValid++;
            break;
          }
        }
      }
      confidence = 0;
      if (hasBOM && numInvalid == 0)
        confidence = 100;
      else if (hasBOM && numValid > numInvalid * 10)
        confidence = 80;
      else if (numValid > 3 && numInvalid == 0)
        confidence = 100;
      else if (numValid > 0 && numInvalid == 0)
        confidence = 80;
      else if (numValid == 0 && numInvalid == 0)
        confidence = 10;
      else if (numValid > numInvalid * 10)
        confidence = 25;
      else
        return null;
      return new Match(det, this, confidence);
    };
  };
});

// node_modules/chardet/encoding/unicode.js
var require_unicode = __commonJS((exports, module) => {
  var util = __require("util");
  var Match = require_match();
  exports.UTF_16BE = function() {
    this.name = function() {
      return "UTF-16BE";
    };
    this.match = function(det) {
      var input = det.fRawInput;
      if (input.length >= 2 && ((input[0] & 255) == 254 && (input[1] & 255) == 255)) {
        return new Match(det, this, 100);
      }
      return null;
    };
  };
  exports.UTF_16LE = function() {
    this.name = function() {
      return "UTF-16LE";
    };
    this.match = function(det) {
      var input = det.fRawInput;
      if (input.length >= 2 && ((input[0] & 255) == 255 && (input[1] & 255) == 254)) {
        if (input.length >= 4 && input[2] == 0 && input[3] == 0) {
          return null;
        }
        return new Match(det, this, 100);
      }
      return null;
    };
  };
  function UTF_32() {
  }
  UTF_32.prototype.match = function(det) {
    var input = det.fRawInput, limit = det.fRawLength / 4 * 4, numValid = 0, numInvalid = 0, hasBOM = false, confidence = 0;
    if (limit == 0) {
      return null;
    }
    if (this.getChar(input, 0) == 65279) {
      hasBOM = true;
    }
    for (var i = 0;i < limit; i += 4) {
      var ch = this.getChar(input, i);
      if (ch < 0 || ch >= 1114111 || ch >= 55296 && ch <= 57343) {
        numInvalid += 1;
      } else {
        numValid += 1;
      }
    }
    if (hasBOM && numInvalid == 0) {
      confidence = 100;
    } else if (hasBOM && numValid > numInvalid * 10) {
      confidence = 80;
    } else if (numValid > 3 && numInvalid == 0) {
      confidence = 100;
    } else if (numValid > 0 && numInvalid == 0) {
      confidence = 80;
    } else if (numValid > numInvalid * 10) {
      confidence = 25;
    }
    return confidence == 0 ? null : new Match(det, this, confidence);
  };
  exports.UTF_32BE = function() {
    this.name = function() {
      return "UTF-32BE";
    };
    this.getChar = function(input, index) {
      return (input[index + 0] & 255) << 24 | (input[index + 1] & 255) << 16 | (input[index + 2] & 255) << 8 | input[index + 3] & 255;
    };
  };
  util.inherits(exports.UTF_32BE, UTF_32);
  exports.UTF_32LE = function() {
    this.name = function() {
      return "UTF-32LE";
    };
    this.getChar = function(input, index) {
      return (input[index + 3] & 255) << 24 | (input[index + 2] & 255) << 16 | (input[index + 1] & 255) << 8 | input[index + 0] & 255;
    };
  };
  util.inherits(exports.UTF_32LE, UTF_32);
});

// node_modules/chardet/encoding/mbcs.js
var require_mbcs = __commonJS((exports, module) => {
  var util = __require("util");
  var Match = require_match();
  function binarySearch(arr, searchValue) {
    function find(arr2, searchValue2, left, right) {
      if (right < left)
        return -1;
      var mid = Math.floor(left + right >>> 1);
      if (searchValue2 > arr2[mid])
        return find(arr2, searchValue2, mid + 1, right);
      if (searchValue2 < arr2[mid])
        return find(arr2, searchValue2, left, mid - 1);
      return mid;
    }
    return find(arr, searchValue, 0, arr.length - 1);
  }
  function IteratedChar() {
    this.charValue = 0;
    this.index = 0;
    this.nextIndex = 0;
    this.error = false;
    this.done = false;
    this.reset = function() {
      this.charValue = 0;
      this.index = -1;
      this.nextIndex = 0;
      this.error = false;
      this.done = false;
    };
    this.nextByte = function(det) {
      if (this.nextIndex >= det.fRawLength) {
        this.done = true;
        return -1;
      }
      var byteValue = det.fRawInput[this.nextIndex++] & 255;
      return byteValue;
    };
  }
  function mbcs() {
  }
  mbcs.prototype.match = function(det) {
    var singleByteCharCount = 0, doubleByteCharCount = 0, commonCharCount = 0, badCharCount = 0, totalCharCount = 0, confidence = 0;
    var iter = new IteratedChar;
    detectBlock: {
      for (iter.reset();this.nextChar(iter, det); ) {
        totalCharCount++;
        if (iter.error) {
          badCharCount++;
        } else {
          var cv = iter.charValue & 4294967295;
          if (cv <= 255) {
            singleByteCharCount++;
          } else {
            doubleByteCharCount++;
            if (this.commonChars != null) {
              if (binarySearch(this.commonChars, cv) >= 0) {
                commonCharCount++;
              }
            }
          }
        }
        if (badCharCount >= 2 && badCharCount * 5 >= doubleByteCharCount) {
          break detectBlock;
        }
      }
      if (doubleByteCharCount <= 10 && badCharCount == 0) {
        if (doubleByteCharCount == 0 && totalCharCount < 10) {
          confidence = 0;
        } else {
          confidence = 10;
        }
        break detectBlock;
      }
      if (doubleByteCharCount < 20 * badCharCount) {
        confidence = 0;
        break detectBlock;
      }
      if (this.commonChars == null) {
        confidence = 30 + doubleByteCharCount - 20 * badCharCount;
        if (confidence > 100) {
          confidence = 100;
        }
      } else {
        var maxVal = Math.log(parseFloat(doubleByteCharCount) / 4);
        var scaleFactor = 90 / maxVal;
        confidence = Math.floor(Math.log(commonCharCount + 1) * scaleFactor + 10);
        confidence = Math.min(confidence, 100);
      }
    }
    return confidence == 0 ? null : new Match(det, this, confidence);
  };
  mbcs.prototype.nextChar = function(iter, det) {
  };
  exports.sjis = function() {
    this.name = function() {
      return "Shift-JIS";
    };
    this.language = function() {
      return "ja";
    };
    this.commonChars = [
      33088,
      33089,
      33090,
      33093,
      33115,
      33129,
      33130,
      33141,
      33142,
      33440,
      33442,
      33444,
      33449,
      33450,
      33451,
      33453,
      33455,
      33457,
      33459,
      33461,
      33463,
      33469,
      33470,
      33473,
      33476,
      33477,
      33478,
      33480,
      33481,
      33484,
      33485,
      33500,
      33504,
      33511,
      33512,
      33513,
      33514,
      33520,
      33521,
      33601,
      33603,
      33614,
      33615,
      33624,
      33630,
      33634,
      33639,
      33653,
      33654,
      33673,
      33674,
      33675,
      33677,
      33683,
      36502,
      37882,
      38314
    ];
    this.nextChar = function(iter, det) {
      iter.index = iter.nextIndex;
      iter.error = false;
      var firstByte;
      firstByte = iter.charValue = iter.nextByte(det);
      if (firstByte < 0)
        return false;
      if (firstByte <= 127 || firstByte > 160 && firstByte <= 223)
        return true;
      var secondByte = iter.nextByte(det);
      if (secondByte < 0)
        return false;
      iter.charValue = firstByte << 8 | secondByte;
      if (!(secondByte >= 64 && secondByte <= 127 || secondByte >= 128 && secondByte <= 255)) {
        iter.error = true;
      }
      return true;
    };
  };
  util.inherits(exports.sjis, mbcs);
  exports.big5 = function() {
    this.name = function() {
      return "Big5";
    };
    this.language = function() {
      return "zh";
    };
    this.commonChars = [
      41280,
      41281,
      41282,
      41283,
      41287,
      41289,
      41333,
      41334,
      42048,
      42054,
      42055,
      42056,
      42065,
      42068,
      42071,
      42084,
      42090,
      42092,
      42103,
      42147,
      42148,
      42151,
      42177,
      42190,
      42193,
      42207,
      42216,
      42237,
      42304,
      42312,
      42328,
      42345,
      42445,
      42471,
      42583,
      42593,
      42594,
      42600,
      42608,
      42664,
      42675,
      42681,
      42707,
      42715,
      42726,
      42738,
      42816,
      42833,
      42841,
      42970,
      43171,
      43173,
      43181,
      43217,
      43219,
      43236,
      43260,
      43456,
      43474,
      43507,
      43627,
      43706,
      43710,
      43724,
      43772,
      44103,
      44111,
      44208,
      44242,
      44377,
      44745,
      45024,
      45290,
      45423,
      45747,
      45764,
      45935,
      46156,
      46158,
      46412,
      46501,
      46525,
      46544,
      46552,
      46705,
      47085,
      47207,
      47428,
      47832,
      47940,
      48033,
      48593,
      49860,
      50105,
      50240,
      50271
    ];
    this.nextChar = function(iter, det) {
      iter.index = iter.nextIndex;
      iter.error = false;
      var firstByte = iter.charValue = iter.nextByte(det);
      if (firstByte < 0)
        return false;
      if (firstByte <= 127 || firstByte == 255)
        return true;
      var secondByte = iter.nextByte(det);
      if (secondByte < 0)
        return false;
      iter.charValue = iter.charValue << 8 | secondByte;
      if (secondByte < 64 || secondByte == 127 || secondByte == 255)
        iter.error = true;
      return true;
    };
  };
  util.inherits(exports.big5, mbcs);
  function eucNextChar(iter, det) {
    iter.index = iter.nextIndex;
    iter.error = false;
    var firstByte = 0;
    var secondByte = 0;
    var thirdByte = 0;
    buildChar: {
      firstByte = iter.charValue = iter.nextByte(det);
      if (firstByte < 0) {
        iter.done = true;
        break buildChar;
      }
      if (firstByte <= 141) {
        break buildChar;
      }
      secondByte = iter.nextByte(det);
      iter.charValue = iter.charValue << 8 | secondByte;
      if (firstByte >= 161 && firstByte <= 254) {
        if (secondByte < 161) {
          iter.error = true;
        }
        break buildChar;
      }
      if (firstByte == 142) {
        if (secondByte < 161) {
          iter.error = true;
        }
        break buildChar;
      }
      if (firstByte == 143) {
        thirdByte = iter.nextByte(det);
        iter.charValue = iter.charValue << 8 | thirdByte;
        if (thirdByte < 161) {
          iter.error = true;
        }
      }
    }
    return iter.done == false;
  }
  exports.euc_jp = function() {
    this.name = function() {
      return "EUC-JP";
    };
    this.language = function() {
      return "ja";
    };
    this.commonChars = [
      41377,
      41378,
      41379,
      41382,
      41404,
      41418,
      41419,
      41430,
      41431,
      42146,
      42148,
      42150,
      42152,
      42154,
      42155,
      42156,
      42157,
      42159,
      42161,
      42163,
      42165,
      42167,
      42169,
      42171,
      42173,
      42175,
      42176,
      42177,
      42179,
      42180,
      42182,
      42183,
      42184,
      42185,
      42186,
      42187,
      42190,
      42191,
      42192,
      42206,
      42207,
      42209,
      42210,
      42212,
      42216,
      42217,
      42218,
      42219,
      42220,
      42223,
      42226,
      42227,
      42402,
      42403,
      42404,
      42406,
      42407,
      42410,
      42413,
      42415,
      42416,
      42419,
      42421,
      42423,
      42424,
      42425,
      42431,
      42435,
      42438,
      42439,
      42440,
      42441,
      42443,
      42448,
      42453,
      42454,
      42455,
      42462,
      42464,
      42465,
      42469,
      42473,
      42474,
      42475,
      42476,
      42477,
      42483,
      47273,
      47572,
      47854,
      48072,
      48880,
      49079,
      50410,
      50940,
      51133,
      51896,
      51955,
      52188,
      52689
    ];
    this.nextChar = eucNextChar;
  };
  util.inherits(exports.euc_jp, mbcs);
  exports.euc_kr = function() {
    this.name = function() {
      return "EUC-KR";
    };
    this.language = function() {
      return "ko";
    };
    this.commonChars = [
      45217,
      45235,
      45253,
      45261,
      45268,
      45286,
      45293,
      45304,
      45306,
      45308,
      45496,
      45497,
      45511,
      45527,
      45538,
      45994,
      46011,
      46274,
      46287,
      46297,
      46315,
      46501,
      46517,
      46527,
      46535,
      46569,
      46835,
      47023,
      47042,
      47054,
      47270,
      47278,
      47286,
      47288,
      47291,
      47337,
      47531,
      47534,
      47564,
      47566,
      47613,
      47800,
      47822,
      47824,
      47857,
      48103,
      48115,
      48125,
      48301,
      48314,
      48338,
      48374,
      48570,
      48576,
      48579,
      48581,
      48838,
      48840,
      48863,
      48878,
      48888,
      48890,
      49057,
      49065,
      49088,
      49124,
      49131,
      49132,
      49144,
      49319,
      49327,
      49336,
      49338,
      49339,
      49341,
      49351,
      49356,
      49358,
      49359,
      49366,
      49370,
      49381,
      49403,
      49404,
      49572,
      49574,
      49590,
      49622,
      49631,
      49654,
      49656,
      50337,
      50637,
      50862,
      51151,
      51153,
      51154,
      51160,
      51173,
      51373
    ];
    this.nextChar = eucNextChar;
  };
  util.inherits(exports.euc_kr, mbcs);
  exports.gb_18030 = function() {
    this.name = function() {
      return "GB18030";
    };
    this.language = function() {
      return "zh";
    };
    this.nextChar = function(iter, det) {
      iter.index = iter.nextIndex;
      iter.error = false;
      var firstByte = 0;
      var secondByte = 0;
      var thirdByte = 0;
      var fourthByte = 0;
      buildChar: {
        firstByte = iter.charValue = iter.nextByte(det);
        if (firstByte < 0) {
          iter.done = true;
          break buildChar;
        }
        if (firstByte <= 128) {
          break buildChar;
        }
        secondByte = iter.nextByte(det);
        iter.charValue = iter.charValue << 8 | secondByte;
        if (firstByte >= 129 && firstByte <= 254) {
          if (secondByte >= 64 && secondByte <= 126 || secondByte >= 80 && secondByte <= 254) {
            break buildChar;
          }
          if (secondByte >= 48 && secondByte <= 57) {
            thirdByte = iter.nextByte(det);
            if (thirdByte >= 129 && thirdByte <= 254) {
              fourthByte = iter.nextByte(det);
              if (fourthByte >= 48 && fourthByte <= 57) {
                iter.charValue = iter.charValue << 16 | thirdByte << 8 | fourthByte;
                break buildChar;
              }
            }
          }
          iter.error = true;
          break buildChar;
        }
      }
      return iter.done == false;
    };
    this.commonChars = [
      41377,
      41378,
      41379,
      41380,
      41392,
      41393,
      41457,
      41459,
      41889,
      41900,
      41914,
      45480,
      45496,
      45502,
      45755,
      46025,
      46070,
      46323,
      46525,
      46532,
      46563,
      46767,
      46804,
      46816,
      47010,
      47016,
      47037,
      47062,
      47069,
      47284,
      47327,
      47350,
      47531,
      47561,
      47576,
      47610,
      47613,
      47821,
      48039,
      48086,
      48097,
      48122,
      48316,
      48347,
      48382,
      48588,
      48845,
      48861,
      49076,
      49094,
      49097,
      49332,
      49389,
      49611,
      49883,
      50119,
      50396,
      50410,
      50636,
      50935,
      51192,
      51371,
      51403,
      51413,
      51431,
      51663,
      51706,
      51889,
      51893,
      51911,
      51920,
      51926,
      51957,
      51965,
      52460,
      52728,
      52906,
      52932,
      52946,
      52965,
      53173,
      53186,
      53206,
      53442,
      53445,
      53456,
      53460,
      53671,
      53930,
      53938,
      53941,
      53947,
      53972,
      54211,
      54224,
      54269,
      54466,
      54490,
      54754,
      54992
    ];
  };
  util.inherits(exports.gb_18030, mbcs);
});

// node_modules/chardet/encoding/sbcs.js
var require_sbcs = __commonJS((exports, module) => {
  var util = __require("util");
  var Match = require_match();
  function NGramParser(theNgramList, theByteMap) {
    var N_GRAM_MASK = 16777215;
    this.byteIndex = 0;
    this.ngram = 0;
    this.ngramList = theNgramList;
    this.byteMap = theByteMap;
    this.ngramCount = 0;
    this.hitCount = 0;
    this.spaceChar;
    this.search = function(table, value) {
      var index = 0;
      if (table[index + 32] <= value)
        index += 32;
      if (table[index + 16] <= value)
        index += 16;
      if (table[index + 8] <= value)
        index += 8;
      if (table[index + 4] <= value)
        index += 4;
      if (table[index + 2] <= value)
        index += 2;
      if (table[index + 1] <= value)
        index += 1;
      if (table[index] > value)
        index -= 1;
      if (index < 0 || table[index] != value)
        return -1;
      return index;
    };
    this.lookup = function(thisNgram) {
      this.ngramCount += 1;
      if (this.search(this.ngramList, thisNgram) >= 0) {
        this.hitCount += 1;
      }
    };
    this.addByte = function(b) {
      this.ngram = (this.ngram << 8) + (b & 255) & N_GRAM_MASK;
      this.lookup(this.ngram);
    };
    this.nextByte = function(det) {
      if (this.byteIndex >= det.fInputLen)
        return -1;
      return det.fInputBytes[this.byteIndex++] & 255;
    };
    this.parse = function(det, spaceCh) {
      var b, ignoreSpace = false;
      this.spaceChar = spaceCh;
      while ((b = this.nextByte(det)) >= 0) {
        var mb = this.byteMap[b];
        if (mb != 0) {
          if (!(mb == this.spaceChar && ignoreSpace)) {
            this.addByte(mb);
          }
          ignoreSpace = mb == this.spaceChar;
        }
      }
      this.addByte(this.spaceChar);
      var rawPercent = this.hitCount / this.ngramCount;
      if (rawPercent > 0.33)
        return 98;
      return Math.floor(rawPercent * 300);
    };
  }
  function NGramsPlusLang(la, ng) {
    this.fLang = la;
    this.fNGrams = ng;
  }
  function sbcs() {
  }
  sbcs.prototype.spaceChar = 32;
  sbcs.prototype.ngrams = function() {
  };
  sbcs.prototype.byteMap = function() {
  };
  sbcs.prototype.match = function(det) {
    var ngrams = this.ngrams();
    var multiple = Array.isArray(ngrams) && ngrams[0] instanceof NGramsPlusLang;
    if (!multiple) {
      var parser = new NGramParser(ngrams, this.byteMap());
      var confidence = parser.parse(det, this.spaceChar);
      return confidence <= 0 ? null : new Match(det, this, confidence);
    }
    var bestConfidenceSoFar = -1;
    var lang = null;
    for (var i = ngrams.length - 1;i >= 0; i--) {
      var ngl = ngrams[i];
      var parser = new NGramParser(ngl.fNGrams, this.byteMap());
      var confidence = parser.parse(det, this.spaceChar);
      if (confidence > bestConfidenceSoFar) {
        bestConfidenceSoFar = confidence;
        lang = ngl.fLang;
      }
    }
    var name = this.name(det);
    return bestConfidenceSoFar <= 0 ? null : new Match(det, this, bestConfidenceSoFar, name, lang);
  };
  exports.ISO_8859_1 = function() {
    this.byteMap = function() {
      return [
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        0,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        170,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        181,
        32,
        32,
        32,
        32,
        186,
        32,
        32,
        32,
        32,
        32,
        224,
        225,
        226,
        227,
        228,
        229,
        230,
        231,
        232,
        233,
        234,
        235,
        236,
        237,
        238,
        239,
        240,
        241,
        242,
        243,
        244,
        245,
        246,
        32,
        248,
        249,
        250,
        251,
        252,
        253,
        254,
        223,
        224,
        225,
        226,
        227,
        228,
        229,
        230,
        231,
        232,
        233,
        234,
        235,
        236,
        237,
        238,
        239,
        240,
        241,
        242,
        243,
        244,
        245,
        246,
        32,
        248,
        249,
        250,
        251,
        252,
        253,
        254,
        255
      ];
    };
    this.ngrams = function() {
      return [
        new NGramsPlusLang("da", [
          2122086,
          2122100,
          2122853,
          2123118,
          2123122,
          2123375,
          2123873,
          2124064,
          2125157,
          2125671,
          2126053,
          2126697,
          2126708,
          2126953,
          2127465,
          6383136,
          6385184,
          6385252,
          6386208,
          6386720,
          6579488,
          6579566,
          6579570,
          6579572,
          6627443,
          6644768,
          6644837,
          6647328,
          6647396,
          6648352,
          6648421,
          6648608,
          6648864,
          6713202,
          6776096,
          6776174,
          6776178,
          6907749,
          6908960,
          6909543,
          7038240,
          7039845,
          7103858,
          7104871,
          7105637,
          7169380,
          7234661,
          7234848,
          7235360,
          7235429,
          7300896,
          7302432,
          7303712,
          7398688,
          7479396,
          7479397,
          7479411,
          7496992,
          7566437,
          7610483,
          7628064,
          7628146,
          7629164,
          7759218
        ]),
        new NGramsPlusLang("de", [
          2122094,
          2122101,
          2122341,
          2122849,
          2122853,
          2122857,
          2123113,
          2123621,
          2123873,
          2124142,
          2125161,
          2126691,
          2126693,
          2127214,
          2127461,
          2127471,
          2127717,
          2128501,
          6448498,
          6514720,
          6514789,
          6514804,
          6578547,
          6579566,
          6579570,
          6580581,
          6627428,
          6627443,
          6646126,
          6646132,
          6647328,
          6648352,
          6648608,
          6776174,
          6841710,
          6845472,
          6906728,
          6907168,
          6909472,
          6909541,
          6911008,
          7104867,
          7105637,
          7217249,
          7217252,
          7217267,
          7234592,
          7234661,
          7234848,
          7235360,
          7235429,
          7238757,
          7479396,
          7496805,
          7497065,
          7562088,
          7566437,
          7610468,
          7628064,
          7628142,
          7628146,
          7695972,
          7695975,
          7759218
        ]),
        new NGramsPlusLang("en", [
          2122016,
          2122094,
          2122341,
          2122607,
          2123375,
          2123873,
          2123877,
          2124142,
          2125153,
          2125670,
          2125938,
          2126437,
          2126689,
          2126708,
          2126952,
          2126959,
          2127720,
          6383972,
          6384672,
          6385184,
          6385252,
          6386464,
          6386720,
          6386789,
          6386793,
          6561889,
          6561908,
          6627425,
          6627443,
          6627444,
          6644768,
          6647412,
          6648352,
          6648608,
          6713202,
          6840692,
          6841632,
          6841714,
          6906912,
          6909472,
          6909543,
          6909806,
          6910752,
          7217249,
          7217268,
          7234592,
          7235360,
          7238688,
          7300640,
          7302688,
          7303712,
          7496992,
          7500576,
          7544929,
          7544948,
          7561577,
          7566368,
          7610484,
          7628146,
          7628897,
          7628901,
          7629167,
          7630624,
          7631648
        ]),
        new NGramsPlusLang("es", [
          2122016,
          2122593,
          2122607,
          2122853,
          2123116,
          2123118,
          2123123,
          2124142,
          2124897,
          2124911,
          2125921,
          2125935,
          2125938,
          2126197,
          2126437,
          2126693,
          2127214,
          2128160,
          6365283,
          6365284,
          6365285,
          6365292,
          6365296,
          6382441,
          6382703,
          6384672,
          6386208,
          6386464,
          6515187,
          6516590,
          6579488,
          6579564,
          6582048,
          6627428,
          6627429,
          6627436,
          6646816,
          6647328,
          6647412,
          6648608,
          6648692,
          6907246,
          6943598,
          7102752,
          7106419,
          7217253,
          7238757,
          7282788,
          7282789,
          7302688,
          7303712,
          7303968,
          7364978,
          7435621,
          7495968,
          7497075,
          7544932,
          7544933,
          7544944,
          7562528,
          7628064,
          7630624,
          7693600,
          15953440
        ]),
        new NGramsPlusLang("fr", [
          2122101,
          2122607,
          2122849,
          2122853,
          2122869,
          2123118,
          2123124,
          2124897,
          2124901,
          2125921,
          2125935,
          2125938,
          2126197,
          2126693,
          2126703,
          2127214,
          2154528,
          6385268,
          6386793,
          6513952,
          6516590,
          6579488,
          6579571,
          6583584,
          6627425,
          6627427,
          6627428,
          6627429,
          6627436,
          6627440,
          6627443,
          6647328,
          6647412,
          6648352,
          6648608,
          6648864,
          6649202,
          6909806,
          6910752,
          6911008,
          7102752,
          7103776,
          7103859,
          7169390,
          7217252,
          7234848,
          7238432,
          7238688,
          7302688,
          7302772,
          7304562,
          7435621,
          7479404,
          7496992,
          7544929,
          7544932,
          7544933,
          7544940,
          7544944,
          7610468,
          7628064,
          7629167,
          7693600,
          7696928
        ]),
        new NGramsPlusLang("it", [
          2122092,
          2122600,
          2122607,
          2122853,
          2122857,
          2123040,
          2124140,
          2124142,
          2124897,
          2125925,
          2125938,
          2127214,
          6365283,
          6365284,
          6365296,
          6365299,
          6386799,
          6514789,
          6516590,
          6579564,
          6580512,
          6627425,
          6627427,
          6627428,
          6627433,
          6627436,
          6627440,
          6627443,
          6646816,
          6646892,
          6647412,
          6648352,
          6841632,
          6889569,
          6889571,
          6889572,
          6889587,
          6906144,
          6908960,
          6909472,
          6909806,
          7102752,
          7103776,
          7104800,
          7105633,
          7234848,
          7235872,
          7237408,
          7238757,
          7282785,
          7282788,
          7282793,
          7282803,
          7302688,
          7302757,
          7366002,
          7495968,
          7496992,
          7563552,
          7627040,
          7628064,
          7629088,
          7630624,
          8022383
        ]),
        new NGramsPlusLang("nl", [
          2122092,
          2122341,
          2122849,
          2122853,
          2122857,
          2123109,
          2123118,
          2123621,
          2123877,
          2124142,
          2125153,
          2125157,
          2125680,
          2126949,
          2127457,
          2127461,
          2127471,
          2127717,
          2128489,
          6381934,
          6381938,
          6385184,
          6385252,
          6386208,
          6386720,
          6514804,
          6579488,
          6579566,
          6579570,
          6627426,
          6627446,
          6645102,
          6645106,
          6647328,
          6648352,
          6648435,
          6648864,
          6776174,
          6841716,
          6907168,
          6909472,
          6909543,
          6910752,
          7217250,
          7217252,
          7217253,
          7217256,
          7217263,
          7217270,
          7234661,
          7235360,
          7302756,
          7303026,
          7303200,
          7303712,
          7562088,
          7566437,
          7610468,
          7628064,
          7628142,
          7628146,
          7758190,
          7759218,
          7761775
        ]),
        new NGramsPlusLang("no", [
          2122100,
          2122102,
          2122853,
          2123118,
          2123122,
          2123375,
          2123873,
          2124064,
          2125157,
          2125671,
          2126053,
          2126693,
          2126699,
          2126703,
          2126708,
          2126953,
          2127465,
          2155808,
          6385252,
          6386208,
          6386720,
          6579488,
          6579566,
          6579572,
          6627443,
          6644768,
          6647328,
          6647397,
          6648352,
          6648421,
          6648864,
          6648948,
          6713202,
          6776174,
          6908779,
          6908960,
          6909543,
          7038240,
          7039845,
          7103776,
          7105637,
          7169380,
          7169390,
          7217267,
          7234848,
          7235360,
          7235429,
          7237221,
          7300896,
          7302432,
          7303712,
          7398688,
          7479411,
          7496992,
          7565165,
          7566437,
          7610483,
          7628064,
          7628142,
          7628146,
          7629164,
          7631904,
          7631973,
          7759218
        ]),
        new NGramsPlusLang("pt", [
          2122016,
          2122607,
          2122849,
          2122853,
          2122863,
          2123040,
          2123123,
          2125153,
          2125423,
          2125600,
          2125921,
          2125935,
          2125938,
          2126197,
          2126437,
          2126693,
          2127213,
          6365281,
          6365283,
          6365284,
          6365296,
          6382693,
          6382703,
          6384672,
          6386208,
          6386273,
          6386464,
          6516589,
          6516590,
          6578464,
          6579488,
          6582048,
          6582131,
          6627425,
          6627428,
          6647072,
          6647412,
          6648608,
          6648692,
          6906144,
          6906721,
          7169390,
          7238757,
          7238767,
          7282785,
          7282787,
          7282788,
          7282789,
          7282800,
          7303968,
          7364978,
          7435621,
          7495968,
          7497075,
          7544929,
          7544932,
          7544933,
          7544944,
          7566433,
          7628064,
          7630624,
          7693600,
          14905120,
          15197039
        ]),
        new NGramsPlusLang("sv", [
          2122100,
          2122102,
          2122853,
          2123118,
          2123510,
          2123873,
          2124064,
          2124142,
          2124655,
          2125157,
          2125667,
          2126053,
          2126699,
          2126703,
          2126708,
          2126953,
          2127457,
          2127465,
          2155634,
          6382693,
          6385184,
          6385252,
          6386208,
          6386804,
          6514720,
          6579488,
          6579566,
          6579570,
          6579572,
          6644768,
          6647328,
          6648352,
          6648864,
          6747762,
          6776174,
          6909036,
          6909543,
          7037216,
          7105568,
          7169380,
          7217267,
          7233824,
          7234661,
          7235360,
          7235429,
          7235950,
          7299944,
          7302432,
          7302688,
          7398688,
          7479393,
          7479411,
          7495968,
          7564129,
          7565165,
          7610483,
          7627040,
          7628064,
          7628146,
          7629164,
          7631904,
          7758194,
          14971424,
          16151072
        ])
      ];
    };
    this.name = function(det) {
      return det && det.fC1Bytes ? "windows-1252" : "ISO-8859-1";
    };
  };
  util.inherits(exports.ISO_8859_1, sbcs);
  exports.ISO_8859_2 = function() {
    this.byteMap = function() {
      return [
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        0,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        177,
        32,
        179,
        32,
        181,
        182,
        32,
        32,
        185,
        186,
        187,
        188,
        32,
        190,
        191,
        32,
        177,
        32,
        179,
        32,
        181,
        182,
        183,
        32,
        185,
        186,
        187,
        188,
        32,
        190,
        191,
        224,
        225,
        226,
        227,
        228,
        229,
        230,
        231,
        232,
        233,
        234,
        235,
        236,
        237,
        238,
        239,
        240,
        241,
        242,
        243,
        244,
        245,
        246,
        32,
        248,
        249,
        250,
        251,
        252,
        253,
        254,
        223,
        224,
        225,
        226,
        227,
        228,
        229,
        230,
        231,
        232,
        233,
        234,
        235,
        236,
        237,
        238,
        239,
        240,
        241,
        242,
        243,
        244,
        245,
        246,
        32,
        248,
        249,
        250,
        251,
        252,
        253,
        254,
        32
      ];
    };
    this.ngrams = function() {
      return [
        new NGramsPlusLang("cs", [
          2122016,
          2122361,
          2122863,
          2124389,
          2125409,
          2125413,
          2125600,
          2125668,
          2125935,
          2125938,
          2126072,
          2126447,
          2126693,
          2126703,
          2126708,
          2126959,
          2127392,
          2127481,
          2128481,
          6365296,
          6513952,
          6514720,
          6627440,
          6627443,
          6627446,
          6647072,
          6647533,
          6844192,
          6844260,
          6910836,
          6972704,
          7042149,
          7103776,
          7104800,
          7233824,
          7268640,
          7269408,
          7269664,
          7282800,
          7300206,
          7301737,
          7304052,
          7304480,
          7304801,
          7368548,
          7368554,
          7369327,
          7403621,
          7562528,
          7565173,
          7566433,
          7566441,
          7566446,
          7628146,
          7630573,
          7630624,
          7676016,
          12477728,
          14773997,
          15296623,
          15540336,
          15540339,
          15559968,
          16278884
        ]),
        new NGramsPlusLang("hu", [
          2122016,
          2122106,
          2122341,
          2123111,
          2123116,
          2123365,
          2123873,
          2123887,
          2124147,
          2124645,
          2124649,
          2124790,
          2124901,
          2125153,
          2125157,
          2125161,
          2125413,
          2126714,
          2126949,
          2156915,
          6365281,
          6365291,
          6365293,
          6365299,
          6384416,
          6385184,
          6388256,
          6447470,
          6448494,
          6645625,
          6646560,
          6646816,
          6646885,
          6647072,
          6647328,
          6648421,
          6648864,
          6648933,
          6648948,
          6781216,
          6844263,
          6909556,
          6910752,
          7020641,
          7075450,
          7169383,
          7170414,
          7217249,
          7233899,
          7234923,
          7234925,
          7238688,
          7300985,
          7544929,
          7567973,
          7567988,
          7568097,
          7596391,
          7610465,
          7631904,
          7659891,
          8021362,
          14773792,
          15299360
        ]),
        new NGramsPlusLang("pl", [
          2122618,
          2122863,
          2124064,
          2124389,
          2124655,
          2125153,
          2125161,
          2125409,
          2125417,
          2125668,
          2125935,
          2125938,
          2126697,
          2127648,
          2127721,
          2127737,
          2128416,
          2128481,
          6365296,
          6365303,
          6385257,
          6514720,
          6519397,
          6519417,
          6582048,
          6584937,
          6627440,
          6627443,
          6627447,
          6627450,
          6645615,
          6646304,
          6647072,
          6647401,
          6778656,
          6906144,
          6907168,
          6907242,
          7037216,
          7039264,
          7039333,
          7170405,
          7233824,
          7235937,
          7235941,
          7282800,
          7305057,
          7305065,
          7368556,
          7369313,
          7369327,
          7369338,
          7502437,
          7502457,
          7563754,
          7564137,
          7566433,
          7825765,
          7955304,
          7957792,
          8021280,
          8022373,
          8026400,
          15955744
        ]),
        new NGramsPlusLang("ro", [
          2122016,
          2122083,
          2122593,
          2122597,
          2122607,
          2122613,
          2122853,
          2122857,
          2124897,
          2125153,
          2125925,
          2125938,
          2126693,
          2126819,
          2127214,
          2144873,
          2158190,
          6365283,
          6365284,
          6386277,
          6386720,
          6386789,
          6386976,
          6513010,
          6516590,
          6518048,
          6546208,
          6579488,
          6627425,
          6627427,
          6627428,
          6627440,
          6627443,
          6644000,
          6646048,
          6646885,
          6647412,
          6648692,
          6889569,
          6889571,
          6889572,
          6889584,
          6907168,
          6908192,
          6909472,
          7102752,
          7103776,
          7106418,
          7107945,
          7234848,
          7238770,
          7303712,
          7365998,
          7496992,
          7497057,
          7501088,
          7594784,
          7628064,
          7631477,
          7660320,
          7694624,
          7695392,
          12216608,
          15625760
        ])
      ];
    };
    this.name = function(det) {
      return det && det.fC1Bytes ? "windows-1250" : "ISO-8859-2";
    };
  };
  util.inherits(exports.ISO_8859_2, sbcs);
  exports.ISO_8859_5 = function() {
    this.byteMap = function() {
      return [
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        0,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        241,
        242,
        243,
        244,
        245,
        246,
        247,
        248,
        249,
        250,
        251,
        252,
        32,
        254,
        255,
        208,
        209,
        210,
        211,
        212,
        213,
        214,
        215,
        216,
        217,
        218,
        219,
        220,
        221,
        222,
        223,
        224,
        225,
        226,
        227,
        228,
        229,
        230,
        231,
        232,
        233,
        234,
        235,
        236,
        237,
        238,
        239,
        208,
        209,
        210,
        211,
        212,
        213,
        214,
        215,
        216,
        217,
        218,
        219,
        220,
        221,
        222,
        223,
        224,
        225,
        226,
        227,
        228,
        229,
        230,
        231,
        232,
        233,
        234,
        235,
        236,
        237,
        238,
        239,
        32,
        241,
        242,
        243,
        244,
        245,
        246,
        247,
        248,
        249,
        250,
        251,
        252,
        32,
        254,
        255
      ];
    };
    this.ngrams = function() {
      return [
        2150944,
        2151134,
        2151646,
        2152400,
        2152480,
        2153168,
        2153182,
        2153936,
        2153941,
        2154193,
        2154462,
        2154464,
        2154704,
        2154974,
        2154978,
        2155230,
        2156514,
        2158050,
        13688280,
        13689580,
        13884960,
        14015468,
        14015960,
        14016994,
        14017056,
        14164191,
        14210336,
        14211104,
        14216992,
        14407133,
        14407712,
        14413021,
        14536736,
        14538016,
        14538965,
        14538991,
        14540320,
        14540498,
        14557394,
        14557407,
        14557409,
        14602784,
        14602960,
        14603230,
        14604576,
        14605292,
        14605344,
        14606818,
        14671579,
        14672085,
        14672088,
        14672094,
        14733522,
        14734804,
        14803664,
        14803666,
        14803672,
        14806816,
        14865883,
        14868000,
        14868192,
        14871584,
        15196894,
        15459616
      ];
    };
    this.name = function(det) {
      return "ISO-8859-5";
    };
    this.language = function() {
      return "ru";
    };
  };
  util.inherits(exports.ISO_8859_5, sbcs);
  exports.ISO_8859_6 = function() {
    this.byteMap = function() {
      return [
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        0,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        193,
        194,
        195,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        210,
        211,
        212,
        213,
        214,
        215,
        216,
        217,
        218,
        32,
        32,
        32,
        32,
        32,
        224,
        225,
        226,
        227,
        228,
        229,
        230,
        231,
        232,
        233,
        234,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32
      ];
    };
    this.ngrams = function() {
      return [
        2148324,
        2148326,
        2148551,
        2152932,
        2154986,
        2155748,
        2156006,
        2156743,
        13050055,
        13091104,
        13093408,
        13095200,
        13100064,
        13100227,
        13100231,
        13100232,
        13100234,
        13100236,
        13100237,
        13100239,
        13100243,
        13100249,
        13100258,
        13100261,
        13100264,
        13100266,
        13100320,
        13100576,
        13100746,
        13115591,
        13181127,
        13181153,
        13181156,
        13181157,
        13181160,
        13246663,
        13574343,
        13617440,
        13705415,
        13748512,
        13836487,
        14229703,
        14279913,
        14805536,
        14950599,
        14993696,
        15001888,
        15002144,
        15016135,
        15058720,
        15059232,
        15066656,
        15081671,
        15147207,
        15189792,
        15255524,
        15263264,
        15278279,
        15343815,
        15343845,
        15343848,
        15386912,
        15388960,
        15394336
      ];
    };
    this.name = function(det) {
      return "ISO-8859-6";
    };
    this.language = function() {
      return "ar";
    };
  };
  util.inherits(exports.ISO_8859_6, sbcs);
  exports.ISO_8859_7 = function() {
    this.byteMap = function() {
      return [
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        0,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        161,
        162,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        220,
        32,
        221,
        222,
        223,
        32,
        252,
        32,
        253,
        254,
        192,
        225,
        226,
        227,
        228,
        229,
        230,
        231,
        232,
        233,
        234,
        235,
        236,
        237,
        238,
        239,
        240,
        241,
        32,
        243,
        244,
        245,
        246,
        247,
        248,
        249,
        250,
        251,
        220,
        221,
        222,
        223,
        224,
        225,
        226,
        227,
        228,
        229,
        230,
        231,
        232,
        233,
        234,
        235,
        236,
        237,
        238,
        239,
        240,
        241,
        242,
        243,
        244,
        245,
        246,
        247,
        248,
        249,
        250,
        251,
        252,
        253,
        254,
        32
      ];
    };
    this.ngrams = function() {
      return [
        2154989,
        2154992,
        2155497,
        2155753,
        2156016,
        2156320,
        2157281,
        2157797,
        2158049,
        2158368,
        2158817,
        2158831,
        2158833,
        2159604,
        2159605,
        2159847,
        2159855,
        14672160,
        14754017,
        14754036,
        14805280,
        14806304,
        14807292,
        14807584,
        14936545,
        15067424,
        15069728,
        15147252,
        15199520,
        15200800,
        15278324,
        15327520,
        15330014,
        15331872,
        15393257,
        15393268,
        15525152,
        15540449,
        15540453,
        15540464,
        15589664,
        15725088,
        15725856,
        15790069,
        15790575,
        15793184,
        15868129,
        15868133,
        15868138,
        15868144,
        15868148,
        15983904,
        15984416,
        15987951,
        16048416,
        16048617,
        16050157,
        16050162,
        16050666,
        16052000,
        16052213,
        16054765,
        16379168,
        16706848
      ];
    };
    this.name = function(det) {
      return det && det.fC1Bytes ? "windows-1253" : "ISO-8859-7";
    };
    this.language = function() {
      return "el";
    };
  };
  util.inherits(exports.ISO_8859_7, sbcs);
  exports.ISO_8859_8 = function() {
    this.byteMap = function() {
      return [
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        0,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        181,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        224,
        225,
        226,
        227,
        228,
        229,
        230,
        231,
        232,
        233,
        234,
        235,
        236,
        237,
        238,
        239,
        240,
        241,
        242,
        243,
        244,
        245,
        246,
        247,
        248,
        249,
        250,
        32,
        32,
        32,
        32,
        32
      ];
    };
    this.ngrams = function() {
      return [
        new NGramsPlusLang("he", [
          2154725,
          2154727,
          2154729,
          2154746,
          2154985,
          2154990,
          2155744,
          2155749,
          2155753,
          2155758,
          2155762,
          2155769,
          2155770,
          2157792,
          2157796,
          2158304,
          2159340,
          2161132,
          14744096,
          14950624,
          14950625,
          14950628,
          14950636,
          14950638,
          14950649,
          15001056,
          15065120,
          15068448,
          15068960,
          15071264,
          15071776,
          15278308,
          15328288,
          15328762,
          15329773,
          15330592,
          15331104,
          15333408,
          15333920,
          15474912,
          15474916,
          15523872,
          15524896,
          15540448,
          15540449,
          15540452,
          15540460,
          15540462,
          15540473,
          15655968,
          15671524,
          15787040,
          15788320,
          15788525,
          15920160,
          16261348,
          16312813,
          16378912,
          16392416,
          16392417,
          16392420,
          16392428,
          16392430,
          16392441
        ]),
        new NGramsPlusLang("he", [
          2154725,
          2154732,
          2155753,
          2155756,
          2155758,
          2155760,
          2157040,
          2157810,
          2157817,
          2158053,
          2158057,
          2158565,
          2158569,
          2160869,
          2160873,
          2161376,
          2161381,
          2161385,
          14688484,
          14688492,
          14688493,
          14688506,
          14738464,
          14738916,
          14740512,
          14741024,
          14754020,
          14754029,
          14754042,
          14950628,
          14950633,
          14950636,
          14950637,
          14950639,
          14950648,
          14950650,
          15002656,
          15065120,
          15066144,
          15196192,
          15327264,
          15327520,
          15328288,
          15474916,
          15474925,
          15474938,
          15528480,
          15530272,
          15591913,
          15591920,
          15591928,
          15605988,
          15605997,
          15606010,
          15655200,
          15655968,
          15918112,
          16326884,
          16326893,
          16326906,
          16376864,
          16441376,
          16442400,
          16442857
        ])
      ];
    };
    this.name = function(det) {
      return det && det.fC1Bytes ? "windows-1255" : "ISO-8859-8";
    };
    this.language = function() {
      return "he";
    };
  };
  util.inherits(exports.ISO_8859_8, sbcs);
  exports.ISO_8859_9 = function() {
    this.byteMap = function() {
      return [
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        0,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        170,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        181,
        32,
        32,
        32,
        32,
        186,
        32,
        32,
        32,
        32,
        32,
        224,
        225,
        226,
        227,
        228,
        229,
        230,
        231,
        232,
        233,
        234,
        235,
        236,
        237,
        238,
        239,
        240,
        241,
        242,
        243,
        244,
        245,
        246,
        32,
        248,
        249,
        250,
        251,
        252,
        105,
        254,
        223,
        224,
        225,
        226,
        227,
        228,
        229,
        230,
        231,
        232,
        233,
        234,
        235,
        236,
        237,
        238,
        239,
        240,
        241,
        242,
        243,
        244,
        245,
        246,
        32,
        248,
        249,
        250,
        251,
        252,
        253,
        254,
        255
      ];
    };
    this.ngrams = function() {
      return [
        2122337,
        2122345,
        2122357,
        2122849,
        2122853,
        2123621,
        2123873,
        2124140,
        2124641,
        2124655,
        2125153,
        2125676,
        2126689,
        2126945,
        2127461,
        2128225,
        6365282,
        6384416,
        6384737,
        6384993,
        6385184,
        6385405,
        6386208,
        6386273,
        6386429,
        6386685,
        6388065,
        6449522,
        6578464,
        6579488,
        6580512,
        6627426,
        6627435,
        6644841,
        6647328,
        6648352,
        6648425,
        6648681,
        6909029,
        6909472,
        6909545,
        6910496,
        7102830,
        7102834,
        7103776,
        7103858,
        7217249,
        7217250,
        7217259,
        7234657,
        7234661,
        7234848,
        7235872,
        7235950,
        7273760,
        7498094,
        7535982,
        7759136,
        7954720,
        7958386,
        16608800,
        16608868,
        16609021,
        16642301
      ];
    };
    this.name = function(det) {
      return det && det.fC1Bytes ? "windows-1254" : "ISO-8859-9";
    };
    this.language = function() {
      return "tr";
    };
  };
  util.inherits(exports.ISO_8859_9, sbcs);
  exports.windows_1251 = function() {
    this.byteMap = function() {
      return [
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        0,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        144,
        131,
        32,
        131,
        32,
        32,
        32,
        32,
        32,
        32,
        154,
        32,
        156,
        157,
        158,
        159,
        144,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        154,
        32,
        156,
        157,
        158,
        159,
        32,
        162,
        162,
        188,
        32,
        180,
        32,
        32,
        184,
        32,
        186,
        32,
        32,
        32,
        32,
        191,
        32,
        32,
        179,
        179,
        180,
        181,
        32,
        32,
        184,
        32,
        186,
        32,
        188,
        190,
        190,
        191,
        224,
        225,
        226,
        227,
        228,
        229,
        230,
        231,
        232,
        233,
        234,
        235,
        236,
        237,
        238,
        239,
        240,
        241,
        242,
        243,
        244,
        245,
        246,
        247,
        248,
        249,
        250,
        251,
        252,
        253,
        254,
        255,
        224,
        225,
        226,
        227,
        228,
        229,
        230,
        231,
        232,
        233,
        234,
        235,
        236,
        237,
        238,
        239,
        240,
        241,
        242,
        243,
        244,
        245,
        246,
        247,
        248,
        249,
        250,
        251,
        252,
        253,
        254,
        255
      ];
    };
    this.ngrams = function() {
      return [
        2155040,
        2155246,
        2155758,
        2156512,
        2156576,
        2157280,
        2157294,
        2158048,
        2158053,
        2158305,
        2158574,
        2158576,
        2158816,
        2159086,
        2159090,
        2159342,
        2160626,
        2162162,
        14740968,
        14742268,
        14937632,
        15068156,
        15068648,
        15069682,
        15069728,
        15212783,
        15263008,
        15263776,
        15269664,
        15459821,
        15460384,
        15465709,
        15589408,
        15590688,
        15591653,
        15591679,
        15592992,
        15593186,
        15605986,
        15605999,
        15606001,
        15655456,
        15655648,
        15655918,
        15657248,
        15657980,
        15658016,
        15659506,
        15724267,
        15724773,
        15724776,
        15724782,
        15786210,
        15787492,
        15856352,
        15856354,
        15856360,
        15859488,
        15918571,
        15920672,
        15920880,
        15924256,
        16249582,
        16512288
      ];
    };
    this.name = function(det) {
      return "windows-1251";
    };
    this.language = function() {
      return "ru";
    };
  };
  util.inherits(exports.windows_1251, sbcs);
  exports.windows_1256 = function() {
    this.byteMap = function() {
      return [
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        0,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        129,
        32,
        131,
        32,
        32,
        32,
        32,
        136,
        32,
        138,
        32,
        156,
        141,
        142,
        143,
        144,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        152,
        32,
        154,
        32,
        156,
        32,
        32,
        159,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        170,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        181,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        192,
        193,
        194,
        195,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        210,
        211,
        212,
        213,
        214,
        32,
        216,
        217,
        218,
        219,
        220,
        221,
        222,
        223,
        224,
        225,
        226,
        227,
        228,
        229,
        230,
        231,
        232,
        233,
        234,
        235,
        236,
        237,
        238,
        239,
        32,
        32,
        32,
        32,
        244,
        32,
        32,
        32,
        32,
        249,
        32,
        251,
        252,
        32,
        32,
        255
      ];
    };
    this.ngrams = function() {
      return [
        2148321,
        2148324,
        2148551,
        2153185,
        2153965,
        2154977,
        2155492,
        2156231,
        13050055,
        13091104,
        13093408,
        13095200,
        13099296,
        13099459,
        13099463,
        13099464,
        13099466,
        13099468,
        13099469,
        13099471,
        13099475,
        13099482,
        13099486,
        13099491,
        13099494,
        13099501,
        13099808,
        13100064,
        13100234,
        13115591,
        13181127,
        13181149,
        13181153,
        13181155,
        13181158,
        13246663,
        13574343,
        13617440,
        13705415,
        13748512,
        13836487,
        14295239,
        14344684,
        14544160,
        14753991,
        14797088,
        14806048,
        14806304,
        14885063,
        14927648,
        14928160,
        14935072,
        14950599,
        15016135,
        15058720,
        15124449,
        15131680,
        15474887,
        15540423,
        15540451,
        15540454,
        15583520,
        15585568,
        15590432
      ];
    };
    this.name = function(det) {
      return "windows-1256";
    };
    this.language = function() {
      return "ar";
    };
  };
  util.inherits(exports.windows_1256, sbcs);
  exports.KOI8_R = function() {
    this.byteMap = function() {
      return [
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        0,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        97,
        98,
        99,
        100,
        101,
        102,
        103,
        104,
        105,
        106,
        107,
        108,
        109,
        110,
        111,
        112,
        113,
        114,
        115,
        116,
        117,
        118,
        119,
        120,
        121,
        122,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        163,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        163,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        32,
        192,
        193,
        194,
        195,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        210,
        211,
        212,
        213,
        214,
        215,
        216,
        217,
        218,
        219,
        220,
        221,
        222,
        223,
        192,
        193,
        194,
        195,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        210,
        211,
        212,
        213,
        214,
        215,
        216,
        217,
        218,
        219,
        220,
        221,
        222,
        223
      ];
    };
    this.ngrams = function() {
      return [
        2147535,
        2148640,
        2149313,
        2149327,
        2150081,
        2150085,
        2150338,
        2150607,
        2150610,
        2151105,
        2151375,
        2151380,
        2151631,
        2152224,
        2152399,
        2153153,
        2153684,
        2154196,
        12701385,
        12702936,
        12963032,
        12963529,
        12964820,
        12964896,
        13094688,
        13181136,
        13223200,
        13224224,
        13226272,
        13419982,
        13420832,
        13424846,
        13549856,
        13550880,
        13552069,
        13552081,
        13553440,
        13553623,
        13574352,
        13574355,
        13574359,
        13617103,
        13617696,
        13618392,
        13618464,
        13620180,
        13621024,
        13621185,
        13684684,
        13685445,
        13685449,
        13685455,
        13812183,
        13813188,
        13881632,
        13882561,
        13882569,
        13882583,
        13944268,
        13946656,
        13946834,
        13948960,
        14272544,
        14603471
      ];
    };
    this.name = function(det) {
      return "KOI8-R";
    };
    this.language = function() {
      return "ru";
    };
  };
  util.inherits(exports.KOI8_R, sbcs);
});

// node_modules/chardet/encoding/iso2022.js
var require_iso2022 = __commonJS((exports, module) => {
  var util = __require("util");
  var Match = require_match();
  function ISO_2022() {
  }
  ISO_2022.prototype.match = function(det) {
    var i, j;
    var escN;
    var hits = 0;
    var misses = 0;
    var shifts = 0;
    var quality;
    var text = det.fInputBytes;
    var textLen = det.fInputLen;
    scanInput:
      for (i = 0;i < textLen; i++) {
        if (text[i] == 27) {
          checkEscapes:
            for (escN = 0;escN < this.escapeSequences.length; escN++) {
              var seq = this.escapeSequences[escN];
              if (textLen - i < seq.length)
                continue checkEscapes;
              for (j = 1;j < seq.length; j++)
                if (seq[j] != text[i + j])
                  continue checkEscapes;
              hits++;
              i += seq.length - 1;
              continue scanInput;
            }
          misses++;
        }
        if (text[i] == 14 || text[i] == 15)
          shifts++;
      }
    if (hits == 0)
      return null;
    quality = (100 * hits - 100 * misses) / (hits + misses);
    if (hits + shifts < 5)
      quality -= (5 - (hits + shifts)) * 10;
    return quality <= 0 ? null : new Match(det, this, quality);
  };
  exports.ISO_2022_JP = function() {
    this.name = function() {
      return "ISO-2022-JP";
    };
    this.escapeSequences = [
      [27, 36, 40, 67],
      [27, 36, 40, 68],
      [27, 36, 64],
      [27, 36, 65],
      [27, 36, 66],
      [27, 38, 64],
      [27, 40, 66],
      [27, 40, 72],
      [27, 40, 73],
      [27, 40, 74],
      [27, 46, 65],
      [27, 46, 70]
    ];
  };
  util.inherits(exports.ISO_2022_JP, ISO_2022);
  exports.ISO_2022_KR = function() {
    this.name = function() {
      return "ISO-2022-KR";
    };
    this.escapeSequences = [
      [27, 36, 41, 67]
    ];
  };
  util.inherits(exports.ISO_2022_KR, ISO_2022);
  exports.ISO_2022_CN = function() {
    this.name = function() {
      return "ISO-2022-CN";
    };
    this.escapeSequences = [
      [27, 36, 41, 65],
      [27, 36, 41, 71],
      [27, 36, 42, 72],
      [27, 36, 41, 69],
      [27, 36, 43, 73],
      [27, 36, 43, 74],
      [27, 36, 43, 75],
      [27, 36, 43, 76],
      [27, 36, 43, 77],
      [27, 78],
      [27, 79]
    ];
  };
  util.inherits(exports.ISO_2022_CN, ISO_2022);
});

// node_modules/chardet/index.js
var require_chardet = __commonJS((exports, module) => {
  var fs = __require("fs");
  var utf8 = require_utf8();
  var unicode = require_unicode();
  var mbcs = require_mbcs();
  var sbcs = require_sbcs();
  var iso2022 = require_iso2022();
  var self = exports;
  var recognisers = [
    new utf8,
    new unicode.UTF_16BE,
    new unicode.UTF_16LE,
    new unicode.UTF_32BE,
    new unicode.UTF_32LE,
    new mbcs.sjis,
    new mbcs.big5,
    new mbcs.euc_jp,
    new mbcs.euc_kr,
    new mbcs.gb_18030,
    new iso2022.ISO_2022_JP,
    new iso2022.ISO_2022_KR,
    new iso2022.ISO_2022_CN,
    new sbcs.ISO_8859_1,
    new sbcs.ISO_8859_2,
    new sbcs.ISO_8859_5,
    new sbcs.ISO_8859_6,
    new sbcs.ISO_8859_7,
    new sbcs.ISO_8859_8,
    new sbcs.ISO_8859_9,
    new sbcs.windows_1251,
    new sbcs.windows_1256,
    new sbcs.KOI8_R
  ];
  module.exports.detect = function(buffer, opts) {
    var fByteStats = [];
    for (var i = 0;i < 256; i++)
      fByteStats[i] = 0;
    for (var i = buffer.length - 1;i >= 0; i--)
      fByteStats[buffer[i] & 255]++;
    var fC1Bytes = false;
    for (var i = 128;i <= 159; i += 1) {
      if (fByteStats[i] != 0) {
        fC1Bytes = true;
        break;
      }
    }
    var context = {
      fByteStats,
      fC1Bytes,
      fRawInput: buffer,
      fRawLength: buffer.length,
      fInputBytes: buffer,
      fInputLen: buffer.length
    };
    var matches = recognisers.map(function(rec) {
      return rec.match(context);
    }).filter(function(match) {
      return !!match;
    }).sort(function(a, b) {
      return b.confidence - a.confidence;
    });
    if (opts && opts.returnAllMatches === true) {
      return matches;
    } else {
      return matches.length > 0 ? matches[0].name : null;
    }
  };
  module.exports.detectFile = function(filepath, opts, cb) {
    if (typeof opts === "function") {
      cb = opts;
      opts = undefined;
    }
    var fd;
    var handler = function(err, buffer) {
      if (fd) {
        fs.closeSync(fd);
      }
      if (err)
        return cb(err, null);
      cb(null, self.detect(buffer, opts));
    };
    if (opts && opts.sampleSize) {
      fd = fs.openSync(filepath, "r"), sample = Buffer.allocUnsafe(opts.sampleSize);
      fs.read(fd, sample, 0, opts.sampleSize, null, function(err) {
        handler(err, sample);
      });
      return;
    }
    fs.readFile(filepath, handler);
  };
  module.exports.detectFileSync = function(filepath, opts) {
    if (opts && opts.sampleSize) {
      var fd = fs.openSync(filepath, "r"), sample2 = Buffer.allocUnsafe(opts.sampleSize);
      fs.readSync(fd, sample2, 0, opts.sampleSize);
      fs.closeSync(fd);
      return self.detect(sample2, opts);
    }
    return self.detect(fs.readFileSync(filepath), opts);
  };
  module.exports.detectAll = function(buffer, opts) {
    if (typeof opts !== "object") {
      opts = {};
    }
    opts.returnAllMatches = true;
    return self.detect(buffer, opts);
  };
  module.exports.detectFileAll = function(filepath, opts, cb) {
    if (typeof opts === "function") {
      cb = opts;
      opts = undefined;
    }
    if (typeof opts !== "object") {
      opts = {};
    }
    opts.returnAllMatches = true;
    self.detectFile(filepath, opts, cb);
  };
  module.exports.detectFileAllSync = function(filepath, opts) {
    if (typeof opts !== "object") {
      opts = {};
    }
    opts.returnAllMatches = true;
    return self.detectFileSync(filepath, opts);
  };
});

// node_modules/safer-buffer/safer.js
var require_safer = __commonJS((exports, module) => {
  var buffer = __require("buffer");
  var Buffer2 = buffer.Buffer;
  var safer = {};
  var key2;
  for (key2 in buffer) {
    if (!buffer.hasOwnProperty(key2))
      continue;
    if (key2 === "SlowBuffer" || key2 === "Buffer")
      continue;
    safer[key2] = buffer[key2];
  }
  var Safer = safer.Buffer = {};
  for (key2 in Buffer2) {
    if (!Buffer2.hasOwnProperty(key2))
      continue;
    if (key2 === "allocUnsafe" || key2 === "allocUnsafeSlow")
      continue;
    Safer[key2] = Buffer2[key2];
  }
  safer.Buffer.prototype = Buffer2.prototype;
  if (!Safer.from || Safer.from === Uint8Array.from) {
    Safer.from = function(value, encodingOrOffset, length) {
      if (typeof value === "number") {
        throw new TypeError('The "value" argument must not be of type number. Received type ' + typeof value);
      }
      if (value && typeof value.length === "undefined") {
        throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof value);
      }
      return Buffer2(value, encodingOrOffset, length);
    };
  }
  if (!Safer.alloc) {
    Safer.alloc = function(size, fill, encoding) {
      if (typeof size !== "number") {
        throw new TypeError('The "size" argument must be of type number. Received type ' + typeof size);
      }
      if (size < 0 || size >= 2 * (1 << 30)) {
        throw new RangeError('The value "' + size + '" is invalid for option "size"');
      }
      var buf = Buffer2(size);
      if (!fill || fill.length === 0) {
        buf.fill(0);
      } else if (typeof encoding === "string") {
        buf.fill(fill, encoding);
      } else {
        buf.fill(fill);
      }
      return buf;
    };
  }
  if (!safer.kStringMaxLength) {
    try {
      safer.kStringMaxLength = process.binding("buffer").kStringMaxLength;
    } catch (e) {
    }
  }
  if (!safer.constants) {
    safer.constants = {
      MAX_LENGTH: safer.kMaxLength
    };
    if (safer.kStringMaxLength) {
      safer.constants.MAX_STRING_LENGTH = safer.kStringMaxLength;
    }
  }
  module.exports = safer;
});

// node_modules/iconv-lite/lib/bom-handling.js
var require_bom_handling = __commonJS((exports) => {
  var BOMChar = "\uFEFF";
  exports.PrependBOM = PrependBOMWrapper;
  function PrependBOMWrapper(encoder, options) {
    this.encoder = encoder;
    this.addBOM = true;
  }
  PrependBOMWrapper.prototype.write = function(str) {
    if (this.addBOM) {
      str = BOMChar + str;
      this.addBOM = false;
    }
    return this.encoder.write(str);
  };
  PrependBOMWrapper.prototype.end = function() {
    return this.encoder.end();
  };
  exports.StripBOM = StripBOMWrapper;
  function StripBOMWrapper(decoder, options) {
    this.decoder = decoder;
    this.pass = false;
    this.options = options || {};
  }
  StripBOMWrapper.prototype.write = function(buf) {
    var res = this.decoder.write(buf);
    if (this.pass || !res)
      return res;
    if (res[0] === BOMChar) {
      res = res.slice(1);
      if (typeof this.options.stripBOM === "function")
        this.options.stripBOM();
    }
    this.pass = true;
    return res;
  };
  StripBOMWrapper.prototype.end = function() {
    return this.decoder.end();
  };
});

// node_modules/iconv-lite/encodings/internal.js
var require_internal = __commonJS((exports, module) => {
  var Buffer2 = require_safer().Buffer;
  module.exports = {
    utf8: { type: "_internal", bomAware: true },
    cesu8: { type: "_internal", bomAware: true },
    unicode11utf8: "utf8",
    ucs2: { type: "_internal", bomAware: true },
    utf16le: "ucs2",
    binary: { type: "_internal" },
    base64: { type: "_internal" },
    hex: { type: "_internal" },
    _internal: InternalCodec
  };
  function InternalCodec(codecOptions, iconv) {
    this.enc = codecOptions.encodingName;
    this.bomAware = codecOptions.bomAware;
    if (this.enc === "base64")
      this.encoder = InternalEncoderBase64;
    else if (this.enc === "cesu8") {
      this.enc = "utf8";
      this.encoder = InternalEncoderCesu8;
      if (Buffer2.from("eda0bdedb2a9", "hex").toString() !== "\uD83D\uDCA9") {
        this.decoder = InternalDecoderCesu8;
        this.defaultCharUnicode = iconv.defaultCharUnicode;
      }
    }
  }
  InternalCodec.prototype.encoder = InternalEncoder;
  InternalCodec.prototype.decoder = InternalDecoder;
  var StringDecoder = __require("string_decoder").StringDecoder;
  if (!StringDecoder.prototype.end)
    StringDecoder.prototype.end = function() {
    };
  function InternalDecoder(options, codec) {
    StringDecoder.call(this, codec.enc);
  }
  InternalDecoder.prototype = StringDecoder.prototype;
  function InternalEncoder(options, codec) {
    this.enc = codec.enc;
  }
  InternalEncoder.prototype.write = function(str) {
    return Buffer2.from(str, this.enc);
  };
  InternalEncoder.prototype.end = function() {
  };
  function InternalEncoderBase64(options, codec) {
    this.prevStr = "";
  }
  InternalEncoderBase64.prototype.write = function(str) {
    str = this.prevStr + str;
    var completeQuads = str.length - str.length % 4;
    this.prevStr = str.slice(completeQuads);
    str = str.slice(0, completeQuads);
    return Buffer2.from(str, "base64");
  };
  InternalEncoderBase64.prototype.end = function() {
    return Buffer2.from(this.prevStr, "base64");
  };
  function InternalEncoderCesu8(options, codec) {
  }
  InternalEncoderCesu8.prototype.write = function(str) {
    var buf = Buffer2.alloc(str.length * 3), bufIdx = 0;
    for (var i = 0;i < str.length; i++) {
      var charCode = str.charCodeAt(i);
      if (charCode < 128)
        buf[bufIdx++] = charCode;
      else if (charCode < 2048) {
        buf[bufIdx++] = 192 + (charCode >>> 6);
        buf[bufIdx++] = 128 + (charCode & 63);
      } else {
        buf[bufIdx++] = 224 + (charCode >>> 12);
        buf[bufIdx++] = 128 + (charCode >>> 6 & 63);
        buf[bufIdx++] = 128 + (charCode & 63);
      }
    }
    return buf.slice(0, bufIdx);
  };
  InternalEncoderCesu8.prototype.end = function() {
  };
  function InternalDecoderCesu8(options, codec) {
    this.acc = 0;
    this.contBytes = 0;
    this.accBytes = 0;
    this.defaultCharUnicode = codec.defaultCharUnicode;
  }
  InternalDecoderCesu8.prototype.write = function(buf) {
    var acc = this.acc, contBytes = this.contBytes, accBytes = this.accBytes, res = "";
    for (var i = 0;i < buf.length; i++) {
      var curByte = buf[i];
      if ((curByte & 192) !== 128) {
        if (contBytes > 0) {
          res += this.defaultCharUnicode;
          contBytes = 0;
        }
        if (curByte < 128) {
          res += String.fromCharCode(curByte);
        } else if (curByte < 224) {
          acc = curByte & 31;
          contBytes = 1;
          accBytes = 1;
        } else if (curByte < 240) {
          acc = curByte & 15;
          contBytes = 2;
          accBytes = 1;
        } else {
          res += this.defaultCharUnicode;
        }
      } else {
        if (contBytes > 0) {
          acc = acc << 6 | curByte & 63;
          contBytes--;
          accBytes++;
          if (contBytes === 0) {
            if (accBytes === 2 && acc < 128 && acc > 0)
              res += this.defaultCharUnicode;
            else if (accBytes === 3 && acc < 2048)
              res += this.defaultCharUnicode;
            else
              res += String.fromCharCode(acc);
          }
        } else {
          res += this.defaultCharUnicode;
        }
      }
    }
    this.acc = acc;
    this.contBytes = contBytes;
    this.accBytes = accBytes;
    return res;
  };
  InternalDecoderCesu8.prototype.end = function() {
    var res = 0;
    if (this.contBytes > 0)
      res += this.defaultCharUnicode;
    return res;
  };
});

// node_modules/iconv-lite/encodings/utf16.js
var require_utf16 = __commonJS((exports) => {
  var Buffer2 = require_safer().Buffer;
  exports.utf16be = Utf16BECodec;
  function Utf16BECodec() {
  }
  Utf16BECodec.prototype.encoder = Utf16BEEncoder;
  Utf16BECodec.prototype.decoder = Utf16BEDecoder;
  Utf16BECodec.prototype.bomAware = true;
  function Utf16BEEncoder() {
  }
  Utf16BEEncoder.prototype.write = function(str) {
    var buf = Buffer2.from(str, "ucs2");
    for (var i = 0;i < buf.length; i += 2) {
      var tmp = buf[i];
      buf[i] = buf[i + 1];
      buf[i + 1] = tmp;
    }
    return buf;
  };
  Utf16BEEncoder.prototype.end = function() {
  };
  function Utf16BEDecoder() {
    this.overflowByte = -1;
  }
  Utf16BEDecoder.prototype.write = function(buf) {
    if (buf.length == 0)
      return "";
    var buf2 = Buffer2.alloc(buf.length + 1), i = 0, j = 0;
    if (this.overflowByte !== -1) {
      buf2[0] = buf[0];
      buf2[1] = this.overflowByte;
      i = 1;
      j = 2;
    }
    for (;i < buf.length - 1; i += 2, j += 2) {
      buf2[j] = buf[i + 1];
      buf2[j + 1] = buf[i];
    }
    this.overflowByte = i == buf.length - 1 ? buf[buf.length - 1] : -1;
    return buf2.slice(0, j).toString("ucs2");
  };
  Utf16BEDecoder.prototype.end = function() {
  };
  exports.utf16 = Utf16Codec;
  function Utf16Codec(codecOptions, iconv) {
    this.iconv = iconv;
  }
  Utf16Codec.prototype.encoder = Utf16Encoder;
  Utf16Codec.prototype.decoder = Utf16Decoder;
  function Utf16Encoder(options, codec) {
    options = options || {};
    if (options.addBOM === undefined)
      options.addBOM = true;
    this.encoder = codec.iconv.getEncoder("utf-16le", options);
  }
  Utf16Encoder.prototype.write = function(str) {
    return this.encoder.write(str);
  };
  Utf16Encoder.prototype.end = function() {
    return this.encoder.end();
  };
  function Utf16Decoder(options, codec) {
    this.decoder = null;
    this.initialBytes = [];
    this.initialBytesLen = 0;
    this.options = options || {};
    this.iconv = codec.iconv;
  }
  Utf16Decoder.prototype.write = function(buf) {
    if (!this.decoder) {
      this.initialBytes.push(buf);
      this.initialBytesLen += buf.length;
      if (this.initialBytesLen < 16)
        return "";
      var buf = Buffer2.concat(this.initialBytes), encoding = detectEncoding(buf, this.options.defaultEncoding);
      this.decoder = this.iconv.getDecoder(encoding, this.options);
      this.initialBytes.length = this.initialBytesLen = 0;
    }
    return this.decoder.write(buf);
  };
  Utf16Decoder.prototype.end = function() {
    if (!this.decoder) {
      var buf = Buffer2.concat(this.initialBytes), encoding = detectEncoding(buf, this.options.defaultEncoding);
      this.decoder = this.iconv.getDecoder(encoding, this.options);
      var res = this.decoder.write(buf), trail = this.decoder.end();
      return trail ? res + trail : res;
    }
    return this.decoder.end();
  };
  function detectEncoding(buf, defaultEncoding) {
    var enc = defaultEncoding || "utf-16le";
    if (buf.length >= 2) {
      if (buf[0] == 254 && buf[1] == 255)
        enc = "utf-16be";
      else if (buf[0] == 255 && buf[1] == 254)
        enc = "utf-16le";
      else {
        var asciiCharsLE = 0, asciiCharsBE = 0, _len = Math.min(buf.length - buf.length % 2, 64);
        for (var i = 0;i < _len; i += 2) {
          if (buf[i] === 0 && buf[i + 1] !== 0)
            asciiCharsBE++;
          if (buf[i] !== 0 && buf[i + 1] === 0)
            asciiCharsLE++;
        }
        if (asciiCharsBE > asciiCharsLE)
          enc = "utf-16be";
        else if (asciiCharsBE < asciiCharsLE)
          enc = "utf-16le";
      }
    }
    return enc;
  }
});

// node_modules/iconv-lite/encodings/utf7.js
var require_utf7 = __commonJS((exports) => {
  var Buffer2 = require_safer().Buffer;
  exports.utf7 = Utf7Codec;
  exports.unicode11utf7 = "utf7";
  function Utf7Codec(codecOptions, iconv) {
    this.iconv = iconv;
  }
  Utf7Codec.prototype.encoder = Utf7Encoder;
  Utf7Codec.prototype.decoder = Utf7Decoder;
  Utf7Codec.prototype.bomAware = true;
  var nonDirectChars = /[^A-Za-z0-9'\(\),-\.\/:\? \n\r\t]+/g;
  function Utf7Encoder(options, codec) {
    this.iconv = codec.iconv;
  }
  Utf7Encoder.prototype.write = function(str) {
    return Buffer2.from(str.replace(nonDirectChars, function(chunk) {
      return "+" + (chunk === "+" ? "" : this.iconv.encode(chunk, "utf16-be").toString("base64").replace(/=+$/, "")) + "-";
    }.bind(this)));
  };
  Utf7Encoder.prototype.end = function() {
  };
  function Utf7Decoder(options, codec) {
    this.iconv = codec.iconv;
    this.inBase64 = false;
    this.base64Accum = "";
  }
  var base64Regex = /[A-Za-z0-9\/+]/;
  var base64Chars = [];
  for (i = 0;i < 256; i++)
    base64Chars[i] = base64Regex.test(String.fromCharCode(i));
  var i;
  var plusChar = 43;
  var minusChar = 45;
  var andChar = 38;
  Utf7Decoder.prototype.write = function(buf) {
    var res = "", lastI = 0, inBase64 = this.inBase64, base64Accum = this.base64Accum;
    for (var i2 = 0;i2 < buf.length; i2++) {
      if (!inBase64) {
        if (buf[i2] == plusChar) {
          res += this.iconv.decode(buf.slice(lastI, i2), "ascii");
          lastI = i2 + 1;
          inBase64 = true;
        }
      } else {
        if (!base64Chars[buf[i2]]) {
          if (i2 == lastI && buf[i2] == minusChar) {
            res += "+";
          } else {
            var b64str = base64Accum + buf.slice(lastI, i2).toString();
            res += this.iconv.decode(Buffer2.from(b64str, "base64"), "utf16-be");
          }
          if (buf[i2] != minusChar)
            i2--;
          lastI = i2 + 1;
          inBase64 = false;
          base64Accum = "";
        }
      }
    }
    if (!inBase64) {
      res += this.iconv.decode(buf.slice(lastI), "ascii");
    } else {
      var b64str = base64Accum + buf.slice(lastI).toString();
      var canBeDecoded = b64str.length - b64str.length % 8;
      base64Accum = b64str.slice(canBeDecoded);
      b64str = b64str.slice(0, canBeDecoded);
      res += this.iconv.decode(Buffer2.from(b64str, "base64"), "utf16-be");
    }
    this.inBase64 = inBase64;
    this.base64Accum = base64Accum;
    return res;
  };
  Utf7Decoder.prototype.end = function() {
    var res = "";
    if (this.inBase64 && this.base64Accum.length > 0)
      res = this.iconv.decode(Buffer2.from(this.base64Accum, "base64"), "utf16-be");
    this.inBase64 = false;
    this.base64Accum = "";
    return res;
  };
  exports.utf7imap = Utf7IMAPCodec;
  function Utf7IMAPCodec(codecOptions, iconv) {
    this.iconv = iconv;
  }
  Utf7IMAPCodec.prototype.encoder = Utf7IMAPEncoder;
  Utf7IMAPCodec.prototype.decoder = Utf7IMAPDecoder;
  Utf7IMAPCodec.prototype.bomAware = true;
  function Utf7IMAPEncoder(options, codec) {
    this.iconv = codec.iconv;
    this.inBase64 = false;
    this.base64Accum = Buffer2.alloc(6);
    this.base64AccumIdx = 0;
  }
  Utf7IMAPEncoder.prototype.write = function(str) {
    var inBase64 = this.inBase64, base64Accum = this.base64Accum, base64AccumIdx = this.base64AccumIdx, buf = Buffer2.alloc(str.length * 5 + 10), bufIdx = 0;
    for (var i2 = 0;i2 < str.length; i2++) {
      var uChar = str.charCodeAt(i2);
      if (32 <= uChar && uChar <= 126) {
        if (inBase64) {
          if (base64AccumIdx > 0) {
            bufIdx += buf.write(base64Accum.slice(0, base64AccumIdx).toString("base64").replace(/\//g, ",").replace(/=+$/, ""), bufIdx);
            base64AccumIdx = 0;
          }
          buf[bufIdx++] = minusChar;
          inBase64 = false;
        }
        if (!inBase64) {
          buf[bufIdx++] = uChar;
          if (uChar === andChar)
            buf[bufIdx++] = minusChar;
        }
      } else {
        if (!inBase64) {
          buf[bufIdx++] = andChar;
          inBase64 = true;
        }
        if (inBase64) {
          base64Accum[base64AccumIdx++] = uChar >> 8;
          base64Accum[base64AccumIdx++] = uChar & 255;
          if (base64AccumIdx == base64Accum.length) {
            bufIdx += buf.write(base64Accum.toString("base64").replace(/\//g, ","), bufIdx);
            base64AccumIdx = 0;
          }
        }
      }
    }
    this.inBase64 = inBase64;
    this.base64AccumIdx = base64AccumIdx;
    return buf.slice(0, bufIdx);
  };
  Utf7IMAPEncoder.prototype.end = function() {
    var buf = Buffer2.alloc(10), bufIdx = 0;
    if (this.inBase64) {
      if (this.base64AccumIdx > 0) {
        bufIdx += buf.write(this.base64Accum.slice(0, this.base64AccumIdx).toString("base64").replace(/\//g, ",").replace(/=+$/, ""), bufIdx);
        this.base64AccumIdx = 0;
      }
      buf[bufIdx++] = minusChar;
      this.inBase64 = false;
    }
    return buf.slice(0, bufIdx);
  };
  function Utf7IMAPDecoder(options, codec) {
    this.iconv = codec.iconv;
    this.inBase64 = false;
    this.base64Accum = "";
  }
  var base64IMAPChars = base64Chars.slice();
  base64IMAPChars[44] = true;
  Utf7IMAPDecoder.prototype.write = function(buf) {
    var res = "", lastI = 0, inBase64 = this.inBase64, base64Accum = this.base64Accum;
    for (var i2 = 0;i2 < buf.length; i2++) {
      if (!inBase64) {
        if (buf[i2] == andChar) {
          res += this.iconv.decode(buf.slice(lastI, i2), "ascii");
          lastI = i2 + 1;
          inBase64 = true;
        }
      } else {
        if (!base64IMAPChars[buf[i2]]) {
          if (i2 == lastI && buf[i2] == minusChar) {
            res += "&";
          } else {
            var b64str = base64Accum + buf.slice(lastI, i2).toString().replace(/,/g, "/");
            res += this.iconv.decode(Buffer2.from(b64str, "base64"), "utf16-be");
          }
          if (buf[i2] != minusChar)
            i2--;
          lastI = i2 + 1;
          inBase64 = false;
          base64Accum = "";
        }
      }
    }
    if (!inBase64) {
      res += this.iconv.decode(buf.slice(lastI), "ascii");
    } else {
      var b64str = base64Accum + buf.slice(lastI).toString().replace(/,/g, "/");
      var canBeDecoded = b64str.length - b64str.length % 8;
      base64Accum = b64str.slice(canBeDecoded);
      b64str = b64str.slice(0, canBeDecoded);
      res += this.iconv.decode(Buffer2.from(b64str, "base64"), "utf16-be");
    }
    this.inBase64 = inBase64;
    this.base64Accum = base64Accum;
    return res;
  };
  Utf7IMAPDecoder.prototype.end = function() {
    var res = "";
    if (this.inBase64 && this.base64Accum.length > 0)
      res = this.iconv.decode(Buffer2.from(this.base64Accum, "base64"), "utf16-be");
    this.inBase64 = false;
    this.base64Accum = "";
    return res;
  };
});

// node_modules/iconv-lite/encodings/sbcs-codec.js
var require_sbcs_codec = __commonJS((exports) => {
  var Buffer2 = require_safer().Buffer;
  exports._sbcs = SBCSCodec;
  function SBCSCodec(codecOptions, iconv) {
    if (!codecOptions)
      throw new Error("SBCS codec is called without the data.");
    if (!codecOptions.chars || codecOptions.chars.length !== 128 && codecOptions.chars.length !== 256)
      throw new Error("Encoding '" + codecOptions.type + "' has incorrect 'chars' (must be of len 128 or 256)");
    if (codecOptions.chars.length === 128) {
      var asciiString = "";
      for (var i = 0;i < 128; i++)
        asciiString += String.fromCharCode(i);
      codecOptions.chars = asciiString + codecOptions.chars;
    }
    this.decodeBuf = Buffer2.from(codecOptions.chars, "ucs2");
    var encodeBuf = Buffer2.alloc(65536, iconv.defaultCharSingleByte.charCodeAt(0));
    for (var i = 0;i < codecOptions.chars.length; i++)
      encodeBuf[codecOptions.chars.charCodeAt(i)] = i;
    this.encodeBuf = encodeBuf;
  }
  SBCSCodec.prototype.encoder = SBCSEncoder;
  SBCSCodec.prototype.decoder = SBCSDecoder;
  function SBCSEncoder(options, codec) {
    this.encodeBuf = codec.encodeBuf;
  }
  SBCSEncoder.prototype.write = function(str) {
    var buf = Buffer2.alloc(str.length);
    for (var i = 0;i < str.length; i++)
      buf[i] = this.encodeBuf[str.charCodeAt(i)];
    return buf;
  };
  SBCSEncoder.prototype.end = function() {
  };
  function SBCSDecoder(options, codec) {
    this.decodeBuf = codec.decodeBuf;
  }
  SBCSDecoder.prototype.write = function(buf) {
    var decodeBuf = this.decodeBuf;
    var newBuf = Buffer2.alloc(buf.length * 2);
    var idx1 = 0, idx2 = 0;
    for (var i = 0;i < buf.length; i++) {
      idx1 = buf[i] * 2;
      idx2 = i * 2;
      newBuf[idx2] = decodeBuf[idx1];
      newBuf[idx2 + 1] = decodeBuf[idx1 + 1];
    }
    return newBuf.toString("ucs2");
  };
  SBCSDecoder.prototype.end = function() {
  };
});

// node_modules/iconv-lite/encodings/sbcs-data.js
var require_sbcs_data = __commonJS((exports, module) => {
  module.exports = {
    "10029": "maccenteuro",
    maccenteuro: {
      type: "_sbcs",
      chars: "ÄĀāÉĄÖÜáąČäčĆćéŹźĎíďĒēĖóėôöõúĚěü†°Ę£§•¶ß®©™ę¨≠ģĮįĪ≤≥īĶ∂∑łĻļĽľĹĺŅņŃ¬√ńŇ∆«»… ňŐÕőŌ–—“”‘’÷◊ōŔŕŘ‹›řŖŗŠ‚„šŚśÁŤťÍŽžŪÓÔūŮÚůŰűŲųÝýķŻŁżĢˇ"
    },
    "808": "cp808",
    ibm808: "cp808",
    cp808: {
      type: "_sbcs",
      chars: "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмноп░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀рстуфхцчшщъыьэюяЁёЄєЇїЎў°∙·√№€■ "
    },
    mik: {
      type: "_sbcs",
      chars: "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя└┴┬├─┼╣║╚╔╩╦╠═╬┐░▒▓│┤№§╗╝┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
    },
    ascii8bit: "ascii",
    usascii: "ascii",
    ansix34: "ascii",
    ansix341968: "ascii",
    ansix341986: "ascii",
    csascii: "ascii",
    cp367: "ascii",
    ibm367: "ascii",
    isoir6: "ascii",
    iso646us: "ascii",
    iso646irv: "ascii",
    us: "ascii",
    latin1: "iso88591",
    latin2: "iso88592",
    latin3: "iso88593",
    latin4: "iso88594",
    latin5: "iso88599",
    latin6: "iso885910",
    latin7: "iso885913",
    latin8: "iso885914",
    latin9: "iso885915",
    latin10: "iso885916",
    csisolatin1: "iso88591",
    csisolatin2: "iso88592",
    csisolatin3: "iso88593",
    csisolatin4: "iso88594",
    csisolatincyrillic: "iso88595",
    csisolatinarabic: "iso88596",
    csisolatingreek: "iso88597",
    csisolatinhebrew: "iso88598",
    csisolatin5: "iso88599",
    csisolatin6: "iso885910",
    l1: "iso88591",
    l2: "iso88592",
    l3: "iso88593",
    l4: "iso88594",
    l5: "iso88599",
    l6: "iso885910",
    l7: "iso885913",
    l8: "iso885914",
    l9: "iso885915",
    l10: "iso885916",
    isoir14: "iso646jp",
    isoir57: "iso646cn",
    isoir100: "iso88591",
    isoir101: "iso88592",
    isoir109: "iso88593",
    isoir110: "iso88594",
    isoir144: "iso88595",
    isoir127: "iso88596",
    isoir126: "iso88597",
    isoir138: "iso88598",
    isoir148: "iso88599",
    isoir157: "iso885910",
    isoir166: "tis620",
    isoir179: "iso885913",
    isoir199: "iso885914",
    isoir203: "iso885915",
    isoir226: "iso885916",
    cp819: "iso88591",
    ibm819: "iso88591",
    cyrillic: "iso88595",
    arabic: "iso88596",
    arabic8: "iso88596",
    ecma114: "iso88596",
    asmo708: "iso88596",
    greek: "iso88597",
    greek8: "iso88597",
    ecma118: "iso88597",
    elot928: "iso88597",
    hebrew: "iso88598",
    hebrew8: "iso88598",
    turkish: "iso88599",
    turkish8: "iso88599",
    thai: "iso885911",
    thai8: "iso885911",
    celtic: "iso885914",
    celtic8: "iso885914",
    isoceltic: "iso885914",
    tis6200: "tis620",
    tis62025291: "tis620",
    tis62025330: "tis620",
    "10000": "macroman",
    "10006": "macgreek",
    "10007": "maccyrillic",
    "10079": "maciceland",
    "10081": "macturkish",
    cspc8codepage437: "cp437",
    cspc775baltic: "cp775",
    cspc850multilingual: "cp850",
    cspcp852: "cp852",
    cspc862latinhebrew: "cp862",
    cpgr: "cp869",
    msee: "cp1250",
    mscyrl: "cp1251",
    msansi: "cp1252",
    msgreek: "cp1253",
    msturk: "cp1254",
    mshebr: "cp1255",
    msarab: "cp1256",
    winbaltrim: "cp1257",
    cp20866: "koi8r",
    "20866": "koi8r",
    ibm878: "koi8r",
    cskoi8r: "koi8r",
    cp21866: "koi8u",
    "21866": "koi8u",
    ibm1168: "koi8u",
    strk10482002: "rk1048",
    tcvn5712: "tcvn",
    tcvn57121: "tcvn",
    gb198880: "iso646cn",
    cn: "iso646cn",
    csiso14jisc6220ro: "iso646jp",
    jisc62201969ro: "iso646jp",
    jp: "iso646jp",
    cshproman8: "hproman8",
    r8: "hproman8",
    roman8: "hproman8",
    xroman8: "hproman8",
    ibm1051: "hproman8",
    mac: "macintosh",
    csmacintosh: "macintosh"
  };
});

// node_modules/iconv-lite/encodings/sbcs-data-generated.js
var require_sbcs_data_generated = __commonJS((exports, module) => {
  module.exports = {
    "437": "cp437",
    "737": "cp737",
    "775": "cp775",
    "850": "cp850",
    "852": "cp852",
    "855": "cp855",
    "856": "cp856",
    "857": "cp857",
    "858": "cp858",
    "860": "cp860",
    "861": "cp861",
    "862": "cp862",
    "863": "cp863",
    "864": "cp864",
    "865": "cp865",
    "866": "cp866",
    "869": "cp869",
    "874": "windows874",
    "922": "cp922",
    "1046": "cp1046",
    "1124": "cp1124",
    "1125": "cp1125",
    "1129": "cp1129",
    "1133": "cp1133",
    "1161": "cp1161",
    "1162": "cp1162",
    "1163": "cp1163",
    "1250": "windows1250",
    "1251": "windows1251",
    "1252": "windows1252",
    "1253": "windows1253",
    "1254": "windows1254",
    "1255": "windows1255",
    "1256": "windows1256",
    "1257": "windows1257",
    "1258": "windows1258",
    "28591": "iso88591",
    "28592": "iso88592",
    "28593": "iso88593",
    "28594": "iso88594",
    "28595": "iso88595",
    "28596": "iso88596",
    "28597": "iso88597",
    "28598": "iso88598",
    "28599": "iso88599",
    "28600": "iso885910",
    "28601": "iso885911",
    "28603": "iso885913",
    "28604": "iso885914",
    "28605": "iso885915",
    "28606": "iso885916",
    windows874: {
      type: "_sbcs",
      chars: "€����…�����������‘’“”•–—�������� กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู����฿เแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛����"
    },
    win874: "windows874",
    cp874: "windows874",
    windows1250: {
      type: "_sbcs",
      chars: "€�‚�„…†‡�‰Š‹ŚŤŽŹ�‘’“”•–—�™š›śťžź ˇ˘Ł¤Ą¦§¨©Ş«¬­®Ż°±˛ł´µ¶·¸ąş»Ľ˝ľżŔÁÂĂÄĹĆÇČÉĘËĚÍÎĎĐŃŇÓÔŐÖ×ŘŮÚŰÜÝŢßŕáâăäĺćçčéęëěíîďđńňóôőö÷řůúűüýţ˙"
    },
    win1250: "windows1250",
    cp1250: "windows1250",
    windows1251: {
      type: "_sbcs",
      chars: "ЂЃ‚ѓ„…†‡€‰Љ‹ЊЌЋЏђ‘’“”•–—�™љ›њќћџ ЎўЈ¤Ґ¦§Ё©Є«¬­®Ї°±Ііґµ¶·ё№є»јЅѕїАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя"
    },
    win1251: "windows1251",
    cp1251: "windows1251",
    windows1252: {
      type: "_sbcs",
      chars: "€�‚ƒ„…†‡ˆ‰Š‹Œ�Ž��‘’“”•–—˜™š›œ�žŸ ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ"
    },
    win1252: "windows1252",
    cp1252: "windows1252",
    windows1253: {
      type: "_sbcs",
      chars: "€�‚ƒ„…†‡�‰�‹�����‘’“”•–—�™�›���� ΅Ά£¤¥¦§¨©�«¬­®―°±²³΄µ¶·ΈΉΊ»Ό½ΎΏΐΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡ�ΣΤΥΦΧΨΩΪΫάέήίΰαβγδεζηθικλμνξοπρςστυφχψωϊϋόύώ�"
    },
    win1253: "windows1253",
    cp1253: "windows1253",
    windows1254: {
      type: "_sbcs",
      chars: "€�‚ƒ„…†‡ˆ‰Š‹Œ����‘’“”•–—˜™š›œ��Ÿ ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏĞÑÒÓÔÕÖ×ØÙÚÛÜİŞßàáâãäåæçèéêëìíîïğñòóôõö÷øùúûüışÿ"
    },
    win1254: "windows1254",
    cp1254: "windows1254",
    windows1255: {
      type: "_sbcs",
      chars: "€�‚ƒ„…†‡ˆ‰�‹�����‘’“”•–—˜™�›���� ¡¢£₪¥¦§¨©×«¬­®¯°±²³´µ¶·¸¹÷»¼½¾¿ְֱֲֳִֵֶַָֹֺֻּֽ־ֿ׀ׁׂ׃װױײ׳״�������אבגדהוזחטיךכלםמןנסעףפץצקרשת��‎‏�"
    },
    win1255: "windows1255",
    cp1255: "windows1255",
    windows1256: {
      type: "_sbcs",
      chars: "€پ‚ƒ„…†‡ˆ‰ٹ‹Œچژڈگ‘’“”•–—ک™ڑ›œ‌‍ں ،¢£¤¥¦§¨©ھ«¬­®¯°±²³´µ¶·¸¹؛»¼½¾؟ہءآأؤإئابةتثجحخدذرزسشصض×طظعغـفقكàلâمنهوçèéêëىيîïًٌٍَôُِ÷ّùْûü‎‏ے"
    },
    win1256: "windows1256",
    cp1256: "windows1256",
    windows1257: {
      type: "_sbcs",
      chars: "€�‚�„…†‡�‰�‹�¨ˇ¸�‘’“”•–—�™�›�¯˛� �¢£¤�¦§Ø©Ŗ«¬­®Æ°±²³´µ¶·ø¹ŗ»¼½¾æĄĮĀĆÄÅĘĒČÉŹĖĢĶĪĻŠŃŅÓŌÕÖ×ŲŁŚŪÜŻŽßąįāćäåęēčéźėģķīļšńņóōõö÷ųłśūüżž˙"
    },
    win1257: "windows1257",
    cp1257: "windows1257",
    windows1258: {
      type: "_sbcs",
      chars: "€�‚ƒ„…†‡ˆ‰�‹Œ����‘’“”•–—˜™�›œ��Ÿ ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂĂÄÅÆÇÈÉÊË̀ÍÎÏĐÑ̉ÓÔƠÖ×ØÙÚÛÜỮßàáâăäåæçèéêë́íîïđṇ̃óôơö÷øùúûüư₫ÿ"
    },
    win1258: "windows1258",
    cp1258: "windows1258",
    iso88591: {
      type: "_sbcs",
      chars: " ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ"
    },
    cp28591: "iso88591",
    iso88592: {
      type: "_sbcs",
      chars: " Ą˘Ł¤ĽŚ§¨ŠŞŤŹ­ŽŻ°ą˛ł´ľśˇ¸šşťź˝žżŔÁÂĂÄĹĆÇČÉĘËĚÍÎĎĐŃŇÓÔŐÖ×ŘŮÚŰÜÝŢßŕáâăäĺćçčéęëěíîďđńňóôőö÷řůúűüýţ˙"
    },
    cp28592: "iso88592",
    iso88593: {
      type: "_sbcs",
      chars: " Ħ˘£¤�Ĥ§¨İŞĞĴ­�Ż°ħ²³´µĥ·¸ışğĵ½�żÀÁÂ�ÄĊĈÇÈÉÊËÌÍÎÏ�ÑÒÓÔĠÖ×ĜÙÚÛÜŬŜßàáâ�äċĉçèéêëìíîï�ñòóôġö÷ĝùúûüŭŝ˙"
    },
    cp28593: "iso88593",
    iso88594: {
      type: "_sbcs",
      chars: " ĄĸŖ¤ĨĻ§¨ŠĒĢŦ­Ž¯°ą˛ŗ´ĩļˇ¸šēģŧŊžŋĀÁÂÃÄÅÆĮČÉĘËĖÍÎĪĐŅŌĶÔÕÖ×ØŲÚÛÜŨŪßāáâãäåæįčéęëėíîīđņōķôõö÷øųúûüũū˙"
    },
    cp28594: "iso88594",
    iso88595: {
      type: "_sbcs",
      chars: " ЁЂЃЄЅІЇЈЉЊЋЌ­ЎЏАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя№ёђѓєѕіїјљњћќ§ўџ"
    },
    cp28595: "iso88595",
    iso88596: {
      type: "_sbcs",
      chars: " ���¤�������،­�������������؛���؟�ءآأؤإئابةتثجحخدذرزسشصضطظعغ�����ـفقكلمنهوىيًٌٍَُِّْ�������������"
    },
    cp28596: "iso88596",
    iso88597: {
      type: "_sbcs",
      chars: " ‘’£€₯¦§¨©ͺ«¬­�―°±²³΄΅Ά·ΈΉΊ»Ό½ΎΏΐΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡ�ΣΤΥΦΧΨΩΪΫάέήίΰαβγδεζηθικλμνξοπρςστυφχψωϊϋόύώ�"
    },
    cp28597: "iso88597",
    iso88598: {
      type: "_sbcs",
      chars: " �¢£¤¥¦§¨©×«¬­®¯°±²³´µ¶·¸¹÷»¼½¾��������������������������������‗אבגדהוזחטיךכלםמןנסעףפץצקרשת��‎‏�"
    },
    cp28598: "iso88598",
    iso88599: {
      type: "_sbcs",
      chars: " ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏĞÑÒÓÔÕÖ×ØÙÚÛÜİŞßàáâãäåæçèéêëìíîïğñòóôõö÷øùúûüışÿ"
    },
    cp28599: "iso88599",
    iso885910: {
      type: "_sbcs",
      chars: " ĄĒĢĪĨĶ§ĻĐŠŦŽ­ŪŊ°ąēģīĩķ·ļđšŧž―ūŋĀÁÂÃÄÅÆĮČÉĘËĖÍÎÏÐŅŌÓÔÕÖŨØŲÚÛÜÝÞßāáâãäåæįčéęëėíîïðņōóôõöũøųúûüýþĸ"
    },
    cp28600: "iso885910",
    iso885911: {
      type: "_sbcs",
      chars: " กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู����฿เแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛����"
    },
    cp28601: "iso885911",
    iso885913: {
      type: "_sbcs",
      chars: " ”¢£¤„¦§Ø©Ŗ«¬­®Æ°±²³“µ¶·ø¹ŗ»¼½¾æĄĮĀĆÄÅĘĒČÉŹĖĢĶĪĻŠŃŅÓŌÕÖ×ŲŁŚŪÜŻŽßąįāćäåęēčéźėģķīļšńņóōõö÷ųłśūüżž’"
    },
    cp28603: "iso885913",
    iso885914: {
      type: "_sbcs",
      chars: " Ḃḃ£ĊċḊ§Ẁ©ẂḋỲ­®ŸḞḟĠġṀṁ¶ṖẁṗẃṠỳẄẅṡÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏŴÑÒÓÔÕÖṪØÙÚÛÜÝŶßàáâãäåæçèéêëìíîïŵñòóôõöṫøùúûüýŷÿ"
    },
    cp28604: "iso885914",
    iso885915: {
      type: "_sbcs",
      chars: " ¡¢£€¥Š§š©ª«¬­®¯°±²³Žµ¶·ž¹º»ŒœŸ¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ"
    },
    cp28605: "iso885915",
    iso885916: {
      type: "_sbcs",
      chars: " ĄąŁ€„Š§š©Ș«Ź­źŻ°±ČłŽ”¶·žčș»ŒœŸżÀÁÂĂÄĆÆÇÈÉÊËÌÍÎÏĐŃÒÓÔŐÖŚŰÙÚÛÜĘȚßàáâăäćæçèéêëìíîïđńòóôőöśűùúûüęțÿ"
    },
    cp28606: "iso885916",
    cp437: {
      type: "_sbcs",
      chars: "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
    },
    ibm437: "cp437",
    csibm437: "cp437",
    cp737: {
      type: "_sbcs",
      chars: "ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩαβγδεζηθικλμνξοπρσςτυφχψ░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀ωάέήϊίόύϋώΆΈΉΊΌΎΏ±≥≤ΪΫ÷≈°∙·√ⁿ²■ "
    },
    ibm737: "cp737",
    csibm737: "cp737",
    cp775: {
      type: "_sbcs",
      chars: "ĆüéāäģåćłēŖŗīŹÄÅÉæÆōöĢ¢ŚśÖÜø£Ø×¤ĀĪóŻżź”¦©®¬½¼Ł«»░▒▓│┤ĄČĘĖ╣║╗╝ĮŠ┐└┴┬├─┼ŲŪ╚╔╩╦╠═╬Žąčęėįšųūž┘┌█▄▌▐▀ÓßŌŃõÕµńĶķĻļņĒŅ’­±“¾¶§÷„°∙·¹³²■ "
    },
    ibm775: "cp775",
    csibm775: "cp775",
    cp850: {
      type: "_sbcs",
      chars: "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø×ƒáíóúñÑªº¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ðÐÊËÈıÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµþÞÚÛÙýÝ¯´­±‗¾¶§÷¸°¨·¹³²■ "
    },
    ibm850: "cp850",
    csibm850: "cp850",
    cp852: {
      type: "_sbcs",
      chars: "ÇüéâäůćçłëŐőîŹÄĆÉĹĺôöĽľŚśÖÜŤťŁ×čáíóúĄąŽžĘę¬źČş«»░▒▓│┤ÁÂĚŞ╣║╗╝Żż┐└┴┬├─┼Ăă╚╔╩╦╠═╬¤đĐĎËďŇÍÎě┘┌█▄ŢŮ▀ÓßÔŃńňŠšŔÚŕŰýÝţ´­˝˛ˇ˘§÷¸°¨˙űŘř■ "
    },
    ibm852: "cp852",
    csibm852: "cp852",
    cp855: {
      type: "_sbcs",
      chars: "ђЂѓЃёЁєЄѕЅіІїЇјЈљЉњЊћЋќЌўЎџЏюЮъЪаАбБцЦдДеЕфФгГ«»░▒▓│┤хХиИ╣║╗╝йЙ┐└┴┬├─┼кК╚╔╩╦╠═╬¤лЛмМнНоОп┘┌█▄Пя▀ЯрРсСтТуУжЖвВьЬ№­ыЫзЗшШэЭщЩчЧ§■ "
    },
    ibm855: "cp855",
    csibm855: "cp855",
    cp856: {
      type: "_sbcs",
      chars: "אבגדהוזחטיךכלםמןנסעףפץצקרשת�£�×����������®¬½¼�«»░▒▓│┤���©╣║╗╝¢¥┐└┴┬├─┼��╚╔╩╦╠═╬¤���������┘┌█▄¦�▀������µ�������¯´­±‗¾¶§÷¸°¨·¹³²■ "
    },
    ibm856: "cp856",
    csibm856: "cp856",
    cp857: {
      type: "_sbcs",
      chars: "ÇüéâäàåçêëèïîıÄÅÉæÆôöòûùİÖÜø£ØŞşáíóúñÑĞğ¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ºªÊËÈ�ÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµ�×ÚÛÙìÿ¯´­±�¾¶§÷¸°¨·¹³²■ "
    },
    ibm857: "cp857",
    csibm857: "cp857",
    cp858: {
      type: "_sbcs",
      chars: "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø×ƒáíóúñÑªº¿®¬½¼¡«»░▒▓│┤ÁÂÀ©╣║╗╝¢¥┐└┴┬├─┼ãÃ╚╔╩╦╠═╬¤ðÐÊËÈ€ÍÎÏ┘┌█▄¦Ì▀ÓßÔÒõÕµþÞÚÛÙýÝ¯´­±‗¾¶§÷¸°¨·¹³²■ "
    },
    ibm858: "cp858",
    csibm858: "cp858",
    cp860: {
      type: "_sbcs",
      chars: "ÇüéâãàÁçêÊèÍÔìÃÂÉÀÈôõòÚùÌÕÜ¢£Ù₧ÓáíóúñÑªº¿Ò¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
    },
    ibm860: "cp860",
    csibm860: "cp860",
    cp861: {
      type: "_sbcs",
      chars: "ÇüéâäàåçêëèÐðÞÄÅÉæÆôöþûÝýÖÜø£Ø₧ƒáíóúÁÍÓÚ¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
    },
    ibm861: "cp861",
    csibm861: "cp861",
    cp862: {
      type: "_sbcs",
      chars: "אבגדהוזחטיךכלםמןנסעףפץצקרשת¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
    },
    ibm862: "cp862",
    csibm862: "cp862",
    cp863: {
      type: "_sbcs",
      chars: "ÇüéâÂà¶çêëèïî‗À§ÉÈÊôËÏûù¤ÔÜ¢£ÙÛƒ¦´óú¨¸³¯Î⌐¬½¼¾«»░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
    },
    ibm863: "cp863",
    csibm863: "cp863",
    cp864: {
      type: "_sbcs",
      chars: `\x00\x01\x02\x03\x04\x05\x06\x07\b	
\v\f\r\x0E\x0F\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1A\x1B\x1C\x1D\x1E\x1F !"#$٪&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~°·∙√▒─│┼┤┬├┴┐┌└┘β∞φ±½¼≈«»ﻷﻸ��ﻻﻼ� ­ﺂ£¤ﺄ��ﺎﺏﺕﺙ،ﺝﺡﺥ٠١٢٣٤٥٦٧٨٩ﻑ؛ﺱﺵﺹ؟¢ﺀﺁﺃﺅﻊﺋﺍﺑﺓﺗﺛﺟﺣﺧﺩﺫﺭﺯﺳﺷﺻﺿﻁﻅﻋﻏ¦¬÷×ﻉـﻓﻗﻛﻟﻣﻧﻫﻭﻯﻳﺽﻌﻎﻍﻡﹽّﻥﻩﻬﻰﻲﻐﻕﻵﻶﻝﻙﻱ■�`
    },
    ibm864: "cp864",
    csibm864: "cp864",
    cp865: {
      type: "_sbcs",
      chars: "ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜø£Ø₧ƒáíóúñÑªº¿⌐¬½¼¡«¤░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
    },
    ibm865: "cp865",
    csibm865: "cp865",
    cp866: {
      type: "_sbcs",
      chars: "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмноп░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀рстуфхцчшщъыьэюяЁёЄєЇїЎў°∙·√№¤■ "
    },
    ibm866: "cp866",
    csibm866: "cp866",
    cp869: {
      type: "_sbcs",
      chars: "������Ά�·¬¦‘’Έ―ΉΊΪΌ��ΎΫ©Ώ²³ά£έήίϊΐόύΑΒΓΔΕΖΗ½ΘΙ«»░▒▓│┤ΚΛΜΝ╣║╗╝ΞΟ┐└┴┬├─┼ΠΡ╚╔╩╦╠═╬ΣΤΥΦΧΨΩαβγ┘┌█▄δε▀ζηθικλμνξοπρσςτ΄­±υφχ§ψ΅°¨ωϋΰώ■ "
    },
    ibm869: "cp869",
    csibm869: "cp869",
    cp922: {
      type: "_sbcs",
      chars: " ¡¢£¤¥¦§¨©ª«¬­®‾°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏŠÑÒÓÔÕÖ×ØÙÚÛÜÝŽßàáâãäåæçèéêëìíîïšñòóôõö÷øùúûüýžÿ"
    },
    ibm922: "cp922",
    csibm922: "cp922",
    cp1046: {
      type: "_sbcs",
      chars: "ﺈ×÷ﹱ■│─┐┌└┘ﹹﹻﹽﹿﹷﺊﻰﻳﻲﻎﻏﻐﻶﻸﻺﻼ ¤ﺋﺑﺗﺛﺟﺣ،­ﺧﺳ٠١٢٣٤٥٦٧٨٩ﺷ؛ﺻﺿﻊ؟ﻋءآأؤإئابةتثجحخدذرزسشصضطﻇعغﻌﺂﺄﺎﻓـفقكلمنهوىيًٌٍَُِّْﻗﻛﻟﻵﻷﻹﻻﻣﻧﻬﻩ�"
    },
    ibm1046: "cp1046",
    csibm1046: "cp1046",
    cp1124: {
      type: "_sbcs",
      chars: " ЁЂҐЄЅІЇЈЉЊЋЌ­ЎЏАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя№ёђґєѕіїјљњћќ§ўџ"
    },
    ibm1124: "cp1124",
    csibm1124: "cp1124",
    cp1125: {
      type: "_sbcs",
      chars: "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмноп░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀рстуфхцчшщъыьэюяЁёҐґЄєІіЇї·√№¤■ "
    },
    ibm1125: "cp1125",
    csibm1125: "cp1125",
    cp1129: {
      type: "_sbcs",
      chars: " ¡¢£¤¥¦§œ©ª«¬­®¯°±²³Ÿµ¶·Œ¹º»¼½¾¿ÀÁÂĂÄÅÆÇÈÉÊË̀ÍÎÏĐÑ̉ÓÔƠÖ×ØÙÚÛÜỮßàáâăäåæçèéêë́íîïđṇ̃óôơö÷øùúûüư₫ÿ"
    },
    ibm1129: "cp1129",
    csibm1129: "cp1129",
    cp1133: {
      type: "_sbcs",
      chars: " ກຂຄງຈສຊຍດຕຖທນບປຜຝພຟມຢຣລວຫອຮ���ຯະາຳິີຶືຸູຼັົຽ���ເແໂໃໄ່້໊໋໌ໍໆ�ໜໝ₭����������������໐໑໒໓໔໕໖໗໘໙��¢¬¦�"
    },
    ibm1133: "cp1133",
    csibm1133: "cp1133",
    cp1161: {
      type: "_sbcs",
      chars: "��������������������������������่กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู้๊๋€฿เแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛¢¬¦ "
    },
    ibm1161: "cp1161",
    csibm1161: "cp1161",
    cp1162: {
      type: "_sbcs",
      chars: "€…‘’“”•–— กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู����฿เแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛����"
    },
    ibm1162: "cp1162",
    csibm1162: "cp1162",
    cp1163: {
      type: "_sbcs",
      chars: " ¡¢£€¥¦§œ©ª«¬­®¯°±²³Ÿµ¶·Œ¹º»¼½¾¿ÀÁÂĂÄÅÆÇÈÉÊË̀ÍÎÏĐÑ̉ÓÔƠÖ×ØÙÚÛÜỮßàáâăäåæçèéêë́íîïđṇ̃óôơö÷øùúûüư₫ÿ"
    },
    ibm1163: "cp1163",
    csibm1163: "cp1163",
    maccroatian: {
      type: "_sbcs",
      chars: "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®Š™´¨≠ŽØ∞±≤≥∆µ∂∑∏š∫ªºΩžø¿¡¬√ƒ≈Ć«Č… ÀÃÕŒœĐ—“”‘’÷◊�©⁄¤‹›Æ»–·‚„‰ÂćÁčÈÍÎÏÌÓÔđÒÚÛÙıˆ˜¯πË˚¸Êæˇ"
    },
    maccyrillic: {
      type: "_sbcs",
      chars: "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ†°¢£§•¶І®©™Ђђ≠Ѓѓ∞±≤≥іµ∂ЈЄєЇїЉљЊњјЅ¬√ƒ≈∆«»… ЋћЌќѕ–—“”‘’÷„ЎўЏџ№Ёёяабвгдежзийклмнопрстуфхцчшщъыьэю¤"
    },
    macgreek: {
      type: "_sbcs",
      chars: "Ä¹²É³ÖÜ΅àâä΄¨çéèêë£™îï•½‰ôö¦­ùûü†ΓΔΘΛΞΠß®©ΣΪ§≠°·Α±≤≥¥ΒΕΖΗΙΚΜΦΫΨΩάΝ¬ΟΡ≈Τ«»… ΥΧΆΈœ–―“”‘’÷ΉΊΌΎέήίόΏύαβψδεφγηιξκλμνοπώρστθωςχυζϊϋΐΰ�"
    },
    maciceland: {
      type: "_sbcs",
      chars: "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûüÝ°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄¤ÐðÞþý·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
    },
    macroman: {
      type: "_sbcs",
      chars: "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄¤‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
    },
    macromania: {
      type: "_sbcs",
      chars: "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ĂŞ∞±≤≥¥µ∂∑∏π∫ªºΩăş¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄¤‹›Ţţ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
    },
    macthai: {
      type: "_sbcs",
      chars: "«»…“”�•‘’� กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู\uFEFF​–—฿เแโใไๅๆ็่้๊๋์ํ™๏๐๑๒๓๔๕๖๗๘๙®©����"
    },
    macturkish: {
      type: "_sbcs",
      chars: "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸĞğİıŞş‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙ�ˆ˜¯˘˙˚¸˝˛ˇ"
    },
    macukraine: {
      type: "_sbcs",
      chars: "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ†°Ґ£§•¶І®©™Ђђ≠Ѓѓ∞±≤≥іµґЈЄєЇїЉљЊњјЅ¬√ƒ≈∆«»… ЋћЌќѕ–—“”‘’÷„ЎўЏџ№Ёёяабвгдежзийклмнопрстуфхцчшщъыьэю¤"
    },
    koi8r: {
      type: "_sbcs",
      chars: "─│┌┐└┘├┤┬┴┼▀▄█▌▐░▒▓⌠■∙√≈≤≥ ⌡°²·÷═║╒ё╓╔╕╖╗╘╙╚╛╜╝╞╟╠╡Ё╢╣╤╥╦╧╨╩╪╫╬©юабцдефгхийклмнопярстужвьызшэщчъЮАБЦДЕФГХИЙКЛМНОПЯРСТУЖВЬЫЗШЭЩЧЪ"
    },
    koi8u: {
      type: "_sbcs",
      chars: "─│┌┐└┘├┤┬┴┼▀▄█▌▐░▒▓⌠■∙√≈≤≥ ⌡°²·÷═║╒ёє╔ії╗╘╙╚╛ґ╝╞╟╠╡ЁЄ╣ІЇ╦╧╨╩╪Ґ╬©юабцдефгхийклмнопярстужвьызшэщчъЮАБЦДЕФГХИЙКЛМНОПЯРСТУЖВЬЫЗШЭЩЧЪ"
    },
    koi8ru: {
      type: "_sbcs",
      chars: "─│┌┐└┘├┤┬┴┼▀▄█▌▐░▒▓⌠■∙√≈≤≥ ⌡°²·÷═║╒ёє╔ії╗╘╙╚╛ґў╞╟╠╡ЁЄ╣ІЇ╦╧╨╩╪ҐЎ©юабцдефгхийклмнопярстужвьызшэщчъЮАБЦДЕФГХИЙКЛМНОПЯРСТУЖВЬЫЗШЭЩЧЪ"
    },
    koi8t: {
      type: "_sbcs",
      chars: "қғ‚Ғ„…†‡�‰ҳ‹ҲҷҶ�Қ‘’“”•–—�™�›�����ӯӮё¤ӣ¦§���«¬­®�°±²Ё�Ӣ¶·�№�»���©юабцдефгхийклмнопярстужвьызшэщчъЮАБЦДЕФГХИЙКЛМНОПЯРСТУЖВЬЫЗШЭЩЧЪ"
    },
    armscii8: {
      type: "_sbcs",
      chars: " �և։)(»«—.՝,-֊…՜՛՞ԱաԲբԳգԴդԵեԶզԷէԸըԹթԺժԻիԼլԽխԾծԿկՀհՁձՂղՃճՄմՅյՆնՇշՈոՉչՊպՋջՌռՍսՎվՏտՐրՑցՒւՓփՔքՕօՖֆ՚�"
    },
    rk1048: {
      type: "_sbcs",
      chars: "ЂЃ‚ѓ„…†‡€‰Љ‹ЊҚҺЏђ‘’“”•–—�™љ›њқһџ ҰұӘ¤Ө¦§Ё©Ғ«¬­®Ү°±Ііөµ¶·ё№ғ»әҢңүАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя"
    },
    tcvn: {
      type: "_sbcs",
      chars: `\x00ÚỤ\x03ỪỬỮ\x07\b	
\v\f\r\x0E\x0F\x10ỨỰỲỶỸÝỴ\x18\x19\x1A\x1B\x1C\x1D\x1E\x1F !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~ÀẢÃÁẠẶẬÈẺẼÉẸỆÌỈĨÍỊÒỎÕÓỌỘỜỞỠỚỢÙỦŨ ĂÂÊÔƠƯĐăâêôơưđẶ̀̀̉̃́àảãáạẲằẳẵắẴẮẦẨẪẤỀặầẩẫấậèỂẻẽéẹềểễếệìỉỄẾỒĩíịòỔỏõóọồổỗốộờởỡớợùỖủũúụừửữứựỳỷỹýỵỐ`
    },
    georgianacademy: {
      type: "_sbcs",
      chars: "‚ƒ„…†‡ˆ‰Š‹Œ‘’“”•–—˜™š›œŸ ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿აბგდევზთიკლმნოპჟრსტუფქღყშჩცძწჭხჯჰჱჲჳჴჵჶçèéêëìíîïðñòóôõö÷øùúûüýþÿ"
    },
    georgianps: {
      type: "_sbcs",
      chars: "‚ƒ„…†‡ˆ‰Š‹Œ‘’“”•–—˜™š›œŸ ¡¢£¤¥¦§¨©ª«¬­®¯°±²³´µ¶·¸¹º»¼½¾¿აბგდევზჱთიკლმნჲოპჟრსტჳუფქღყშჩცძწჭხჴჯჰჵæçèéêëìíîïðñòóôõö÷øùúûüýþÿ"
    },
    pt154: {
      type: "_sbcs",
      chars: "ҖҒӮғ„…ҶҮҲүҠӢҢҚҺҸҗ‘’“”•–—ҳҷҡӣңқһҹ ЎўЈӨҘҰ§Ё©Ә«¬ӯ®Ҝ°ұІіҙө¶·ё№ә»јҪҫҝАБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя"
    },
    viscii: {
      type: "_sbcs",
      chars: `\x00\x01Ẳ\x03\x04ẴẪ\x07\b	
\v\f\r\x0E\x0F\x10\x11\x12\x13Ỷ\x15\x16\x17\x18Ỹ\x1A\x1B\x1C\x1DỴ\x1F !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}~ẠẮẰẶẤẦẨẬẼẸẾỀỂỄỆỐỒỔỖỘỢỚỜỞỊỎỌỈỦŨỤỲÕắằặấầẩậẽẹếềểễệốồổỗỠƠộờởịỰỨỪỬơớƯÀÁÂÃẢĂẳẵÈÉÊẺÌÍĨỳĐứÒÓÔạỷừửÙÚỹỵÝỡưàáâãảăữẫèéêẻìíĩỉđựòóôõỏọụùúũủýợỮ`
    },
    iso646cn: {
      type: "_sbcs",
      chars: `\x00\x01\x02\x03\x04\x05\x06\x07\b	
\v\f\r\x0E\x0F\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1A\x1B\x1C\x1D\x1E\x1F !"#¥%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_\`abcdefghijklmnopqrstuvwxyz{|}‾��������������������������������������������������������������������������������������������������������������������������������`
    },
    iso646jp: {
      type: "_sbcs",
      chars: `\x00\x01\x02\x03\x04\x05\x06\x07\b	
\v\f\r\x0E\x0F\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1A\x1B\x1C\x1D\x1E\x1F !"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[¥]^_\`abcdefghijklmnopqrstuvwxyz{|}‾��������������������������������������������������������������������������������������������������������������������������������`
    },
    hproman8: {
      type: "_sbcs",
      chars: " ÀÂÈÊËÎÏ´ˋˆ¨˜ÙÛ₤¯Ýý°ÇçÑñ¡¿¤£¥§ƒ¢âêôûáéóúàèòùäëöüÅîØÆåíøæÄìÖÜÉïßÔÁÃãÐðÍÌÓÒÕõŠšÚŸÿÞþ·µ¶¾—¼½ªº«■»±�"
    },
    macintosh: {
      type: "_sbcs",
      chars: "ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄¤‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔ�ÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ"
    },
    ascii: {
      type: "_sbcs",
      chars: "��������������������������������������������������������������������������������������������������������������������������������"
    },
    tis620: {
      type: "_sbcs",
      chars: "���������������������������������กขฃคฅฆงจฉชซฌญฎฏฐฑฒณดตถทธนบปผฝพฟภมยรฤลฦวศษสหฬอฮฯะัาำิีึืฺุู����฿เแโใไๅๆ็่้๊๋์ํ๎๏๐๑๒๓๔๕๖๗๘๙๚๛����"
    }
  };
});

// node_modules/iconv-lite/encodings/dbcs-codec.js
var require_dbcs_codec = __commonJS((exports) => {
  var Buffer2 = require_safer().Buffer;
  exports._dbcs = DBCSCodec;
  var UNASSIGNED = -1;
  var GB18030_CODE = -2;
  var SEQ_START = -10;
  var NODE_START = -1000;
  var UNASSIGNED_NODE = new Array(256);
  var DEF_CHAR = -1;
  for (i = 0;i < 256; i++)
    UNASSIGNED_NODE[i] = UNASSIGNED;
  var i;
  function DBCSCodec(codecOptions, iconv) {
    this.encodingName = codecOptions.encodingName;
    if (!codecOptions)
      throw new Error("DBCS codec is called without the data.");
    if (!codecOptions.table)
      throw new Error("Encoding '" + this.encodingName + "' has no data.");
    var mappingTable = codecOptions.table();
    this.decodeTables = [];
    this.decodeTables[0] = UNASSIGNED_NODE.slice(0);
    this.decodeTableSeq = [];
    for (var i2 = 0;i2 < mappingTable.length; i2++)
      this._addDecodeChunk(mappingTable[i2]);
    this.defaultCharUnicode = iconv.defaultCharUnicode;
    this.encodeTable = [];
    this.encodeTableSeq = [];
    var skipEncodeChars = {};
    if (codecOptions.encodeSkipVals)
      for (var i2 = 0;i2 < codecOptions.encodeSkipVals.length; i2++) {
        var val = codecOptions.encodeSkipVals[i2];
        if (typeof val === "number")
          skipEncodeChars[val] = true;
        else
          for (var j = val.from;j <= val.to; j++)
            skipEncodeChars[j] = true;
      }
    this._fillEncodeTable(0, 0, skipEncodeChars);
    if (codecOptions.encodeAdd) {
      for (var uChar in codecOptions.encodeAdd)
        if (Object.prototype.hasOwnProperty.call(codecOptions.encodeAdd, uChar))
          this._setEncodeChar(uChar.charCodeAt(0), codecOptions.encodeAdd[uChar]);
    }
    this.defCharSB = this.encodeTable[0][iconv.defaultCharSingleByte.charCodeAt(0)];
    if (this.defCharSB === UNASSIGNED)
      this.defCharSB = this.encodeTable[0]["?"];
    if (this.defCharSB === UNASSIGNED)
      this.defCharSB = 63;
    if (typeof codecOptions.gb18030 === "function") {
      this.gb18030 = codecOptions.gb18030();
      var thirdByteNodeIdx = this.decodeTables.length;
      var thirdByteNode = this.decodeTables[thirdByteNodeIdx] = UNASSIGNED_NODE.slice(0);
      var fourthByteNodeIdx = this.decodeTables.length;
      var fourthByteNode = this.decodeTables[fourthByteNodeIdx] = UNASSIGNED_NODE.slice(0);
      for (var i2 = 129;i2 <= 254; i2++) {
        var secondByteNodeIdx = NODE_START - this.decodeTables[0][i2];
        var secondByteNode = this.decodeTables[secondByteNodeIdx];
        for (var j = 48;j <= 57; j++)
          secondByteNode[j] = NODE_START - thirdByteNodeIdx;
      }
      for (var i2 = 129;i2 <= 254; i2++)
        thirdByteNode[i2] = NODE_START - fourthByteNodeIdx;
      for (var i2 = 48;i2 <= 57; i2++)
        fourthByteNode[i2] = GB18030_CODE;
    }
  }
  DBCSCodec.prototype.encoder = DBCSEncoder;
  DBCSCodec.prototype.decoder = DBCSDecoder;
  DBCSCodec.prototype._getDecodeTrieNode = function(addr) {
    var bytes = [];
    for (;addr > 0; addr >>= 8)
      bytes.push(addr & 255);
    if (bytes.length == 0)
      bytes.push(0);
    var node = this.decodeTables[0];
    for (var i2 = bytes.length - 1;i2 > 0; i2--) {
      var val = node[bytes[i2]];
      if (val == UNASSIGNED) {
        node[bytes[i2]] = NODE_START - this.decodeTables.length;
        this.decodeTables.push(node = UNASSIGNED_NODE.slice(0));
      } else if (val <= NODE_START) {
        node = this.decodeTables[NODE_START - val];
      } else
        throw new Error("Overwrite byte in " + this.encodingName + ", addr: " + addr.toString(16));
    }
    return node;
  };
  DBCSCodec.prototype._addDecodeChunk = function(chunk) {
    var curAddr = parseInt(chunk[0], 16);
    var writeTable = this._getDecodeTrieNode(curAddr);
    curAddr = curAddr & 255;
    for (var k = 1;k < chunk.length; k++) {
      var part = chunk[k];
      if (typeof part === "string") {
        for (var l = 0;l < part.length; ) {
          var code = part.charCodeAt(l++);
          if (55296 <= code && code < 56320) {
            var codeTrail = part.charCodeAt(l++);
            if (56320 <= codeTrail && codeTrail < 57344)
              writeTable[curAddr++] = 65536 + (code - 55296) * 1024 + (codeTrail - 56320);
            else
              throw new Error("Incorrect surrogate pair in " + this.encodingName + " at chunk " + chunk[0]);
          } else if (4080 < code && code <= 4095) {
            var len = 4095 - code + 2;
            var seq = [];
            for (var m = 0;m < len; m++)
              seq.push(part.charCodeAt(l++));
            writeTable[curAddr++] = SEQ_START - this.decodeTableSeq.length;
            this.decodeTableSeq.push(seq);
          } else
            writeTable[curAddr++] = code;
        }
      } else if (typeof part === "number") {
        var charCode = writeTable[curAddr - 1] + 1;
        for (var l = 0;l < part; l++)
          writeTable[curAddr++] = charCode++;
      } else
        throw new Error("Incorrect type '" + typeof part + "' given in " + this.encodingName + " at chunk " + chunk[0]);
    }
    if (curAddr > 255)
      throw new Error("Incorrect chunk in " + this.encodingName + " at addr " + chunk[0] + ": too long" + curAddr);
  };
  DBCSCodec.prototype._getEncodeBucket = function(uCode) {
    var high = uCode >> 8;
    if (this.encodeTable[high] === undefined)
      this.encodeTable[high] = UNASSIGNED_NODE.slice(0);
    return this.encodeTable[high];
  };
  DBCSCodec.prototype._setEncodeChar = function(uCode, dbcsCode) {
    var bucket = this._getEncodeBucket(uCode);
    var low = uCode & 255;
    if (bucket[low] <= SEQ_START)
      this.encodeTableSeq[SEQ_START - bucket[low]][DEF_CHAR] = dbcsCode;
    else if (bucket[low] == UNASSIGNED)
      bucket[low] = dbcsCode;
  };
  DBCSCodec.prototype._setEncodeSequence = function(seq, dbcsCode) {
    var uCode = seq[0];
    var bucket = this._getEncodeBucket(uCode);
    var low = uCode & 255;
    var node;
    if (bucket[low] <= SEQ_START) {
      node = this.encodeTableSeq[SEQ_START - bucket[low]];
    } else {
      node = {};
      if (bucket[low] !== UNASSIGNED)
        node[DEF_CHAR] = bucket[low];
      bucket[low] = SEQ_START - this.encodeTableSeq.length;
      this.encodeTableSeq.push(node);
    }
    for (var j = 1;j < seq.length - 1; j++) {
      var oldVal = node[uCode];
      if (typeof oldVal === "object")
        node = oldVal;
      else {
        node = node[uCode] = {};
        if (oldVal !== undefined)
          node[DEF_CHAR] = oldVal;
      }
    }
    uCode = seq[seq.length - 1];
    node[uCode] = dbcsCode;
  };
  DBCSCodec.prototype._fillEncodeTable = function(nodeIdx, prefix, skipEncodeChars) {
    var node = this.decodeTables[nodeIdx];
    for (var i2 = 0;i2 < 256; i2++) {
      var uCode = node[i2];
      var mbCode = prefix + i2;
      if (skipEncodeChars[mbCode])
        continue;
      if (uCode >= 0)
        this._setEncodeChar(uCode, mbCode);
      else if (uCode <= NODE_START)
        this._fillEncodeTable(NODE_START - uCode, mbCode << 8, skipEncodeChars);
      else if (uCode <= SEQ_START)
        this._setEncodeSequence(this.decodeTableSeq[SEQ_START - uCode], mbCode);
    }
  };
  function DBCSEncoder(options, codec) {
    this.leadSurrogate = -1;
    this.seqObj = undefined;
    this.encodeTable = codec.encodeTable;
    this.encodeTableSeq = codec.encodeTableSeq;
    this.defaultCharSingleByte = codec.defCharSB;
    this.gb18030 = codec.gb18030;
  }
  DBCSEncoder.prototype.write = function(str) {
    var newBuf = Buffer2.alloc(str.length * (this.gb18030 ? 4 : 3)), leadSurrogate = this.leadSurrogate, seqObj = this.seqObj, nextChar = -1, i2 = 0, j = 0;
    while (true) {
      if (nextChar === -1) {
        if (i2 == str.length)
          break;
        var uCode = str.charCodeAt(i2++);
      } else {
        var uCode = nextChar;
        nextChar = -1;
      }
      if (55296 <= uCode && uCode < 57344) {
        if (uCode < 56320) {
          if (leadSurrogate === -1) {
            leadSurrogate = uCode;
            continue;
          } else {
            leadSurrogate = uCode;
            uCode = UNASSIGNED;
          }
        } else {
          if (leadSurrogate !== -1) {
            uCode = 65536 + (leadSurrogate - 55296) * 1024 + (uCode - 56320);
            leadSurrogate = -1;
          } else {
            uCode = UNASSIGNED;
          }
        }
      } else if (leadSurrogate !== -1) {
        nextChar = uCode;
        uCode = UNASSIGNED;
        leadSurrogate = -1;
      }
      var dbcsCode = UNASSIGNED;
      if (seqObj !== undefined && uCode != UNASSIGNED) {
        var resCode = seqObj[uCode];
        if (typeof resCode === "object") {
          seqObj = resCode;
          continue;
        } else if (typeof resCode == "number") {
          dbcsCode = resCode;
        } else if (resCode == undefined) {
          resCode = seqObj[DEF_CHAR];
          if (resCode !== undefined) {
            dbcsCode = resCode;
            nextChar = uCode;
          } else {
          }
        }
        seqObj = undefined;
      } else if (uCode >= 0) {
        var subtable = this.encodeTable[uCode >> 8];
        if (subtable !== undefined)
          dbcsCode = subtable[uCode & 255];
        if (dbcsCode <= SEQ_START) {
          seqObj = this.encodeTableSeq[SEQ_START - dbcsCode];
          continue;
        }
        if (dbcsCode == UNASSIGNED && this.gb18030) {
          var idx = findIdx(this.gb18030.uChars, uCode);
          if (idx != -1) {
            var dbcsCode = this.gb18030.gbChars[idx] + (uCode - this.gb18030.uChars[idx]);
            newBuf[j++] = 129 + Math.floor(dbcsCode / 12600);
            dbcsCode = dbcsCode % 12600;
            newBuf[j++] = 48 + Math.floor(dbcsCode / 1260);
            dbcsCode = dbcsCode % 1260;
            newBuf[j++] = 129 + Math.floor(dbcsCode / 10);
            dbcsCode = dbcsCode % 10;
            newBuf[j++] = 48 + dbcsCode;
            continue;
          }
        }
      }
      if (dbcsCode === UNASSIGNED)
        dbcsCode = this.defaultCharSingleByte;
      if (dbcsCode < 256) {
        newBuf[j++] = dbcsCode;
      } else if (dbcsCode < 65536) {
        newBuf[j++] = dbcsCode >> 8;
        newBuf[j++] = dbcsCode & 255;
      } else {
        newBuf[j++] = dbcsCode >> 16;
        newBuf[j++] = dbcsCode >> 8 & 255;
        newBuf[j++] = dbcsCode & 255;
      }
    }
    this.seqObj = seqObj;
    this.leadSurrogate = leadSurrogate;
    return newBuf.slice(0, j);
  };
  DBCSEncoder.prototype.end = function() {
    if (this.leadSurrogate === -1 && this.seqObj === undefined)
      return;
    var newBuf = Buffer2.alloc(10), j = 0;
    if (this.seqObj) {
      var dbcsCode = this.seqObj[DEF_CHAR];
      if (dbcsCode !== undefined) {
        if (dbcsCode < 256) {
          newBuf[j++] = dbcsCode;
        } else {
          newBuf[j++] = dbcsCode >> 8;
          newBuf[j++] = dbcsCode & 255;
        }
      } else {
      }
      this.seqObj = undefined;
    }
    if (this.leadSurrogate !== -1) {
      newBuf[j++] = this.defaultCharSingleByte;
      this.leadSurrogate = -1;
    }
    return newBuf.slice(0, j);
  };
  DBCSEncoder.prototype.findIdx = findIdx;
  function DBCSDecoder(options, codec) {
    this.nodeIdx = 0;
    this.prevBuf = Buffer2.alloc(0);
    this.decodeTables = codec.decodeTables;
    this.decodeTableSeq = codec.decodeTableSeq;
    this.defaultCharUnicode = codec.defaultCharUnicode;
    this.gb18030 = codec.gb18030;
  }
  DBCSDecoder.prototype.write = function(buf) {
    var newBuf = Buffer2.alloc(buf.length * 2), nodeIdx = this.nodeIdx, prevBuf = this.prevBuf, prevBufOffset = this.prevBuf.length, seqStart = -this.prevBuf.length, uCode;
    if (prevBufOffset > 0)
      prevBuf = Buffer2.concat([prevBuf, buf.slice(0, 10)]);
    for (var i2 = 0, j = 0;i2 < buf.length; i2++) {
      var curByte = i2 >= 0 ? buf[i2] : prevBuf[i2 + prevBufOffset];
      var uCode = this.decodeTables[nodeIdx][curByte];
      if (uCode >= 0) {
      } else if (uCode === UNASSIGNED) {
        i2 = seqStart;
        uCode = this.defaultCharUnicode.charCodeAt(0);
      } else if (uCode === GB18030_CODE) {
        var curSeq = seqStart >= 0 ? buf.slice(seqStart, i2 + 1) : prevBuf.slice(seqStart + prevBufOffset, i2 + 1 + prevBufOffset);
        var ptr = (curSeq[0] - 129) * 12600 + (curSeq[1] - 48) * 1260 + (curSeq[2] - 129) * 10 + (curSeq[3] - 48);
        var idx = findIdx(this.gb18030.gbChars, ptr);
        uCode = this.gb18030.uChars[idx] + ptr - this.gb18030.gbChars[idx];
      } else if (uCode <= NODE_START) {
        nodeIdx = NODE_START - uCode;
        continue;
      } else if (uCode <= SEQ_START) {
        var seq = this.decodeTableSeq[SEQ_START - uCode];
        for (var k = 0;k < seq.length - 1; k++) {
          uCode = seq[k];
          newBuf[j++] = uCode & 255;
          newBuf[j++] = uCode >> 8;
        }
        uCode = seq[seq.length - 1];
      } else
        throw new Error("iconv-lite internal error: invalid decoding table value " + uCode + " at " + nodeIdx + "/" + curByte);
      if (uCode > 65535) {
        uCode -= 65536;
        var uCodeLead = 55296 + Math.floor(uCode / 1024);
        newBuf[j++] = uCodeLead & 255;
        newBuf[j++] = uCodeLead >> 8;
        uCode = 56320 + uCode % 1024;
      }
      newBuf[j++] = uCode & 255;
      newBuf[j++] = uCode >> 8;
      nodeIdx = 0;
      seqStart = i2 + 1;
    }
    this.nodeIdx = nodeIdx;
    this.prevBuf = seqStart >= 0 ? buf.slice(seqStart) : prevBuf.slice(seqStart + prevBufOffset);
    return newBuf.slice(0, j).toString("ucs2");
  };
  DBCSDecoder.prototype.end = function() {
    var ret = "";
    while (this.prevBuf.length > 0) {
      ret += this.defaultCharUnicode;
      var buf = this.prevBuf.slice(1);
      this.prevBuf = Buffer2.alloc(0);
      this.nodeIdx = 0;
      if (buf.length > 0)
        ret += this.write(buf);
    }
    this.nodeIdx = 0;
    return ret;
  };
  function findIdx(table, val) {
    if (table[0] > val)
      return -1;
    var l = 0, r = table.length;
    while (l < r - 1) {
      var mid = l + Math.floor((r - l + 1) / 2);
      if (table[mid] <= val)
        l = mid;
      else
        r = mid;
    }
    return l;
  }
});

// node_modules/iconv-lite/encodings/tables/shiftjis.json
var require_shiftjis = __commonJS((exports, module) => {
  module.exports = [
    ["0", "\x00", 128],
    ["a1", "｡", 62],
    ["8140", "　、。，．・：；？！゛゜´｀¨＾￣＿ヽヾゝゞ〃仝々〆〇ー―‐／＼～∥｜…‥‘’“”（）〔〕［］｛｝〈", 9, "＋－±×"],
    ["8180", "÷＝≠＜＞≦≧∞∴♂♀°′″℃￥＄￠￡％＃＆＊＠§☆★○●◎◇◆□■△▲▽▼※〒→←↑↓〓"],
    ["81b8", "∈∋⊆⊇⊂⊃∪∩"],
    ["81c8", "∧∨￢⇒⇔∀∃"],
    ["81da", "∠⊥⌒∂∇≡≒≪≫√∽∝∵∫∬"],
    ["81f0", "Å‰♯♭♪†‡¶"],
    ["81fc", "◯"],
    ["824f", "０", 9],
    ["8260", "Ａ", 25],
    ["8281", "ａ", 25],
    ["829f", "ぁ", 82],
    ["8340", "ァ", 62],
    ["8380", "ム", 22],
    ["839f", "Α", 16, "Σ", 6],
    ["83bf", "α", 16, "σ", 6],
    ["8440", "А", 5, "ЁЖ", 25],
    ["8470", "а", 5, "ёж", 7],
    ["8480", "о", 17],
    ["849f", "─│┌┐┘└├┬┤┴┼━┃┏┓┛┗┣┳┫┻╋┠┯┨┷┿┝┰┥┸╂"],
    ["8740", "①", 19, "Ⅰ", 9],
    ["875f", "㍉㌔㌢㍍㌘㌧㌃㌶㍑㍗㌍㌦㌣㌫㍊㌻㎜㎝㎞㎎㎏㏄㎡"],
    ["877e", "㍻"],
    ["8780", "〝〟№㏍℡㊤", 4, "㈱㈲㈹㍾㍽㍼≒≡∫∮∑√⊥∠∟⊿∵∩∪"],
    ["889f", "亜唖娃阿哀愛挨姶逢葵茜穐悪握渥旭葦芦鯵梓圧斡扱宛姐虻飴絢綾鮎或粟袷安庵按暗案闇鞍杏以伊位依偉囲夷委威尉惟意慰易椅為畏異移維緯胃萎衣謂違遺医井亥域育郁磯一壱溢逸稲茨芋鰯允印咽員因姻引飲淫胤蔭"],
    ["8940", "院陰隠韻吋右宇烏羽迂雨卯鵜窺丑碓臼渦嘘唄欝蔚鰻姥厩浦瓜閏噂云運雲荏餌叡営嬰影映曳栄永泳洩瑛盈穎頴英衛詠鋭液疫益駅悦謁越閲榎厭円"],
    ["8980", "園堰奄宴延怨掩援沿演炎焔煙燕猿縁艶苑薗遠鉛鴛塩於汚甥凹央奥往応押旺横欧殴王翁襖鴬鴎黄岡沖荻億屋憶臆桶牡乙俺卸恩温穏音下化仮何伽価佳加可嘉夏嫁家寡科暇果架歌河火珂禍禾稼箇花苛茄荷華菓蝦課嘩貨迦過霞蚊俄峨我牙画臥芽蛾賀雅餓駕介会解回塊壊廻快怪悔恢懐戒拐改"],
    ["8a40", "魁晦械海灰界皆絵芥蟹開階貝凱劾外咳害崖慨概涯碍蓋街該鎧骸浬馨蛙垣柿蛎鈎劃嚇各廓拡撹格核殻獲確穫覚角赫較郭閣隔革学岳楽額顎掛笠樫"],
    ["8a80", "橿梶鰍潟割喝恰括活渇滑葛褐轄且鰹叶椛樺鞄株兜竃蒲釜鎌噛鴨栢茅萱粥刈苅瓦乾侃冠寒刊勘勧巻喚堪姦完官寛干幹患感慣憾換敢柑桓棺款歓汗漢澗潅環甘監看竿管簡緩缶翰肝艦莞観諌貫還鑑間閑関陥韓館舘丸含岸巌玩癌眼岩翫贋雁頑顔願企伎危喜器基奇嬉寄岐希幾忌揮机旗既期棋棄"],
    ["8b40", "機帰毅気汽畿祈季稀紀徽規記貴起軌輝飢騎鬼亀偽儀妓宜戯技擬欺犠疑祇義蟻誼議掬菊鞠吉吃喫桔橘詰砧杵黍却客脚虐逆丘久仇休及吸宮弓急救"],
    ["8b80", "朽求汲泣灸球究窮笈級糾給旧牛去居巨拒拠挙渠虚許距鋸漁禦魚亨享京供侠僑兇競共凶協匡卿叫喬境峡強彊怯恐恭挟教橋況狂狭矯胸脅興蕎郷鏡響饗驚仰凝尭暁業局曲極玉桐粁僅勤均巾錦斤欣欽琴禁禽筋緊芹菌衿襟謹近金吟銀九倶句区狗玖矩苦躯駆駈駒具愚虞喰空偶寓遇隅串櫛釧屑屈"],
    ["8c40", "掘窟沓靴轡窪熊隈粂栗繰桑鍬勲君薫訓群軍郡卦袈祁係傾刑兄啓圭珪型契形径恵慶慧憩掲携敬景桂渓畦稽系経継繋罫茎荊蛍計詣警軽頚鶏芸迎鯨"],
    ["8c80", "劇戟撃激隙桁傑欠決潔穴結血訣月件倹倦健兼券剣喧圏堅嫌建憲懸拳捲検権牽犬献研硯絹県肩見謙賢軒遣鍵険顕験鹸元原厳幻弦減源玄現絃舷言諺限乎個古呼固姑孤己庫弧戸故枯湖狐糊袴股胡菰虎誇跨鈷雇顧鼓五互伍午呉吾娯後御悟梧檎瑚碁語誤護醐乞鯉交佼侯候倖光公功効勾厚口向"],
    ["8d40", "后喉坑垢好孔孝宏工巧巷幸広庚康弘恒慌抗拘控攻昂晃更杭校梗構江洪浩港溝甲皇硬稿糠紅紘絞綱耕考肯肱腔膏航荒行衡講貢購郊酵鉱砿鋼閤降"],
    ["8d80", "項香高鴻剛劫号合壕拷濠豪轟麹克刻告国穀酷鵠黒獄漉腰甑忽惚骨狛込此頃今困坤墾婚恨懇昏昆根梱混痕紺艮魂些佐叉唆嵯左差査沙瑳砂詐鎖裟坐座挫債催再最哉塞妻宰彩才採栽歳済災采犀砕砦祭斎細菜裁載際剤在材罪財冴坂阪堺榊肴咲崎埼碕鷺作削咋搾昨朔柵窄策索錯桜鮭笹匙冊刷"],
    ["8e40", "察拶撮擦札殺薩雑皐鯖捌錆鮫皿晒三傘参山惨撒散桟燦珊産算纂蚕讃賛酸餐斬暫残仕仔伺使刺司史嗣四士始姉姿子屍市師志思指支孜斯施旨枝止"],
    ["8e80", "死氏獅祉私糸紙紫肢脂至視詞詩試誌諮資賜雌飼歯事似侍児字寺慈持時次滋治爾璽痔磁示而耳自蒔辞汐鹿式識鴫竺軸宍雫七叱執失嫉室悉湿漆疾質実蔀篠偲柴芝屡蕊縞舎写射捨赦斜煮社紗者謝車遮蛇邪借勺尺杓灼爵酌釈錫若寂弱惹主取守手朱殊狩珠種腫趣酒首儒受呪寿授樹綬需囚収周"],
    ["8f40", "宗就州修愁拾洲秀秋終繍習臭舟蒐衆襲讐蹴輯週酋酬集醜什住充十従戎柔汁渋獣縦重銃叔夙宿淑祝縮粛塾熟出術述俊峻春瞬竣舜駿准循旬楯殉淳"],
    ["8f80", "準潤盾純巡遵醇順処初所暑曙渚庶緒署書薯藷諸助叙女序徐恕鋤除傷償勝匠升召哨商唱嘗奨妾娼宵将小少尚庄床廠彰承抄招掌捷昇昌昭晶松梢樟樵沼消渉湘焼焦照症省硝礁祥称章笑粧紹肖菖蒋蕉衝裳訟証詔詳象賞醤鉦鍾鐘障鞘上丈丞乗冗剰城場壌嬢常情擾条杖浄状畳穣蒸譲醸錠嘱埴飾"],
    ["9040", "拭植殖燭織職色触食蝕辱尻伸信侵唇娠寝審心慎振新晋森榛浸深申疹真神秦紳臣芯薪親診身辛進針震人仁刃塵壬尋甚尽腎訊迅陣靭笥諏須酢図厨"],
    ["9080", "逗吹垂帥推水炊睡粋翠衰遂酔錐錘随瑞髄崇嵩数枢趨雛据杉椙菅頗雀裾澄摺寸世瀬畝是凄制勢姓征性成政整星晴棲栖正清牲生盛精聖声製西誠誓請逝醒青静斉税脆隻席惜戚斥昔析石積籍績脊責赤跡蹟碩切拙接摂折設窃節説雪絶舌蝉仙先千占宣専尖川戦扇撰栓栴泉浅洗染潜煎煽旋穿箭線"],
    ["9140", "繊羨腺舛船薦詮賎践選遷銭銑閃鮮前善漸然全禅繕膳糎噌塑岨措曾曽楚狙疏疎礎祖租粗素組蘇訴阻遡鼠僧創双叢倉喪壮奏爽宋層匝惣想捜掃挿掻"],
    ["9180", "操早曹巣槍槽漕燥争痩相窓糟総綜聡草荘葬蒼藻装走送遭鎗霜騒像増憎臓蔵贈造促側則即息捉束測足速俗属賊族続卒袖其揃存孫尊損村遜他多太汰詑唾堕妥惰打柁舵楕陀駄騨体堆対耐岱帯待怠態戴替泰滞胎腿苔袋貸退逮隊黛鯛代台大第醍題鷹滝瀧卓啄宅托択拓沢濯琢託鐸濁諾茸凧蛸只"],
    ["9240", "叩但達辰奪脱巽竪辿棚谷狸鱈樽誰丹単嘆坦担探旦歎淡湛炭短端箪綻耽胆蛋誕鍛団壇弾断暖檀段男談値知地弛恥智池痴稚置致蜘遅馳築畜竹筑蓄"],
    ["9280", "逐秩窒茶嫡着中仲宙忠抽昼柱注虫衷註酎鋳駐樗瀦猪苧著貯丁兆凋喋寵帖帳庁弔張彫徴懲挑暢朝潮牒町眺聴脹腸蝶調諜超跳銚長頂鳥勅捗直朕沈珍賃鎮陳津墜椎槌追鎚痛通塚栂掴槻佃漬柘辻蔦綴鍔椿潰坪壷嬬紬爪吊釣鶴亭低停偵剃貞呈堤定帝底庭廷弟悌抵挺提梯汀碇禎程締艇訂諦蹄逓"],
    ["9340", "邸鄭釘鼎泥摘擢敵滴的笛適鏑溺哲徹撤轍迭鉄典填天展店添纏甜貼転顛点伝殿澱田電兎吐堵塗妬屠徒斗杜渡登菟賭途都鍍砥砺努度土奴怒倒党冬"],
    ["9380", "凍刀唐塔塘套宕島嶋悼投搭東桃梼棟盗淘湯涛灯燈当痘祷等答筒糖統到董蕩藤討謄豆踏逃透鐙陶頭騰闘働動同堂導憧撞洞瞳童胴萄道銅峠鴇匿得徳涜特督禿篤毒独読栃橡凸突椴届鳶苫寅酉瀞噸屯惇敦沌豚遁頓呑曇鈍奈那内乍凪薙謎灘捺鍋楢馴縄畷南楠軟難汝二尼弐迩匂賑肉虹廿日乳入"],
    ["9440", "如尿韮任妊忍認濡禰祢寧葱猫熱年念捻撚燃粘乃廼之埜嚢悩濃納能脳膿農覗蚤巴把播覇杷波派琶破婆罵芭馬俳廃拝排敗杯盃牌背肺輩配倍培媒梅"],
    ["9480", "楳煤狽買売賠陪這蝿秤矧萩伯剥博拍柏泊白箔粕舶薄迫曝漠爆縛莫駁麦函箱硲箸肇筈櫨幡肌畑畠八鉢溌発醗髪伐罰抜筏閥鳩噺塙蛤隼伴判半反叛帆搬斑板氾汎版犯班畔繁般藩販範釆煩頒飯挽晩番盤磐蕃蛮匪卑否妃庇彼悲扉批披斐比泌疲皮碑秘緋罷肥被誹費避非飛樋簸備尾微枇毘琵眉美"],
    ["9540", "鼻柊稗匹疋髭彦膝菱肘弼必畢筆逼桧姫媛紐百謬俵彪標氷漂瓢票表評豹廟描病秒苗錨鋲蒜蛭鰭品彬斌浜瀕貧賓頻敏瓶不付埠夫婦富冨布府怖扶敷"],
    ["9580", "斧普浮父符腐膚芙譜負賦赴阜附侮撫武舞葡蕪部封楓風葺蕗伏副復幅服福腹複覆淵弗払沸仏物鮒分吻噴墳憤扮焚奮粉糞紛雰文聞丙併兵塀幣平弊柄並蔽閉陛米頁僻壁癖碧別瞥蔑箆偏変片篇編辺返遍便勉娩弁鞭保舗鋪圃捕歩甫補輔穂募墓慕戊暮母簿菩倣俸包呆報奉宝峰峯崩庖抱捧放方朋"],
    ["9640", "法泡烹砲縫胞芳萌蓬蜂褒訪豊邦鋒飽鳳鵬乏亡傍剖坊妨帽忘忙房暴望某棒冒紡肪膨謀貌貿鉾防吠頬北僕卜墨撲朴牧睦穆釦勃没殆堀幌奔本翻凡盆"],
    ["9680", "摩磨魔麻埋妹昧枚毎哩槙幕膜枕鮪柾鱒桝亦俣又抹末沫迄侭繭麿万慢満漫蔓味未魅巳箕岬密蜜湊蓑稔脈妙粍民眠務夢無牟矛霧鵡椋婿娘冥名命明盟迷銘鳴姪牝滅免棉綿緬面麺摸模茂妄孟毛猛盲網耗蒙儲木黙目杢勿餅尤戻籾貰問悶紋門匁也冶夜爺耶野弥矢厄役約薬訳躍靖柳薮鑓愉愈油癒"],
    ["9740", "諭輸唯佑優勇友宥幽悠憂揖有柚湧涌猶猷由祐裕誘遊邑郵雄融夕予余与誉輿預傭幼妖容庸揚揺擁曜楊様洋溶熔用窯羊耀葉蓉要謡踊遥陽養慾抑欲"],
    ["9780", "沃浴翌翼淀羅螺裸来莱頼雷洛絡落酪乱卵嵐欄濫藍蘭覧利吏履李梨理璃痢裏裡里離陸律率立葎掠略劉流溜琉留硫粒隆竜龍侶慮旅虜了亮僚両凌寮料梁涼猟療瞭稜糧良諒遼量陵領力緑倫厘林淋燐琳臨輪隣鱗麟瑠塁涙累類令伶例冷励嶺怜玲礼苓鈴隷零霊麗齢暦歴列劣烈裂廉恋憐漣煉簾練聯"],
    ["9840", "蓮連錬呂魯櫓炉賂路露労婁廊弄朗楼榔浪漏牢狼篭老聾蝋郎六麓禄肋録論倭和話歪賄脇惑枠鷲亙亘鰐詫藁蕨椀湾碗腕"],
    ["989f", "弌丐丕个丱丶丼丿乂乖乘亂亅豫亊舒弍于亞亟亠亢亰亳亶从仍仄仆仂仗仞仭仟价伉佚估佛佝佗佇佶侈侏侘佻佩佰侑佯來侖儘俔俟俎俘俛俑俚俐俤俥倚倨倔倪倥倅伜俶倡倩倬俾俯們倆偃假會偕偐偈做偖偬偸傀傚傅傴傲"],
    ["9940", "僉僊傳僂僖僞僥僭僣僮價僵儉儁儂儖儕儔儚儡儺儷儼儻儿兀兒兌兔兢竸兩兪兮冀冂囘册冉冏冑冓冕冖冤冦冢冩冪冫决冱冲冰况冽凅凉凛几處凩凭"],
    ["9980", "凰凵凾刄刋刔刎刧刪刮刳刹剏剄剋剌剞剔剪剴剩剳剿剽劍劔劒剱劈劑辨辧劬劭劼劵勁勍勗勞勣勦飭勠勳勵勸勹匆匈甸匍匐匏匕匚匣匯匱匳匸區卆卅丗卉卍凖卞卩卮夘卻卷厂厖厠厦厥厮厰厶參簒雙叟曼燮叮叨叭叺吁吽呀听吭吼吮吶吩吝呎咏呵咎呟呱呷呰咒呻咀呶咄咐咆哇咢咸咥咬哄哈咨"],
    ["9a40", "咫哂咤咾咼哘哥哦唏唔哽哮哭哺哢唹啀啣啌售啜啅啖啗唸唳啝喙喀咯喊喟啻啾喘喞單啼喃喩喇喨嗚嗅嗟嗄嗜嗤嗔嘔嗷嘖嗾嗽嘛嗹噎噐營嘴嘶嘲嘸"],
    ["9a80", "噫噤嘯噬噪嚆嚀嚊嚠嚔嚏嚥嚮嚶嚴囂嚼囁囃囀囈囎囑囓囗囮囹圀囿圄圉圈國圍圓團圖嗇圜圦圷圸坎圻址坏坩埀垈坡坿垉垓垠垳垤垪垰埃埆埔埒埓堊埖埣堋堙堝塲堡塢塋塰毀塒堽塹墅墹墟墫墺壞墻墸墮壅壓壑壗壙壘壥壜壤壟壯壺壹壻壼壽夂夊夐夛梦夥夬夭夲夸夾竒奕奐奎奚奘奢奠奧奬奩"],
    ["9b40", "奸妁妝佞侫妣妲姆姨姜妍姙姚娥娟娑娜娉娚婀婬婉娵娶婢婪媚媼媾嫋嫂媽嫣嫗嫦嫩嫖嫺嫻嬌嬋嬖嬲嫐嬪嬶嬾孃孅孀孑孕孚孛孥孩孰孳孵學斈孺宀"],
    ["9b80", "它宦宸寃寇寉寔寐寤實寢寞寥寫寰寶寳尅將專對尓尠尢尨尸尹屁屆屎屓屐屏孱屬屮乢屶屹岌岑岔妛岫岻岶岼岷峅岾峇峙峩峽峺峭嶌峪崋崕崗嵜崟崛崑崔崢崚崙崘嵌嵒嵎嵋嵬嵳嵶嶇嶄嶂嶢嶝嶬嶮嶽嶐嶷嶼巉巍巓巒巖巛巫已巵帋帚帙帑帛帶帷幄幃幀幎幗幔幟幢幤幇幵并幺麼广庠廁廂廈廐廏"],
    ["9c40", "廖廣廝廚廛廢廡廨廩廬廱廳廰廴廸廾弃弉彝彜弋弑弖弩弭弸彁彈彌彎弯彑彖彗彙彡彭彳彷徃徂彿徊很徑徇從徙徘徠徨徭徼忖忻忤忸忱忝悳忿怡恠"],
    ["9c80", "怙怐怩怎怱怛怕怫怦怏怺恚恁恪恷恟恊恆恍恣恃恤恂恬恫恙悁悍惧悃悚悄悛悖悗悒悧悋惡悸惠惓悴忰悽惆悵惘慍愕愆惶惷愀惴惺愃愡惻惱愍愎慇愾愨愧慊愿愼愬愴愽慂慄慳慷慘慙慚慫慴慯慥慱慟慝慓慵憙憖憇憬憔憚憊憑憫憮懌懊應懷懈懃懆憺懋罹懍懦懣懶懺懴懿懽懼懾戀戈戉戍戌戔戛"],
    ["9d40", "戞戡截戮戰戲戳扁扎扞扣扛扠扨扼抂抉找抒抓抖拔抃抔拗拑抻拏拿拆擔拈拜拌拊拂拇抛拉挌拮拱挧挂挈拯拵捐挾捍搜捏掖掎掀掫捶掣掏掉掟掵捫"],
    ["9d80", "捩掾揩揀揆揣揉插揶揄搖搴搆搓搦搶攝搗搨搏摧摯摶摎攪撕撓撥撩撈撼據擒擅擇撻擘擂擱擧舉擠擡抬擣擯攬擶擴擲擺攀擽攘攜攅攤攣攫攴攵攷收攸畋效敖敕敍敘敞敝敲數斂斃變斛斟斫斷旃旆旁旄旌旒旛旙无旡旱杲昊昃旻杳昵昶昴昜晏晄晉晁晞晝晤晧晨晟晢晰暃暈暎暉暄暘暝曁暹曉暾暼"],
    ["9e40", "曄暸曖曚曠昿曦曩曰曵曷朏朖朞朦朧霸朮朿朶杁朸朷杆杞杠杙杣杤枉杰枩杼杪枌枋枦枡枅枷柯枴柬枳柩枸柤柞柝柢柮枹柎柆柧檜栞框栩桀桍栲桎"],
    ["9e80", "梳栫桙档桷桿梟梏梭梔條梛梃檮梹桴梵梠梺椏梍桾椁棊椈棘椢椦棡椌棍棔棧棕椶椒椄棗棣椥棹棠棯椨椪椚椣椡棆楹楷楜楸楫楔楾楮椹楴椽楙椰楡楞楝榁楪榲榮槐榿槁槓榾槎寨槊槝榻槃榧樮榑榠榜榕榴槞槨樂樛槿權槹槲槧樅榱樞槭樔槫樊樒櫁樣樓橄樌橲樶橸橇橢橙橦橈樸樢檐檍檠檄檢檣"],
    ["9f40", "檗蘗檻櫃櫂檸檳檬櫞櫑櫟檪櫚櫪櫻欅蘖櫺欒欖鬱欟欸欷盜欹飮歇歃歉歐歙歔歛歟歡歸歹歿殀殄殃殍殘殕殞殤殪殫殯殲殱殳殷殼毆毋毓毟毬毫毳毯"],
    ["9f80", "麾氈氓气氛氤氣汞汕汢汪沂沍沚沁沛汾汨汳沒沐泄泱泓沽泗泅泝沮沱沾沺泛泯泙泪洟衍洶洫洽洸洙洵洳洒洌浣涓浤浚浹浙涎涕濤涅淹渕渊涵淇淦涸淆淬淞淌淨淒淅淺淙淤淕淪淮渭湮渮渙湲湟渾渣湫渫湶湍渟湃渺湎渤滿渝游溂溪溘滉溷滓溽溯滄溲滔滕溏溥滂溟潁漑灌滬滸滾漿滲漱滯漲滌"],
    ["e040", "漾漓滷澆潺潸澁澀潯潛濳潭澂潼潘澎澑濂潦澳澣澡澤澹濆澪濟濕濬濔濘濱濮濛瀉瀋濺瀑瀁瀏濾瀛瀚潴瀝瀘瀟瀰瀾瀲灑灣炙炒炯烱炬炸炳炮烟烋烝"],
    ["e080", "烙焉烽焜焙煥煕熈煦煢煌煖煬熏燻熄熕熨熬燗熹熾燒燉燔燎燠燬燧燵燼燹燿爍爐爛爨爭爬爰爲爻爼爿牀牆牋牘牴牾犂犁犇犒犖犢犧犹犲狃狆狄狎狒狢狠狡狹狷倏猗猊猜猖猝猴猯猩猥猾獎獏默獗獪獨獰獸獵獻獺珈玳珎玻珀珥珮珞璢琅瑯琥珸琲琺瑕琿瑟瑙瑁瑜瑩瑰瑣瑪瑶瑾璋璞璧瓊瓏瓔珱"],
    ["e140", "瓠瓣瓧瓩瓮瓲瓰瓱瓸瓷甄甃甅甌甎甍甕甓甞甦甬甼畄畍畊畉畛畆畚畩畤畧畫畭畸當疆疇畴疊疉疂疔疚疝疥疣痂疳痃疵疽疸疼疱痍痊痒痙痣痞痾痿"],
    ["e180", "痼瘁痰痺痲痳瘋瘍瘉瘟瘧瘠瘡瘢瘤瘴瘰瘻癇癈癆癜癘癡癢癨癩癪癧癬癰癲癶癸發皀皃皈皋皎皖皓皙皚皰皴皸皹皺盂盍盖盒盞盡盥盧盪蘯盻眈眇眄眩眤眞眥眦眛眷眸睇睚睨睫睛睥睿睾睹瞎瞋瞑瞠瞞瞰瞶瞹瞿瞼瞽瞻矇矍矗矚矜矣矮矼砌砒礦砠礪硅碎硴碆硼碚碌碣碵碪碯磑磆磋磔碾碼磅磊磬"],
    ["e240", "磧磚磽磴礇礒礑礙礬礫祀祠祗祟祚祕祓祺祿禊禝禧齋禪禮禳禹禺秉秕秧秬秡秣稈稍稘稙稠稟禀稱稻稾稷穃穗穉穡穢穩龝穰穹穽窈窗窕窘窖窩竈窰"],
    ["e280", "窶竅竄窿邃竇竊竍竏竕竓站竚竝竡竢竦竭竰笂笏笊笆笳笘笙笞笵笨笶筐筺笄筍笋筌筅筵筥筴筧筰筱筬筮箝箘箟箍箜箚箋箒箏筝箙篋篁篌篏箴篆篝篩簑簔篦篥籠簀簇簓篳篷簗簍篶簣簧簪簟簷簫簽籌籃籔籏籀籐籘籟籤籖籥籬籵粃粐粤粭粢粫粡粨粳粲粱粮粹粽糀糅糂糘糒糜糢鬻糯糲糴糶糺紆"],
    ["e340", "紂紜紕紊絅絋紮紲紿紵絆絳絖絎絲絨絮絏絣經綉絛綏絽綛綺綮綣綵緇綽綫總綢綯緜綸綟綰緘緝緤緞緻緲緡縅縊縣縡縒縱縟縉縋縢繆繦縻縵縹繃縷"],
    ["e380", "縲縺繧繝繖繞繙繚繹繪繩繼繻纃緕繽辮繿纈纉續纒纐纓纔纖纎纛纜缸缺罅罌罍罎罐网罕罔罘罟罠罨罩罧罸羂羆羃羈羇羌羔羞羝羚羣羯羲羹羮羶羸譱翅翆翊翕翔翡翦翩翳翹飜耆耄耋耒耘耙耜耡耨耿耻聊聆聒聘聚聟聢聨聳聲聰聶聹聽聿肄肆肅肛肓肚肭冐肬胛胥胙胝胄胚胖脉胯胱脛脩脣脯腋"],
    ["e440", "隋腆脾腓腑胼腱腮腥腦腴膃膈膊膀膂膠膕膤膣腟膓膩膰膵膾膸膽臀臂膺臉臍臑臙臘臈臚臟臠臧臺臻臾舁舂舅與舊舍舐舖舩舫舸舳艀艙艘艝艚艟艤"],
    ["e480", "艢艨艪艫舮艱艷艸艾芍芒芫芟芻芬苡苣苟苒苴苳苺莓范苻苹苞茆苜茉苙茵茴茖茲茱荀茹荐荅茯茫茗茘莅莚莪莟莢莖茣莎莇莊荼莵荳荵莠莉莨菴萓菫菎菽萃菘萋菁菷萇菠菲萍萢萠莽萸蔆菻葭萪萼蕚蒄葷葫蒭葮蒂葩葆萬葯葹萵蓊葢蒹蒿蒟蓙蓍蒻蓚蓐蓁蓆蓖蒡蔡蓿蓴蔗蔘蔬蔟蔕蔔蓼蕀蕣蕘蕈"],
    ["e540", "蕁蘂蕋蕕薀薤薈薑薊薨蕭薔薛藪薇薜蕷蕾薐藉薺藏薹藐藕藝藥藜藹蘊蘓蘋藾藺蘆蘢蘚蘰蘿虍乕虔號虧虱蚓蚣蚩蚪蚋蚌蚶蚯蛄蛆蚰蛉蠣蚫蛔蛞蛩蛬"],
    ["e580", "蛟蛛蛯蜒蜆蜈蜀蜃蛻蜑蜉蜍蛹蜊蜴蜿蜷蜻蜥蜩蜚蝠蝟蝸蝌蝎蝴蝗蝨蝮蝙蝓蝣蝪蠅螢螟螂螯蟋螽蟀蟐雖螫蟄螳蟇蟆螻蟯蟲蟠蠏蠍蟾蟶蟷蠎蟒蠑蠖蠕蠢蠡蠱蠶蠹蠧蠻衄衂衒衙衞衢衫袁衾袞衵衽袵衲袂袗袒袮袙袢袍袤袰袿袱裃裄裔裘裙裝裹褂裼裴裨裲褄褌褊褓襃褞褥褪褫襁襄褻褶褸襌褝襠襞"],
    ["e640", "襦襤襭襪襯襴襷襾覃覈覊覓覘覡覩覦覬覯覲覺覽覿觀觚觜觝觧觴觸訃訖訐訌訛訝訥訶詁詛詒詆詈詼詭詬詢誅誂誄誨誡誑誥誦誚誣諄諍諂諚諫諳諧"],
    ["e680", "諤諱謔諠諢諷諞諛謌謇謚諡謖謐謗謠謳鞫謦謫謾謨譁譌譏譎證譖譛譚譫譟譬譯譴譽讀讌讎讒讓讖讙讚谺豁谿豈豌豎豐豕豢豬豸豺貂貉貅貊貍貎貔豼貘戝貭貪貽貲貳貮貶賈賁賤賣賚賽賺賻贄贅贊贇贏贍贐齎贓賍贔贖赧赭赱赳趁趙跂趾趺跏跚跖跌跛跋跪跫跟跣跼踈踉跿踝踞踐踟蹂踵踰踴蹊"],
    ["e740", "蹇蹉蹌蹐蹈蹙蹤蹠踪蹣蹕蹶蹲蹼躁躇躅躄躋躊躓躑躔躙躪躡躬躰軆躱躾軅軈軋軛軣軼軻軫軾輊輅輕輒輙輓輜輟輛輌輦輳輻輹轅轂輾轌轉轆轎轗轜"],
    ["e780", "轢轣轤辜辟辣辭辯辷迚迥迢迪迯邇迴逅迹迺逑逕逡逍逞逖逋逧逶逵逹迸遏遐遑遒逎遉逾遖遘遞遨遯遶隨遲邂遽邁邀邊邉邏邨邯邱邵郢郤扈郛鄂鄒鄙鄲鄰酊酖酘酣酥酩酳酲醋醉醂醢醫醯醪醵醴醺釀釁釉釋釐釖釟釡釛釼釵釶鈞釿鈔鈬鈕鈑鉞鉗鉅鉉鉤鉈銕鈿鉋鉐銜銖銓銛鉚鋏銹銷鋩錏鋺鍄錮"],
    ["e840", "錙錢錚錣錺錵錻鍜鍠鍼鍮鍖鎰鎬鎭鎔鎹鏖鏗鏨鏥鏘鏃鏝鏐鏈鏤鐚鐔鐓鐃鐇鐐鐶鐫鐵鐡鐺鑁鑒鑄鑛鑠鑢鑞鑪鈩鑰鑵鑷鑽鑚鑼鑾钁鑿閂閇閊閔閖閘閙"],
    ["e880", "閠閨閧閭閼閻閹閾闊濶闃闍闌闕闔闖關闡闥闢阡阨阮阯陂陌陏陋陷陜陞陝陟陦陲陬隍隘隕隗險隧隱隲隰隴隶隸隹雎雋雉雍襍雜霍雕雹霄霆霈霓霎霑霏霖霙霤霪霰霹霽霾靄靆靈靂靉靜靠靤靦靨勒靫靱靹鞅靼鞁靺鞆鞋鞏鞐鞜鞨鞦鞣鞳鞴韃韆韈韋韜韭齏韲竟韶韵頏頌頸頤頡頷頽顆顏顋顫顯顰"],
    ["e940", "顱顴顳颪颯颱颶飄飃飆飩飫餃餉餒餔餘餡餝餞餤餠餬餮餽餾饂饉饅饐饋饑饒饌饕馗馘馥馭馮馼駟駛駝駘駑駭駮駱駲駻駸騁騏騅駢騙騫騷驅驂驀驃"],
    ["e980", "騾驕驍驛驗驟驢驥驤驩驫驪骭骰骼髀髏髑髓體髞髟髢髣髦髯髫髮髴髱髷髻鬆鬘鬚鬟鬢鬣鬥鬧鬨鬩鬪鬮鬯鬲魄魃魏魍魎魑魘魴鮓鮃鮑鮖鮗鮟鮠鮨鮴鯀鯊鮹鯆鯏鯑鯒鯣鯢鯤鯔鯡鰺鯲鯱鯰鰕鰔鰉鰓鰌鰆鰈鰒鰊鰄鰮鰛鰥鰤鰡鰰鱇鰲鱆鰾鱚鱠鱧鱶鱸鳧鳬鳰鴉鴈鳫鴃鴆鴪鴦鶯鴣鴟鵄鴕鴒鵁鴿鴾鵆鵈"],
    ["ea40", "鵝鵞鵤鵑鵐鵙鵲鶉鶇鶫鵯鵺鶚鶤鶩鶲鷄鷁鶻鶸鶺鷆鷏鷂鷙鷓鷸鷦鷭鷯鷽鸚鸛鸞鹵鹹鹽麁麈麋麌麒麕麑麝麥麩麸麪麭靡黌黎黏黐黔黜點黝黠黥黨黯"],
    ["ea80", "黴黶黷黹黻黼黽鼇鼈皷鼕鼡鼬鼾齊齒齔齣齟齠齡齦齧齬齪齷齲齶龕龜龠堯槇遙瑤凜熙"],
    ["ed40", "纊褜鍈銈蓜俉炻昱棈鋹曻彅丨仡仼伀伃伹佖侒侊侚侔俍偀倢俿倞偆偰偂傔僴僘兊兤冝冾凬刕劜劦勀勛匀匇匤卲厓厲叝﨎咜咊咩哿喆坙坥垬埈埇﨏"],
    ["ed80", "塚增墲夋奓奛奝奣妤妺孖寀甯寘寬尞岦岺峵崧嵓﨑嵂嵭嶸嶹巐弡弴彧德忞恝悅悊惞惕愠惲愑愷愰憘戓抦揵摠撝擎敎昀昕昻昉昮昞昤晥晗晙晴晳暙暠暲暿曺朎朗杦枻桒柀栁桄棏﨓楨﨔榘槢樰橫橆橳橾櫢櫤毖氿汜沆汯泚洄涇浯涖涬淏淸淲淼渹湜渧渼溿澈澵濵瀅瀇瀨炅炫焏焄煜煆煇凞燁燾犱"],
    ["ee40", "犾猤猪獷玽珉珖珣珒琇珵琦琪琩琮瑢璉璟甁畯皂皜皞皛皦益睆劯砡硎硤硺礰礼神祥禔福禛竑竧靖竫箞精絈絜綷綠緖繒罇羡羽茁荢荿菇菶葈蒴蕓蕙"],
    ["ee80", "蕫﨟薰蘒﨡蠇裵訒訷詹誧誾諟諸諶譓譿賰賴贒赶﨣軏﨤逸遧郞都鄕鄧釚釗釞釭釮釤釥鈆鈐鈊鈺鉀鈼鉎鉙鉑鈹鉧銧鉷鉸鋧鋗鋙鋐﨧鋕鋠鋓錥錡鋻﨨錞鋿錝錂鍰鍗鎤鏆鏞鏸鐱鑅鑈閒隆﨩隝隯霳霻靃靍靏靑靕顗顥飯飼餧館馞驎髙髜魵魲鮏鮱鮻鰀鵰鵫鶴鸙黑"],
    ["eeef", "ⅰ", 9, "￢￤＇＂"],
    ["f040", "", 62],
    ["f080", "", 124],
    ["f140", "", 62],
    ["f180", "", 124],
    ["f240", "", 62],
    ["f280", "", 124],
    ["f340", "", 62],
    ["f380", "", 124],
    ["f440", "", 62],
    ["f480", "", 124],
    ["f540", "", 62],
    ["f580", "", 124],
    ["f640", "", 62],
    ["f680", "", 124],
    ["f740", "", 62],
    ["f780", "", 124],
    ["f840", "", 62],
    ["f880", "", 124],
    ["f940", ""],
    ["fa40", "ⅰ", 9, "Ⅰ", 9, "￢￤＇＂㈱№℡∵纊褜鍈銈蓜俉炻昱棈鋹曻彅丨仡仼伀伃伹佖侒侊侚侔俍偀倢俿倞偆偰偂傔僴僘兊"],
    ["fa80", "兤冝冾凬刕劜劦勀勛匀匇匤卲厓厲叝﨎咜咊咩哿喆坙坥垬埈埇﨏塚增墲夋奓奛奝奣妤妺孖寀甯寘寬尞岦岺峵崧嵓﨑嵂嵭嶸嶹巐弡弴彧德忞恝悅悊惞惕愠惲愑愷愰憘戓抦揵摠撝擎敎昀昕昻昉昮昞昤晥晗晙晴晳暙暠暲暿曺朎朗杦枻桒柀栁桄棏﨓楨﨔榘槢樰橫橆橳橾櫢櫤毖氿汜沆汯泚洄涇浯"],
    ["fb40", "涖涬淏淸淲淼渹湜渧渼溿澈澵濵瀅瀇瀨炅炫焏焄煜煆煇凞燁燾犱犾猤猪獷玽珉珖珣珒琇珵琦琪琩琮瑢璉璟甁畯皂皜皞皛皦益睆劯砡硎硤硺礰礼神"],
    ["fb80", "祥禔福禛竑竧靖竫箞精絈絜綷綠緖繒罇羡羽茁荢荿菇菶葈蒴蕓蕙蕫﨟薰蘒﨡蠇裵訒訷詹誧誾諟諸諶譓譿賰賴贒赶﨣軏﨤逸遧郞都鄕鄧釚釗釞釭釮釤釥鈆鈐鈊鈺鉀鈼鉎鉙鉑鈹鉧銧鉷鉸鋧鋗鋙鋐﨧鋕鋠鋓錥錡鋻﨨錞鋿錝錂鍰鍗鎤鏆鏞鏸鐱鑅鑈閒隆﨩隝隯霳霻靃靍靏靑靕顗顥飯飼餧館馞驎髙"],
    ["fc40", "髜魵魲鮏鮱鮻鰀鵰鵫鶴鸙黑"]
  ];
});

// node_modules/iconv-lite/encodings/tables/eucjp.json
var require_eucjp = __commonJS((exports, module) => {
  module.exports = [
    ["0", "\x00", 127],
    ["8ea1", "｡", 62],
    ["a1a1", "　、。，．・：；？！゛゜´｀¨＾￣＿ヽヾゝゞ〃仝々〆〇ー―‐／＼～∥｜…‥‘’“”（）〔〕［］｛｝〈", 9, "＋－±×÷＝≠＜＞≦≧∞∴♂♀°′″℃￥＄￠￡％＃＆＊＠§☆★○●◎◇"],
    ["a2a1", "◆□■△▲▽▼※〒→←↑↓〓"],
    ["a2ba", "∈∋⊆⊇⊂⊃∪∩"],
    ["a2ca", "∧∨￢⇒⇔∀∃"],
    ["a2dc", "∠⊥⌒∂∇≡≒≪≫√∽∝∵∫∬"],
    ["a2f2", "Å‰♯♭♪†‡¶"],
    ["a2fe", "◯"],
    ["a3b0", "０", 9],
    ["a3c1", "Ａ", 25],
    ["a3e1", "ａ", 25],
    ["a4a1", "ぁ", 82],
    ["a5a1", "ァ", 85],
    ["a6a1", "Α", 16, "Σ", 6],
    ["a6c1", "α", 16, "σ", 6],
    ["a7a1", "А", 5, "ЁЖ", 25],
    ["a7d1", "а", 5, "ёж", 25],
    ["a8a1", "─│┌┐┘└├┬┤┴┼━┃┏┓┛┗┣┳┫┻╋┠┯┨┷┿┝┰┥┸╂"],
    ["ada1", "①", 19, "Ⅰ", 9],
    ["adc0", "㍉㌔㌢㍍㌘㌧㌃㌶㍑㍗㌍㌦㌣㌫㍊㌻㎜㎝㎞㎎㎏㏄㎡"],
    ["addf", "㍻〝〟№㏍℡㊤", 4, "㈱㈲㈹㍾㍽㍼≒≡∫∮∑√⊥∠∟⊿∵∩∪"],
    ["b0a1", "亜唖娃阿哀愛挨姶逢葵茜穐悪握渥旭葦芦鯵梓圧斡扱宛姐虻飴絢綾鮎或粟袷安庵按暗案闇鞍杏以伊位依偉囲夷委威尉惟意慰易椅為畏異移維緯胃萎衣謂違遺医井亥域育郁磯一壱溢逸稲茨芋鰯允印咽員因姻引飲淫胤蔭"],
    ["b1a1", "院陰隠韻吋右宇烏羽迂雨卯鵜窺丑碓臼渦嘘唄欝蔚鰻姥厩浦瓜閏噂云運雲荏餌叡営嬰影映曳栄永泳洩瑛盈穎頴英衛詠鋭液疫益駅悦謁越閲榎厭円園堰奄宴延怨掩援沿演炎焔煙燕猿縁艶苑薗遠鉛鴛塩於汚甥凹央奥往応"],
    ["b2a1", "押旺横欧殴王翁襖鴬鴎黄岡沖荻億屋憶臆桶牡乙俺卸恩温穏音下化仮何伽価佳加可嘉夏嫁家寡科暇果架歌河火珂禍禾稼箇花苛茄荷華菓蝦課嘩貨迦過霞蚊俄峨我牙画臥芽蛾賀雅餓駕介会解回塊壊廻快怪悔恢懐戒拐改"],
    ["b3a1", "魁晦械海灰界皆絵芥蟹開階貝凱劾外咳害崖慨概涯碍蓋街該鎧骸浬馨蛙垣柿蛎鈎劃嚇各廓拡撹格核殻獲確穫覚角赫較郭閣隔革学岳楽額顎掛笠樫橿梶鰍潟割喝恰括活渇滑葛褐轄且鰹叶椛樺鞄株兜竃蒲釜鎌噛鴨栢茅萱"],
    ["b4a1", "粥刈苅瓦乾侃冠寒刊勘勧巻喚堪姦完官寛干幹患感慣憾換敢柑桓棺款歓汗漢澗潅環甘監看竿管簡緩缶翰肝艦莞観諌貫還鑑間閑関陥韓館舘丸含岸巌玩癌眼岩翫贋雁頑顔願企伎危喜器基奇嬉寄岐希幾忌揮机旗既期棋棄"],
    ["b5a1", "機帰毅気汽畿祈季稀紀徽規記貴起軌輝飢騎鬼亀偽儀妓宜戯技擬欺犠疑祇義蟻誼議掬菊鞠吉吃喫桔橘詰砧杵黍却客脚虐逆丘久仇休及吸宮弓急救朽求汲泣灸球究窮笈級糾給旧牛去居巨拒拠挙渠虚許距鋸漁禦魚亨享京"],
    ["b6a1", "供侠僑兇競共凶協匡卿叫喬境峡強彊怯恐恭挟教橋況狂狭矯胸脅興蕎郷鏡響饗驚仰凝尭暁業局曲極玉桐粁僅勤均巾錦斤欣欽琴禁禽筋緊芹菌衿襟謹近金吟銀九倶句区狗玖矩苦躯駆駈駒具愚虞喰空偶寓遇隅串櫛釧屑屈"],
    ["b7a1", "掘窟沓靴轡窪熊隈粂栗繰桑鍬勲君薫訓群軍郡卦袈祁係傾刑兄啓圭珪型契形径恵慶慧憩掲携敬景桂渓畦稽系経継繋罫茎荊蛍計詣警軽頚鶏芸迎鯨劇戟撃激隙桁傑欠決潔穴結血訣月件倹倦健兼券剣喧圏堅嫌建憲懸拳捲"],
    ["b8a1", "検権牽犬献研硯絹県肩見謙賢軒遣鍵険顕験鹸元原厳幻弦減源玄現絃舷言諺限乎個古呼固姑孤己庫弧戸故枯湖狐糊袴股胡菰虎誇跨鈷雇顧鼓五互伍午呉吾娯後御悟梧檎瑚碁語誤護醐乞鯉交佼侯候倖光公功効勾厚口向"],
    ["b9a1", "后喉坑垢好孔孝宏工巧巷幸広庚康弘恒慌抗拘控攻昂晃更杭校梗構江洪浩港溝甲皇硬稿糠紅紘絞綱耕考肯肱腔膏航荒行衡講貢購郊酵鉱砿鋼閤降項香高鴻剛劫号合壕拷濠豪轟麹克刻告国穀酷鵠黒獄漉腰甑忽惚骨狛込"],
    ["baa1", "此頃今困坤墾婚恨懇昏昆根梱混痕紺艮魂些佐叉唆嵯左差査沙瑳砂詐鎖裟坐座挫債催再最哉塞妻宰彩才採栽歳済災采犀砕砦祭斎細菜裁載際剤在材罪財冴坂阪堺榊肴咲崎埼碕鷺作削咋搾昨朔柵窄策索錯桜鮭笹匙冊刷"],
    ["bba1", "察拶撮擦札殺薩雑皐鯖捌錆鮫皿晒三傘参山惨撒散桟燦珊産算纂蚕讃賛酸餐斬暫残仕仔伺使刺司史嗣四士始姉姿子屍市師志思指支孜斯施旨枝止死氏獅祉私糸紙紫肢脂至視詞詩試誌諮資賜雌飼歯事似侍児字寺慈持時"],
    ["bca1", "次滋治爾璽痔磁示而耳自蒔辞汐鹿式識鴫竺軸宍雫七叱執失嫉室悉湿漆疾質実蔀篠偲柴芝屡蕊縞舎写射捨赦斜煮社紗者謝車遮蛇邪借勺尺杓灼爵酌釈錫若寂弱惹主取守手朱殊狩珠種腫趣酒首儒受呪寿授樹綬需囚収周"],
    ["bda1", "宗就州修愁拾洲秀秋終繍習臭舟蒐衆襲讐蹴輯週酋酬集醜什住充十従戎柔汁渋獣縦重銃叔夙宿淑祝縮粛塾熟出術述俊峻春瞬竣舜駿准循旬楯殉淳準潤盾純巡遵醇順処初所暑曙渚庶緒署書薯藷諸助叙女序徐恕鋤除傷償"],
    ["bea1", "勝匠升召哨商唱嘗奨妾娼宵将小少尚庄床廠彰承抄招掌捷昇昌昭晶松梢樟樵沼消渉湘焼焦照症省硝礁祥称章笑粧紹肖菖蒋蕉衝裳訟証詔詳象賞醤鉦鍾鐘障鞘上丈丞乗冗剰城場壌嬢常情擾条杖浄状畳穣蒸譲醸錠嘱埴飾"],
    ["bfa1", "拭植殖燭織職色触食蝕辱尻伸信侵唇娠寝審心慎振新晋森榛浸深申疹真神秦紳臣芯薪親診身辛進針震人仁刃塵壬尋甚尽腎訊迅陣靭笥諏須酢図厨逗吹垂帥推水炊睡粋翠衰遂酔錐錘随瑞髄崇嵩数枢趨雛据杉椙菅頗雀裾"],
    ["c0a1", "澄摺寸世瀬畝是凄制勢姓征性成政整星晴棲栖正清牲生盛精聖声製西誠誓請逝醒青静斉税脆隻席惜戚斥昔析石積籍績脊責赤跡蹟碩切拙接摂折設窃節説雪絶舌蝉仙先千占宣専尖川戦扇撰栓栴泉浅洗染潜煎煽旋穿箭線"],
    ["c1a1", "繊羨腺舛船薦詮賎践選遷銭銑閃鮮前善漸然全禅繕膳糎噌塑岨措曾曽楚狙疏疎礎祖租粗素組蘇訴阻遡鼠僧創双叢倉喪壮奏爽宋層匝惣想捜掃挿掻操早曹巣槍槽漕燥争痩相窓糟総綜聡草荘葬蒼藻装走送遭鎗霜騒像増憎"],
    ["c2a1", "臓蔵贈造促側則即息捉束測足速俗属賊族続卒袖其揃存孫尊損村遜他多太汰詑唾堕妥惰打柁舵楕陀駄騨体堆対耐岱帯待怠態戴替泰滞胎腿苔袋貸退逮隊黛鯛代台大第醍題鷹滝瀧卓啄宅托択拓沢濯琢託鐸濁諾茸凧蛸只"],
    ["c3a1", "叩但達辰奪脱巽竪辿棚谷狸鱈樽誰丹単嘆坦担探旦歎淡湛炭短端箪綻耽胆蛋誕鍛団壇弾断暖檀段男談値知地弛恥智池痴稚置致蜘遅馳築畜竹筑蓄逐秩窒茶嫡着中仲宙忠抽昼柱注虫衷註酎鋳駐樗瀦猪苧著貯丁兆凋喋寵"],
    ["c4a1", "帖帳庁弔張彫徴懲挑暢朝潮牒町眺聴脹腸蝶調諜超跳銚長頂鳥勅捗直朕沈珍賃鎮陳津墜椎槌追鎚痛通塚栂掴槻佃漬柘辻蔦綴鍔椿潰坪壷嬬紬爪吊釣鶴亭低停偵剃貞呈堤定帝底庭廷弟悌抵挺提梯汀碇禎程締艇訂諦蹄逓"],
    ["c5a1", "邸鄭釘鼎泥摘擢敵滴的笛適鏑溺哲徹撤轍迭鉄典填天展店添纏甜貼転顛点伝殿澱田電兎吐堵塗妬屠徒斗杜渡登菟賭途都鍍砥砺努度土奴怒倒党冬凍刀唐塔塘套宕島嶋悼投搭東桃梼棟盗淘湯涛灯燈当痘祷等答筒糖統到"],
    ["c6a1", "董蕩藤討謄豆踏逃透鐙陶頭騰闘働動同堂導憧撞洞瞳童胴萄道銅峠鴇匿得徳涜特督禿篤毒独読栃橡凸突椴届鳶苫寅酉瀞噸屯惇敦沌豚遁頓呑曇鈍奈那内乍凪薙謎灘捺鍋楢馴縄畷南楠軟難汝二尼弐迩匂賑肉虹廿日乳入"],
    ["c7a1", "如尿韮任妊忍認濡禰祢寧葱猫熱年念捻撚燃粘乃廼之埜嚢悩濃納能脳膿農覗蚤巴把播覇杷波派琶破婆罵芭馬俳廃拝排敗杯盃牌背肺輩配倍培媒梅楳煤狽買売賠陪這蝿秤矧萩伯剥博拍柏泊白箔粕舶薄迫曝漠爆縛莫駁麦"],
    ["c8a1", "函箱硲箸肇筈櫨幡肌畑畠八鉢溌発醗髪伐罰抜筏閥鳩噺塙蛤隼伴判半反叛帆搬斑板氾汎版犯班畔繁般藩販範釆煩頒飯挽晩番盤磐蕃蛮匪卑否妃庇彼悲扉批披斐比泌疲皮碑秘緋罷肥被誹費避非飛樋簸備尾微枇毘琵眉美"],
    ["c9a1", "鼻柊稗匹疋髭彦膝菱肘弼必畢筆逼桧姫媛紐百謬俵彪標氷漂瓢票表評豹廟描病秒苗錨鋲蒜蛭鰭品彬斌浜瀕貧賓頻敏瓶不付埠夫婦富冨布府怖扶敷斧普浮父符腐膚芙譜負賦赴阜附侮撫武舞葡蕪部封楓風葺蕗伏副復幅服"],
    ["caa1", "福腹複覆淵弗払沸仏物鮒分吻噴墳憤扮焚奮粉糞紛雰文聞丙併兵塀幣平弊柄並蔽閉陛米頁僻壁癖碧別瞥蔑箆偏変片篇編辺返遍便勉娩弁鞭保舗鋪圃捕歩甫補輔穂募墓慕戊暮母簿菩倣俸包呆報奉宝峰峯崩庖抱捧放方朋"],
    ["cba1", "法泡烹砲縫胞芳萌蓬蜂褒訪豊邦鋒飽鳳鵬乏亡傍剖坊妨帽忘忙房暴望某棒冒紡肪膨謀貌貿鉾防吠頬北僕卜墨撲朴牧睦穆釦勃没殆堀幌奔本翻凡盆摩磨魔麻埋妹昧枚毎哩槙幕膜枕鮪柾鱒桝亦俣又抹末沫迄侭繭麿万慢満"],
    ["cca1", "漫蔓味未魅巳箕岬密蜜湊蓑稔脈妙粍民眠務夢無牟矛霧鵡椋婿娘冥名命明盟迷銘鳴姪牝滅免棉綿緬面麺摸模茂妄孟毛猛盲網耗蒙儲木黙目杢勿餅尤戻籾貰問悶紋門匁也冶夜爺耶野弥矢厄役約薬訳躍靖柳薮鑓愉愈油癒"],
    ["cda1", "諭輸唯佑優勇友宥幽悠憂揖有柚湧涌猶猷由祐裕誘遊邑郵雄融夕予余与誉輿預傭幼妖容庸揚揺擁曜楊様洋溶熔用窯羊耀葉蓉要謡踊遥陽養慾抑欲沃浴翌翼淀羅螺裸来莱頼雷洛絡落酪乱卵嵐欄濫藍蘭覧利吏履李梨理璃"],
    ["cea1", "痢裏裡里離陸律率立葎掠略劉流溜琉留硫粒隆竜龍侶慮旅虜了亮僚両凌寮料梁涼猟療瞭稜糧良諒遼量陵領力緑倫厘林淋燐琳臨輪隣鱗麟瑠塁涙累類令伶例冷励嶺怜玲礼苓鈴隷零霊麗齢暦歴列劣烈裂廉恋憐漣煉簾練聯"],
    ["cfa1", "蓮連錬呂魯櫓炉賂路露労婁廊弄朗楼榔浪漏牢狼篭老聾蝋郎六麓禄肋録論倭和話歪賄脇惑枠鷲亙亘鰐詫藁蕨椀湾碗腕"],
    ["d0a1", "弌丐丕个丱丶丼丿乂乖乘亂亅豫亊舒弍于亞亟亠亢亰亳亶从仍仄仆仂仗仞仭仟价伉佚估佛佝佗佇佶侈侏侘佻佩佰侑佯來侖儘俔俟俎俘俛俑俚俐俤俥倚倨倔倪倥倅伜俶倡倩倬俾俯們倆偃假會偕偐偈做偖偬偸傀傚傅傴傲"],
    ["d1a1", "僉僊傳僂僖僞僥僭僣僮價僵儉儁儂儖儕儔儚儡儺儷儼儻儿兀兒兌兔兢竸兩兪兮冀冂囘册冉冏冑冓冕冖冤冦冢冩冪冫决冱冲冰况冽凅凉凛几處凩凭凰凵凾刄刋刔刎刧刪刮刳刹剏剄剋剌剞剔剪剴剩剳剿剽劍劔劒剱劈劑辨"],
    ["d2a1", "辧劬劭劼劵勁勍勗勞勣勦飭勠勳勵勸勹匆匈甸匍匐匏匕匚匣匯匱匳匸區卆卅丗卉卍凖卞卩卮夘卻卷厂厖厠厦厥厮厰厶參簒雙叟曼燮叮叨叭叺吁吽呀听吭吼吮吶吩吝呎咏呵咎呟呱呷呰咒呻咀呶咄咐咆哇咢咸咥咬哄哈咨"],
    ["d3a1", "咫哂咤咾咼哘哥哦唏唔哽哮哭哺哢唹啀啣啌售啜啅啖啗唸唳啝喙喀咯喊喟啻啾喘喞單啼喃喩喇喨嗚嗅嗟嗄嗜嗤嗔嘔嗷嘖嗾嗽嘛嗹噎噐營嘴嘶嘲嘸噫噤嘯噬噪嚆嚀嚊嚠嚔嚏嚥嚮嚶嚴囂嚼囁囃囀囈囎囑囓囗囮囹圀囿圄圉"],
    ["d4a1", "圈國圍圓團圖嗇圜圦圷圸坎圻址坏坩埀垈坡坿垉垓垠垳垤垪垰埃埆埔埒埓堊埖埣堋堙堝塲堡塢塋塰毀塒堽塹墅墹墟墫墺壞墻墸墮壅壓壑壗壙壘壥壜壤壟壯壺壹壻壼壽夂夊夐夛梦夥夬夭夲夸夾竒奕奐奎奚奘奢奠奧奬奩"],
    ["d5a1", "奸妁妝佞侫妣妲姆姨姜妍姙姚娥娟娑娜娉娚婀婬婉娵娶婢婪媚媼媾嫋嫂媽嫣嫗嫦嫩嫖嫺嫻嬌嬋嬖嬲嫐嬪嬶嬾孃孅孀孑孕孚孛孥孩孰孳孵學斈孺宀它宦宸寃寇寉寔寐寤實寢寞寥寫寰寶寳尅將專對尓尠尢尨尸尹屁屆屎屓"],
    ["d6a1", "屐屏孱屬屮乢屶屹岌岑岔妛岫岻岶岼岷峅岾峇峙峩峽峺峭嶌峪崋崕崗嵜崟崛崑崔崢崚崙崘嵌嵒嵎嵋嵬嵳嵶嶇嶄嶂嶢嶝嶬嶮嶽嶐嶷嶼巉巍巓巒巖巛巫已巵帋帚帙帑帛帶帷幄幃幀幎幗幔幟幢幤幇幵并幺麼广庠廁廂廈廐廏"],
    ["d7a1", "廖廣廝廚廛廢廡廨廩廬廱廳廰廴廸廾弃弉彝彜弋弑弖弩弭弸彁彈彌彎弯彑彖彗彙彡彭彳彷徃徂彿徊很徑徇從徙徘徠徨徭徼忖忻忤忸忱忝悳忿怡恠怙怐怩怎怱怛怕怫怦怏怺恚恁恪恷恟恊恆恍恣恃恤恂恬恫恙悁悍惧悃悚"],
    ["d8a1", "悄悛悖悗悒悧悋惡悸惠惓悴忰悽惆悵惘慍愕愆惶惷愀惴惺愃愡惻惱愍愎慇愾愨愧慊愿愼愬愴愽慂慄慳慷慘慙慚慫慴慯慥慱慟慝慓慵憙憖憇憬憔憚憊憑憫憮懌懊應懷懈懃懆憺懋罹懍懦懣懶懺懴懿懽懼懾戀戈戉戍戌戔戛"],
    ["d9a1", "戞戡截戮戰戲戳扁扎扞扣扛扠扨扼抂抉找抒抓抖拔抃抔拗拑抻拏拿拆擔拈拜拌拊拂拇抛拉挌拮拱挧挂挈拯拵捐挾捍搜捏掖掎掀掫捶掣掏掉掟掵捫捩掾揩揀揆揣揉插揶揄搖搴搆搓搦搶攝搗搨搏摧摯摶摎攪撕撓撥撩撈撼"],
    ["daa1", "據擒擅擇撻擘擂擱擧舉擠擡抬擣擯攬擶擴擲擺攀擽攘攜攅攤攣攫攴攵攷收攸畋效敖敕敍敘敞敝敲數斂斃變斛斟斫斷旃旆旁旄旌旒旛旙无旡旱杲昊昃旻杳昵昶昴昜晏晄晉晁晞晝晤晧晨晟晢晰暃暈暎暉暄暘暝曁暹曉暾暼"],
    ["dba1", "曄暸曖曚曠昿曦曩曰曵曷朏朖朞朦朧霸朮朿朶杁朸朷杆杞杠杙杣杤枉杰枩杼杪枌枋枦枡枅枷柯枴柬枳柩枸柤柞柝柢柮枹柎柆柧檜栞框栩桀桍栲桎梳栫桙档桷桿梟梏梭梔條梛梃檮梹桴梵梠梺椏梍桾椁棊椈棘椢椦棡椌棍"],
    ["dca1", "棔棧棕椶椒椄棗棣椥棹棠棯椨椪椚椣椡棆楹楷楜楸楫楔楾楮椹楴椽楙椰楡楞楝榁楪榲榮槐榿槁槓榾槎寨槊槝榻槃榧樮榑榠榜榕榴槞槨樂樛槿權槹槲槧樅榱樞槭樔槫樊樒櫁樣樓橄樌橲樶橸橇橢橙橦橈樸樢檐檍檠檄檢檣"],
    ["dda1", "檗蘗檻櫃櫂檸檳檬櫞櫑櫟檪櫚櫪櫻欅蘖櫺欒欖鬱欟欸欷盜欹飮歇歃歉歐歙歔歛歟歡歸歹歿殀殄殃殍殘殕殞殤殪殫殯殲殱殳殷殼毆毋毓毟毬毫毳毯麾氈氓气氛氤氣汞汕汢汪沂沍沚沁沛汾汨汳沒沐泄泱泓沽泗泅泝沮沱沾"],
    ["dea1", "沺泛泯泙泪洟衍洶洫洽洸洙洵洳洒洌浣涓浤浚浹浙涎涕濤涅淹渕渊涵淇淦涸淆淬淞淌淨淒淅淺淙淤淕淪淮渭湮渮渙湲湟渾渣湫渫湶湍渟湃渺湎渤滿渝游溂溪溘滉溷滓溽溯滄溲滔滕溏溥滂溟潁漑灌滬滸滾漿滲漱滯漲滌"],
    ["dfa1", "漾漓滷澆潺潸澁澀潯潛濳潭澂潼潘澎澑濂潦澳澣澡澤澹濆澪濟濕濬濔濘濱濮濛瀉瀋濺瀑瀁瀏濾瀛瀚潴瀝瀘瀟瀰瀾瀲灑灣炙炒炯烱炬炸炳炮烟烋烝烙焉烽焜焙煥煕熈煦煢煌煖煬熏燻熄熕熨熬燗熹熾燒燉燔燎燠燬燧燵燼"],
    ["e0a1", "燹燿爍爐爛爨爭爬爰爲爻爼爿牀牆牋牘牴牾犂犁犇犒犖犢犧犹犲狃狆狄狎狒狢狠狡狹狷倏猗猊猜猖猝猴猯猩猥猾獎獏默獗獪獨獰獸獵獻獺珈玳珎玻珀珥珮珞璢琅瑯琥珸琲琺瑕琿瑟瑙瑁瑜瑩瑰瑣瑪瑶瑾璋璞璧瓊瓏瓔珱"],
    ["e1a1", "瓠瓣瓧瓩瓮瓲瓰瓱瓸瓷甄甃甅甌甎甍甕甓甞甦甬甼畄畍畊畉畛畆畚畩畤畧畫畭畸當疆疇畴疊疉疂疔疚疝疥疣痂疳痃疵疽疸疼疱痍痊痒痙痣痞痾痿痼瘁痰痺痲痳瘋瘍瘉瘟瘧瘠瘡瘢瘤瘴瘰瘻癇癈癆癜癘癡癢癨癩癪癧癬癰"],
    ["e2a1", "癲癶癸發皀皃皈皋皎皖皓皙皚皰皴皸皹皺盂盍盖盒盞盡盥盧盪蘯盻眈眇眄眩眤眞眥眦眛眷眸睇睚睨睫睛睥睿睾睹瞎瞋瞑瞠瞞瞰瞶瞹瞿瞼瞽瞻矇矍矗矚矜矣矮矼砌砒礦砠礪硅碎硴碆硼碚碌碣碵碪碯磑磆磋磔碾碼磅磊磬"],
    ["e3a1", "磧磚磽磴礇礒礑礙礬礫祀祠祗祟祚祕祓祺祿禊禝禧齋禪禮禳禹禺秉秕秧秬秡秣稈稍稘稙稠稟禀稱稻稾稷穃穗穉穡穢穩龝穰穹穽窈窗窕窘窖窩竈窰窶竅竄窿邃竇竊竍竏竕竓站竚竝竡竢竦竭竰笂笏笊笆笳笘笙笞笵笨笶筐"],
    ["e4a1", "筺笄筍笋筌筅筵筥筴筧筰筱筬筮箝箘箟箍箜箚箋箒箏筝箙篋篁篌篏箴篆篝篩簑簔篦篥籠簀簇簓篳篷簗簍篶簣簧簪簟簷簫簽籌籃籔籏籀籐籘籟籤籖籥籬籵粃粐粤粭粢粫粡粨粳粲粱粮粹粽糀糅糂糘糒糜糢鬻糯糲糴糶糺紆"],
    ["e5a1", "紂紜紕紊絅絋紮紲紿紵絆絳絖絎絲絨絮絏絣經綉絛綏絽綛綺綮綣綵緇綽綫總綢綯緜綸綟綰緘緝緤緞緻緲緡縅縊縣縡縒縱縟縉縋縢繆繦縻縵縹繃縷縲縺繧繝繖繞繙繚繹繪繩繼繻纃緕繽辮繿纈纉續纒纐纓纔纖纎纛纜缸缺"],
    ["e6a1", "罅罌罍罎罐网罕罔罘罟罠罨罩罧罸羂羆羃羈羇羌羔羞羝羚羣羯羲羹羮羶羸譱翅翆翊翕翔翡翦翩翳翹飜耆耄耋耒耘耙耜耡耨耿耻聊聆聒聘聚聟聢聨聳聲聰聶聹聽聿肄肆肅肛肓肚肭冐肬胛胥胙胝胄胚胖脉胯胱脛脩脣脯腋"],
    ["e7a1", "隋腆脾腓腑胼腱腮腥腦腴膃膈膊膀膂膠膕膤膣腟膓膩膰膵膾膸膽臀臂膺臉臍臑臙臘臈臚臟臠臧臺臻臾舁舂舅與舊舍舐舖舩舫舸舳艀艙艘艝艚艟艤艢艨艪艫舮艱艷艸艾芍芒芫芟芻芬苡苣苟苒苴苳苺莓范苻苹苞茆苜茉苙"],
    ["e8a1", "茵茴茖茲茱荀茹荐荅茯茫茗茘莅莚莪莟莢莖茣莎莇莊荼莵荳荵莠莉莨菴萓菫菎菽萃菘萋菁菷萇菠菲萍萢萠莽萸蔆菻葭萪萼蕚蒄葷葫蒭葮蒂葩葆萬葯葹萵蓊葢蒹蒿蒟蓙蓍蒻蓚蓐蓁蓆蓖蒡蔡蓿蓴蔗蔘蔬蔟蔕蔔蓼蕀蕣蕘蕈"],
    ["e9a1", "蕁蘂蕋蕕薀薤薈薑薊薨蕭薔薛藪薇薜蕷蕾薐藉薺藏薹藐藕藝藥藜藹蘊蘓蘋藾藺蘆蘢蘚蘰蘿虍乕虔號虧虱蚓蚣蚩蚪蚋蚌蚶蚯蛄蛆蚰蛉蠣蚫蛔蛞蛩蛬蛟蛛蛯蜒蜆蜈蜀蜃蛻蜑蜉蜍蛹蜊蜴蜿蜷蜻蜥蜩蜚蝠蝟蝸蝌蝎蝴蝗蝨蝮蝙"],
    ["eaa1", "蝓蝣蝪蠅螢螟螂螯蟋螽蟀蟐雖螫蟄螳蟇蟆螻蟯蟲蟠蠏蠍蟾蟶蟷蠎蟒蠑蠖蠕蠢蠡蠱蠶蠹蠧蠻衄衂衒衙衞衢衫袁衾袞衵衽袵衲袂袗袒袮袙袢袍袤袰袿袱裃裄裔裘裙裝裹褂裼裴裨裲褄褌褊褓襃褞褥褪褫襁襄褻褶褸襌褝襠襞"],
    ["eba1", "襦襤襭襪襯襴襷襾覃覈覊覓覘覡覩覦覬覯覲覺覽覿觀觚觜觝觧觴觸訃訖訐訌訛訝訥訶詁詛詒詆詈詼詭詬詢誅誂誄誨誡誑誥誦誚誣諄諍諂諚諫諳諧諤諱謔諠諢諷諞諛謌謇謚諡謖謐謗謠謳鞫謦謫謾謨譁譌譏譎證譖譛譚譫"],
    ["eca1", "譟譬譯譴譽讀讌讎讒讓讖讙讚谺豁谿豈豌豎豐豕豢豬豸豺貂貉貅貊貍貎貔豼貘戝貭貪貽貲貳貮貶賈賁賤賣賚賽賺賻贄贅贊贇贏贍贐齎贓賍贔贖赧赭赱赳趁趙跂趾趺跏跚跖跌跛跋跪跫跟跣跼踈踉跿踝踞踐踟蹂踵踰踴蹊"],
    ["eda1", "蹇蹉蹌蹐蹈蹙蹤蹠踪蹣蹕蹶蹲蹼躁躇躅躄躋躊躓躑躔躙躪躡躬躰軆躱躾軅軈軋軛軣軼軻軫軾輊輅輕輒輙輓輜輟輛輌輦輳輻輹轅轂輾轌轉轆轎轗轜轢轣轤辜辟辣辭辯辷迚迥迢迪迯邇迴逅迹迺逑逕逡逍逞逖逋逧逶逵逹迸"],
    ["eea1", "遏遐遑遒逎遉逾遖遘遞遨遯遶隨遲邂遽邁邀邊邉邏邨邯邱邵郢郤扈郛鄂鄒鄙鄲鄰酊酖酘酣酥酩酳酲醋醉醂醢醫醯醪醵醴醺釀釁釉釋釐釖釟釡釛釼釵釶鈞釿鈔鈬鈕鈑鉞鉗鉅鉉鉤鉈銕鈿鉋鉐銜銖銓銛鉚鋏銹銷鋩錏鋺鍄錮"],
    ["efa1", "錙錢錚錣錺錵錻鍜鍠鍼鍮鍖鎰鎬鎭鎔鎹鏖鏗鏨鏥鏘鏃鏝鏐鏈鏤鐚鐔鐓鐃鐇鐐鐶鐫鐵鐡鐺鑁鑒鑄鑛鑠鑢鑞鑪鈩鑰鑵鑷鑽鑚鑼鑾钁鑿閂閇閊閔閖閘閙閠閨閧閭閼閻閹閾闊濶闃闍闌闕闔闖關闡闥闢阡阨阮阯陂陌陏陋陷陜陞"],
    ["f0a1", "陝陟陦陲陬隍隘隕隗險隧隱隲隰隴隶隸隹雎雋雉雍襍雜霍雕雹霄霆霈霓霎霑霏霖霙霤霪霰霹霽霾靄靆靈靂靉靜靠靤靦靨勒靫靱靹鞅靼鞁靺鞆鞋鞏鞐鞜鞨鞦鞣鞳鞴韃韆韈韋韜韭齏韲竟韶韵頏頌頸頤頡頷頽顆顏顋顫顯顰"],
    ["f1a1", "顱顴顳颪颯颱颶飄飃飆飩飫餃餉餒餔餘餡餝餞餤餠餬餮餽餾饂饉饅饐饋饑饒饌饕馗馘馥馭馮馼駟駛駝駘駑駭駮駱駲駻駸騁騏騅駢騙騫騷驅驂驀驃騾驕驍驛驗驟驢驥驤驩驫驪骭骰骼髀髏髑髓體髞髟髢髣髦髯髫髮髴髱髷"],
    ["f2a1", "髻鬆鬘鬚鬟鬢鬣鬥鬧鬨鬩鬪鬮鬯鬲魄魃魏魍魎魑魘魴鮓鮃鮑鮖鮗鮟鮠鮨鮴鯀鯊鮹鯆鯏鯑鯒鯣鯢鯤鯔鯡鰺鯲鯱鯰鰕鰔鰉鰓鰌鰆鰈鰒鰊鰄鰮鰛鰥鰤鰡鰰鱇鰲鱆鰾鱚鱠鱧鱶鱸鳧鳬鳰鴉鴈鳫鴃鴆鴪鴦鶯鴣鴟鵄鴕鴒鵁鴿鴾鵆鵈"],
    ["f3a1", "鵝鵞鵤鵑鵐鵙鵲鶉鶇鶫鵯鵺鶚鶤鶩鶲鷄鷁鶻鶸鶺鷆鷏鷂鷙鷓鷸鷦鷭鷯鷽鸚鸛鸞鹵鹹鹽麁麈麋麌麒麕麑麝麥麩麸麪麭靡黌黎黏黐黔黜點黝黠黥黨黯黴黶黷黹黻黼黽鼇鼈皷鼕鼡鼬鼾齊齒齔齣齟齠齡齦齧齬齪齷齲齶龕龜龠"],
    ["f4a1", "堯槇遙瑤凜熙"],
    ["f9a1", "纊褜鍈銈蓜俉炻昱棈鋹曻彅丨仡仼伀伃伹佖侒侊侚侔俍偀倢俿倞偆偰偂傔僴僘兊兤冝冾凬刕劜劦勀勛匀匇匤卲厓厲叝﨎咜咊咩哿喆坙坥垬埈埇﨏塚增墲夋奓奛奝奣妤妺孖寀甯寘寬尞岦岺峵崧嵓﨑嵂嵭嶸嶹巐弡弴彧德"],
    ["faa1", "忞恝悅悊惞惕愠惲愑愷愰憘戓抦揵摠撝擎敎昀昕昻昉昮昞昤晥晗晙晴晳暙暠暲暿曺朎朗杦枻桒柀栁桄棏﨓楨﨔榘槢樰橫橆橳橾櫢櫤毖氿汜沆汯泚洄涇浯涖涬淏淸淲淼渹湜渧渼溿澈澵濵瀅瀇瀨炅炫焏焄煜煆煇凞燁燾犱"],
    ["fba1", "犾猤猪獷玽珉珖珣珒琇珵琦琪琩琮瑢璉璟甁畯皂皜皞皛皦益睆劯砡硎硤硺礰礼神祥禔福禛竑竧靖竫箞精絈絜綷綠緖繒罇羡羽茁荢荿菇菶葈蒴蕓蕙蕫﨟薰蘒﨡蠇裵訒訷詹誧誾諟諸諶譓譿賰賴贒赶﨣軏﨤逸遧郞都鄕鄧釚"],
    ["fca1", "釗釞釭釮釤釥鈆鈐鈊鈺鉀鈼鉎鉙鉑鈹鉧銧鉷鉸鋧鋗鋙鋐﨧鋕鋠鋓錥錡鋻﨨錞鋿錝錂鍰鍗鎤鏆鏞鏸鐱鑅鑈閒隆﨩隝隯霳霻靃靍靏靑靕顗顥飯飼餧館馞驎髙髜魵魲鮏鮱鮻鰀鵰鵫鶴鸙黑"],
    ["fcf1", "ⅰ", 9, "￢￤＇＂"],
    ["8fa2af", "˘ˇ¸˙˝¯˛˚～΄΅"],
    ["8fa2c2", "¡¦¿"],
    ["8fa2eb", "ºª©®™¤№"],
    ["8fa6e1", "ΆΈΉΊΪ"],
    ["8fa6e7", "Ό"],
    ["8fa6e9", "ΎΫ"],
    ["8fa6ec", "Ώ"],
    ["8fa6f1", "άέήίϊΐόςύϋΰώ"],
    ["8fa7c2", "Ђ", 10, "ЎЏ"],
    ["8fa7f2", "ђ", 10, "ўџ"],
    ["8fa9a1", "ÆĐ"],
    ["8fa9a4", "Ħ"],
    ["8fa9a6", "Ĳ"],
    ["8fa9a8", "ŁĿ"],
    ["8fa9ab", "ŊØŒ"],
    ["8fa9af", "ŦÞ"],
    ["8fa9c1", "æđðħıĳĸłŀŉŋøœßŧþ"],
    ["8faaa1", "ÁÀÄÂĂǍĀĄÅÃĆĈČÇĊĎÉÈËÊĚĖĒĘ"],
    ["8faaba", "ĜĞĢĠĤÍÌÏÎǏİĪĮĨĴĶĹĽĻŃŇŅÑÓÒÖÔǑŐŌÕŔŘŖŚŜŠŞŤŢÚÙÜÛŬǓŰŪŲŮŨǗǛǙǕŴÝŸŶŹŽŻ"],
    ["8faba1", "áàäâăǎāąåãćĉčçċďéèëêěėēęǵĝğ"],
    ["8fabbd", "ġĥíìïîǐ"],
    ["8fabc5", "īįĩĵķĺľļńňņñóòöôǒőōõŕřŗśŝšşťţúùüûŭǔűūųůũǘǜǚǖŵýÿŷźžż"],
    ["8fb0a1", "丂丄丅丌丒丟丣两丨丫丮丯丰丵乀乁乄乇乑乚乜乣乨乩乴乵乹乿亍亖亗亝亯亹仃仐仚仛仠仡仢仨仯仱仳仵份仾仿伀伂伃伈伋伌伒伕伖众伙伮伱你伳伵伷伹伻伾佀佂佈佉佋佌佒佔佖佘佟佣佪佬佮佱佷佸佹佺佽佾侁侂侄"],
    ["8fb1a1", "侅侉侊侌侎侐侒侓侔侗侙侚侞侟侲侷侹侻侼侽侾俀俁俅俆俈俉俋俌俍俏俒俜俠俢俰俲俼俽俿倀倁倄倇倊倌倎倐倓倗倘倛倜倝倞倢倧倮倰倲倳倵偀偁偂偅偆偊偌偎偑偒偓偗偙偟偠偢偣偦偧偪偭偰偱倻傁傃傄傆傊傎傏傐"],
    ["8fb2a1", "傒傓傔傖傛傜傞", 4, "傪傯傰傹傺傽僀僃僄僇僌僎僐僓僔僘僜僝僟僢僤僦僨僩僯僱僶僺僾儃儆儇儈儋儌儍儎僲儐儗儙儛儜儝儞儣儧儨儬儭儯儱儳儴儵儸儹兂兊兏兓兕兗兘兟兤兦兾冃冄冋冎冘冝冡冣冭冸冺冼冾冿凂"],
    ["8fb3a1", "凈减凑凒凓凕凘凞凢凥凮凲凳凴凷刁刂刅划刓刕刖刘刢刨刱刲刵刼剅剉剕剗剘剚剜剟剠剡剦剮剷剸剹劀劂劅劊劌劓劕劖劗劘劚劜劤劥劦劧劯劰劶劷劸劺劻劽勀勄勆勈勌勏勑勔勖勛勜勡勥勨勩勪勬勰勱勴勶勷匀匃匊匋"],
    ["8fb4a1", "匌匑匓匘匛匜匞匟匥匧匨匩匫匬匭匰匲匵匼匽匾卂卌卋卙卛卡卣卥卬卭卲卹卾厃厇厈厎厓厔厙厝厡厤厪厫厯厲厴厵厷厸厺厽叀叅叏叒叓叕叚叝叞叠另叧叵吂吓吚吡吧吨吪启吱吴吵呃呄呇呍呏呞呢呤呦呧呩呫呭呮呴呿"],
    ["8fb5a1", "咁咃咅咈咉咍咑咕咖咜咟咡咦咧咩咪咭咮咱咷咹咺咻咿哆哊响哎哠哪哬哯哶哼哾哿唀唁唅唈唉唌唍唎唕唪唫唲唵唶唻唼唽啁啇啉啊啍啐啑啘啚啛啞啠啡啤啦啿喁喂喆喈喎喏喑喒喓喔喗喣喤喭喲喿嗁嗃嗆嗉嗋嗌嗎嗑嗒"],
    ["8fb6a1", "嗓嗗嗘嗛嗞嗢嗩嗶嗿嘅嘈嘊嘍", 5, "嘙嘬嘰嘳嘵嘷嘹嘻嘼嘽嘿噀噁噃噄噆噉噋噍噏噔噞噠噡噢噣噦噩噭噯噱噲噵嚄嚅嚈嚋嚌嚕嚙嚚嚝嚞嚟嚦嚧嚨嚩嚫嚬嚭嚱嚳嚷嚾囅囉囊囋囏囐囌囍囙囜囝囟囡囤", 4, "囱囫园"],
    ["8fb7a1", "囶囷圁圂圇圊圌圑圕圚圛圝圠圢圣圤圥圩圪圬圮圯圳圴圽圾圿坅坆坌坍坒坢坥坧坨坫坭", 4, "坳坴坵坷坹坺坻坼坾垁垃垌垔垗垙垚垜垝垞垟垡垕垧垨垩垬垸垽埇埈埌埏埕埝埞埤埦埧埩埭埰埵埶埸埽埾埿堃堄堈堉埡"],
    ["8fb8a1", "堌堍堛堞堟堠堦堧堭堲堹堿塉塌塍塏塐塕塟塡塤塧塨塸塼塿墀墁墇墈墉墊墌墍墏墐墔墖墝墠墡墢墦墩墱墲壄墼壂壈壍壎壐壒壔壖壚壝壡壢壩壳夅夆夋夌夒夓夔虁夝夡夣夤夨夯夰夳夵夶夿奃奆奒奓奙奛奝奞奟奡奣奫奭"],
    ["8fb9a1", "奯奲奵奶她奻奼妋妌妎妒妕妗妟妤妧妭妮妯妰妳妷妺妼姁姃姄姈姊姍姒姝姞姟姣姤姧姮姯姱姲姴姷娀娄娌娍娎娒娓娞娣娤娧娨娪娭娰婄婅婇婈婌婐婕婞婣婥婧婭婷婺婻婾媋媐媓媖媙媜媞媟媠媢媧媬媱媲媳媵媸媺媻媿"],
    ["8fbaa1", "嫄嫆嫈嫏嫚嫜嫠嫥嫪嫮嫵嫶嫽嬀嬁嬈嬗嬴嬙嬛嬝嬡嬥嬭嬸孁孋孌孒孖孞孨孮孯孼孽孾孿宁宄宆宊宎宐宑宓宔宖宨宩宬宭宯宱宲宷宺宼寀寁寍寏寖", 4, "寠寯寱寴寽尌尗尞尟尣尦尩尫尬尮尰尲尵尶屙屚屜屢屣屧屨屩"],
    ["8fbba1", "屭屰屴屵屺屻屼屽岇岈岊岏岒岝岟岠岢岣岦岪岲岴岵岺峉峋峒峝峗峮峱峲峴崁崆崍崒崫崣崤崦崧崱崴崹崽崿嵂嵃嵆嵈嵕嵑嵙嵊嵟嵠嵡嵢嵤嵪嵭嵰嵹嵺嵾嵿嶁嶃嶈嶊嶒嶓嶔嶕嶙嶛嶟嶠嶧嶫嶰嶴嶸嶹巃巇巋巐巎巘巙巠巤"],
    ["8fbca1", "巩巸巹帀帇帍帒帔帕帘帟帠帮帨帲帵帾幋幐幉幑幖幘幛幜幞幨幪", 4, "幰庀庋庎庢庤庥庨庪庬庱庳庽庾庿廆廌廋廎廑廒廔廕廜廞廥廫异弆弇弈弎弙弜弝弡弢弣弤弨弫弬弮弰弴弶弻弽弿彀彄彅彇彍彐彔彘彛彠彣彤彧"],
    ["8fbda1", "彯彲彴彵彸彺彽彾徉徍徏徖徜徝徢徧徫徤徬徯徰徱徸忄忇忈忉忋忐", 4, "忞忡忢忨忩忪忬忭忮忯忲忳忶忺忼怇怊怍怓怔怗怘怚怟怤怭怳怵恀恇恈恉恌恑恔恖恗恝恡恧恱恾恿悂悆悈悊悎悑悓悕悘悝悞悢悤悥您悰悱悷"],
    ["8fbea1", "悻悾惂惄惈惉惊惋惎惏惔惕惙惛惝惞惢惥惲惵惸惼惽愂愇愊愌愐", 4, "愖愗愙愜愞愢愪愫愰愱愵愶愷愹慁慅慆慉慞慠慬慲慸慻慼慿憀憁憃憄憋憍憒憓憗憘憜憝憟憠憥憨憪憭憸憹憼懀懁懂懎懏懕懜懝懞懟懡懢懧懩懥"],
    ["8fbfa1", "懬懭懯戁戃戄戇戓戕戜戠戢戣戧戩戫戹戽扂扃扄扆扌扐扑扒扔扖扚扜扤扭扯扳扺扽抍抎抏抐抦抨抳抶抷抺抾抿拄拎拕拖拚拪拲拴拼拽挃挄挊挋挍挐挓挖挘挩挪挭挵挶挹挼捁捂捃捄捆捊捋捎捒捓捔捘捛捥捦捬捭捱捴捵"],
    ["8fc0a1", "捸捼捽捿掂掄掇掊掐掔掕掙掚掞掤掦掭掮掯掽揁揅揈揎揑揓揔揕揜揠揥揪揬揲揳揵揸揹搉搊搐搒搔搘搞搠搢搤搥搩搪搯搰搵搽搿摋摏摑摒摓摔摚摛摜摝摟摠摡摣摭摳摴摻摽撅撇撏撐撑撘撙撛撝撟撡撣撦撨撬撳撽撾撿"],
    ["8fc1a1", "擄擉擊擋擌擎擐擑擕擗擤擥擩擪擭擰擵擷擻擿攁攄攈攉攊攏攓攔攖攙攛攞攟攢攦攩攮攱攺攼攽敃敇敉敐敒敔敟敠敧敫敺敽斁斅斊斒斕斘斝斠斣斦斮斲斳斴斿旂旈旉旎旐旔旖旘旟旰旲旴旵旹旾旿昀昄昈昉昍昑昒昕昖昝"],
    ["8fc2a1", "昞昡昢昣昤昦昩昪昫昬昮昰昱昳昹昷晀晅晆晊晌晑晎晗晘晙晛晜晠晡曻晪晫晬晾晳晵晿晷晸晹晻暀晼暋暌暍暐暒暙暚暛暜暟暠暤暭暱暲暵暻暿曀曂曃曈曌曎曏曔曛曟曨曫曬曮曺朅朇朎朓朙朜朠朢朳朾杅杇杈杌杔杕杝"],
    ["8fc3a1", "杦杬杮杴杶杻极构枎枏枑枓枖枘枙枛枰枱枲枵枻枼枽柹柀柂柃柅柈柉柒柗柙柜柡柦柰柲柶柷桒栔栙栝栟栨栧栬栭栯栰栱栳栻栿桄桅桊桌桕桗桘桛桫桮", 4, "桵桹桺桻桼梂梄梆梈梖梘梚梜梡梣梥梩梪梮梲梻棅棈棌棏"],
    ["8fc4a1", "棐棑棓棖棙棜棝棥棨棪棫棬棭棰棱棵棶棻棼棽椆椉椊椐椑椓椖椗椱椳椵椸椻楂楅楉楎楗楛楣楤楥楦楨楩楬楰楱楲楺楻楿榀榍榒榖榘榡榥榦榨榫榭榯榷榸榺榼槅槈槑槖槗槢槥槮槯槱槳槵槾樀樁樃樏樑樕樚樝樠樤樨樰樲"],
    ["8fc5a1", "樴樷樻樾樿橅橆橉橊橎橐橑橒橕橖橛橤橧橪橱橳橾檁檃檆檇檉檋檑檛檝檞檟檥檫檯檰檱檴檽檾檿櫆櫉櫈櫌櫐櫔櫕櫖櫜櫝櫤櫧櫬櫰櫱櫲櫼櫽欂欃欆欇欉欏欐欑欗欛欞欤欨欫欬欯欵欶欻欿歆歊歍歒歖歘歝歠歧歫歮歰歵歽"],
    ["8fc6a1", "歾殂殅殗殛殟殠殢殣殨殩殬殭殮殰殸殹殽殾毃毄毉毌毖毚毡毣毦毧毮毱毷毹毿氂氄氅氉氍氎氐氒氙氟氦氧氨氬氮氳氵氶氺氻氿汊汋汍汏汒汔汙汛汜汫汭汯汴汶汸汹汻沅沆沇沉沔沕沗沘沜沟沰沲沴泂泆泍泏泐泑泒泔泖"],
    ["8fc7a1", "泚泜泠泧泩泫泬泮泲泴洄洇洊洎洏洑洓洚洦洧洨汧洮洯洱洹洼洿浗浞浟浡浥浧浯浰浼涂涇涑涒涔涖涗涘涪涬涴涷涹涽涿淄淈淊淎淏淖淛淝淟淠淢淥淩淯淰淴淶淼渀渄渞渢渧渲渶渹渻渼湄湅湈湉湋湏湑湒湓湔湗湜湝湞"],
    ["8fc8a1", "湢湣湨湳湻湽溍溓溙溠溧溭溮溱溳溻溿滀滁滃滇滈滊滍滎滏滫滭滮滹滻滽漄漈漊漌漍漖漘漚漛漦漩漪漯漰漳漶漻漼漭潏潑潒潓潗潙潚潝潞潡潢潨潬潽潾澃澇澈澋澌澍澐澒澓澔澖澚澟澠澥澦澧澨澮澯澰澵澶澼濅濇濈濊"],
    ["8fc9a1", "濚濞濨濩濰濵濹濼濽瀀瀅瀆瀇瀍瀗瀠瀣瀯瀴瀷瀹瀼灃灄灈灉灊灋灔灕灝灞灎灤灥灬灮灵灶灾炁炅炆炔", 4, "炛炤炫炰炱炴炷烊烑烓烔烕烖烘烜烤烺焃", 4, "焋焌焏焞焠焫焭焯焰焱焸煁煅煆煇煊煋煐煒煗煚煜煞煠"],
    ["8fcaa1", "煨煹熀熅熇熌熒熚熛熠熢熯熰熲熳熺熿燀燁燄燋燌燓燖燙燚燜燸燾爀爇爈爉爓爗爚爝爟爤爫爯爴爸爹牁牂牃牅牎牏牐牓牕牖牚牜牞牠牣牨牫牮牯牱牷牸牻牼牿犄犉犍犎犓犛犨犭犮犱犴犾狁狇狉狌狕狖狘狟狥狳狴狺狻"],
    ["8fcba1", "狾猂猄猅猇猋猍猒猓猘猙猞猢猤猧猨猬猱猲猵猺猻猽獃獍獐獒獖獘獝獞獟獠獦獧獩獫獬獮獯獱獷獹獼玀玁玃玅玆玎玐玓玕玗玘玜玞玟玠玢玥玦玪玫玭玵玷玹玼玽玿珅珆珉珋珌珏珒珓珖珙珝珡珣珦珧珩珴珵珷珹珺珻珽"],
    ["8fcca1", "珿琀琁琄琇琊琑琚琛琤琦琨", 9, "琹瑀瑃瑄瑆瑇瑋瑍瑑瑒瑗瑝瑢瑦瑧瑨瑫瑭瑮瑱瑲璀璁璅璆璇璉璏璐璑璒璘璙璚璜璟璠璡璣璦璨璩璪璫璮璯璱璲璵璹璻璿瓈瓉瓌瓐瓓瓘瓚瓛瓞瓟瓤瓨瓪瓫瓯瓴瓺瓻瓼瓿甆"],
    ["8fcda1", "甒甖甗甠甡甤甧甩甪甯甶甹甽甾甿畀畃畇畈畎畐畒畗畞畟畡畯畱畹", 5, "疁疅疐疒疓疕疙疜疢疤疴疺疿痀痁痄痆痌痎痏痗痜痟痠痡痤痧痬痮痯痱痹瘀瘂瘃瘄瘇瘈瘊瘌瘏瘒瘓瘕瘖瘙瘛瘜瘝瘞瘣瘥瘦瘩瘭瘲瘳瘵瘸瘹"],
    ["8fcea1", "瘺瘼癊癀癁癃癄癅癉癋癕癙癟癤癥癭癮癯癱癴皁皅皌皍皕皛皜皝皟皠皢", 6, "皪皭皽盁盅盉盋盌盎盔盙盠盦盨盬盰盱盶盹盼眀眆眊眎眒眔眕眗眙眚眜眢眨眭眮眯眴眵眶眹眽眾睂睅睆睊睍睎睏睒睖睗睜睞睟睠睢"],
    ["8fcfa1", "睤睧睪睬睰睲睳睴睺睽瞀瞄瞌瞍瞔瞕瞖瞚瞟瞢瞧瞪瞮瞯瞱瞵瞾矃矉矑矒矕矙矞矟矠矤矦矪矬矰矱矴矸矻砅砆砉砍砎砑砝砡砢砣砭砮砰砵砷硃硄硇硈硌硎硒硜硞硠硡硣硤硨硪确硺硾碊碏碔碘碡碝碞碟碤碨碬碭碰碱碲碳"],
    ["8fd0a1", "碻碽碿磇磈磉磌磎磒磓磕磖磤磛磟磠磡磦磪磲磳礀磶磷磺磻磿礆礌礐礚礜礞礟礠礥礧礩礭礱礴礵礻礽礿祄祅祆祊祋祏祑祔祘祛祜祧祩祫祲祹祻祼祾禋禌禑禓禔禕禖禘禛禜禡禨禩禫禯禱禴禸离秂秄秇秈秊秏秔秖秚秝秞"],
    ["8fd1a1", "秠秢秥秪秫秭秱秸秼稂稃稇稉稊稌稑稕稛稞稡稧稫稭稯稰稴稵稸稹稺穄穅穇穈穌穕穖穙穜穝穟穠穥穧穪穭穵穸穾窀窂窅窆窊窋窐窑窔窞窠窣窬窳窵窹窻窼竆竉竌竎竑竛竨竩竫竬竱竴竻竽竾笇笔笟笣笧笩笪笫笭笮笯笰"],
    ["8fd2a1", "笱笴笽笿筀筁筇筎筕筠筤筦筩筪筭筯筲筳筷箄箉箎箐箑箖箛箞箠箥箬箯箰箲箵箶箺箻箼箽篂篅篈篊篔篖篗篙篚篛篨篪篲篴篵篸篹篺篼篾簁簂簃簄簆簉簋簌簎簏簙簛簠簥簦簨簬簱簳簴簶簹簺籆籊籕籑籒籓籙", 5],
    ["8fd3a1", "籡籣籧籩籭籮籰籲籹籼籽粆粇粏粔粞粠粦粰粶粷粺粻粼粿糄糇糈糉糍糏糓糔糕糗糙糚糝糦糩糫糵紃紇紈紉紏紑紒紓紖紝紞紣紦紪紭紱紼紽紾絀絁絇絈絍絑絓絗絙絚絜絝絥絧絪絰絸絺絻絿綁綂綃綅綆綈綋綌綍綑綖綗綝"],
    ["8fd4a1", "綞綦綧綪綳綶綷綹緂", 4, "緌緍緎緗緙縀緢緥緦緪緫緭緱緵緶緹緺縈縐縑縕縗縜縝縠縧縨縬縭縯縳縶縿繄繅繇繎繐繒繘繟繡繢繥繫繮繯繳繸繾纁纆纇纊纍纑纕纘纚纝纞缼缻缽缾缿罃罄罇罏罒罓罛罜罝罡罣罤罥罦罭"],
    ["8fd5a1", "罱罽罾罿羀羋羍羏羐羑羖羗羜羡羢羦羪羭羴羼羿翀翃翈翎翏翛翟翣翥翨翬翮翯翲翺翽翾翿耇耈耊耍耎耏耑耓耔耖耝耞耟耠耤耦耬耮耰耴耵耷耹耺耼耾聀聄聠聤聦聭聱聵肁肈肎肜肞肦肧肫肸肹胈胍胏胒胔胕胗胘胠胭胮"],
    ["8fd6a1", "胰胲胳胶胹胺胾脃脋脖脗脘脜脞脠脤脧脬脰脵脺脼腅腇腊腌腒腗腠腡腧腨腩腭腯腷膁膐膄膅膆膋膎膖膘膛膞膢膮膲膴膻臋臃臅臊臎臏臕臗臛臝臞臡臤臫臬臰臱臲臵臶臸臹臽臿舀舃舏舓舔舙舚舝舡舢舨舲舴舺艃艄艅艆"],
    ["8fd7a1", "艋艎艏艑艖艜艠艣艧艭艴艻艽艿芀芁芃芄芇芉芊芎芑芔芖芘芚芛芠芡芣芤芧芨芩芪芮芰芲芴芷芺芼芾芿苆苐苕苚苠苢苤苨苪苭苯苶苷苽苾茀茁茇茈茊茋荔茛茝茞茟茡茢茬茭茮茰茳茷茺茼茽荂荃荄荇荍荎荑荕荖荗荰荸"],
    ["8fd8a1", "荽荿莀莂莄莆莍莒莔莕莘莙莛莜莝莦莧莩莬莾莿菀菇菉菏菐菑菔菝荓菨菪菶菸菹菼萁萆萊萏萑萕萙莭萯萹葅葇葈葊葍葏葑葒葖葘葙葚葜葠葤葥葧葪葰葳葴葶葸葼葽蒁蒅蒒蒓蒕蒞蒦蒨蒩蒪蒯蒱蒴蒺蒽蒾蓀蓂蓇蓈蓌蓏蓓"],
    ["8fd9a1", "蓜蓧蓪蓯蓰蓱蓲蓷蔲蓺蓻蓽蔂蔃蔇蔌蔎蔐蔜蔞蔢蔣蔤蔥蔧蔪蔫蔯蔳蔴蔶蔿蕆蕏", 4, "蕖蕙蕜", 6, "蕤蕫蕯蕹蕺蕻蕽蕿薁薅薆薉薋薌薏薓薘薝薟薠薢薥薧薴薶薷薸薼薽薾薿藂藇藊藋藎薭藘藚藟藠藦藨藭藳藶藼"],
    ["8fdaa1", "藿蘀蘄蘅蘍蘎蘐蘑蘒蘘蘙蘛蘞蘡蘧蘩蘶蘸蘺蘼蘽虀虂虆虒虓虖虗虘虙虝虠", 4, "虩虬虯虵虶虷虺蚍蚑蚖蚘蚚蚜蚡蚦蚧蚨蚭蚱蚳蚴蚵蚷蚸蚹蚿蛀蛁蛃蛅蛑蛒蛕蛗蛚蛜蛠蛣蛥蛧蚈蛺蛼蛽蜄蜅蜇蜋蜎蜏蜐蜓蜔蜙蜞蜟蜡蜣"],
    ["8fdba1", "蜨蜮蜯蜱蜲蜹蜺蜼蜽蜾蝀蝃蝅蝍蝘蝝蝡蝤蝥蝯蝱蝲蝻螃", 6, "螋螌螐螓螕螗螘螙螞螠螣螧螬螭螮螱螵螾螿蟁蟈蟉蟊蟎蟕蟖蟙蟚蟜蟟蟢蟣蟤蟪蟫蟭蟱蟳蟸蟺蟿蠁蠃蠆蠉蠊蠋蠐蠙蠒蠓蠔蠘蠚蠛蠜蠞蠟蠨蠭蠮蠰蠲蠵"],
    ["8fdca1", "蠺蠼衁衃衅衈衉衊衋衎衑衕衖衘衚衜衟衠衤衩衱衹衻袀袘袚袛袜袟袠袨袪袺袽袾裀裊", 4, "裑裒裓裛裞裧裯裰裱裵裷褁褆褍褎褏褕褖褘褙褚褜褠褦褧褨褰褱褲褵褹褺褾襀襂襅襆襉襏襒襗襚襛襜襡襢襣襫襮襰襳襵襺"],
    ["8fdda1", "襻襼襽覉覍覐覔覕覛覜覟覠覥覰覴覵覶覷覼觔", 4, "觥觩觫觭觱觳觶觹觽觿訄訅訇訏訑訒訔訕訞訠訢訤訦訫訬訯訵訷訽訾詀詃詅詇詉詍詎詓詖詗詘詜詝詡詥詧詵詶詷詹詺詻詾詿誀誃誆誋誏誐誒誖誗誙誟誧誩誮誯誳"],
    ["8fdea1", "誶誷誻誾諃諆諈諉諊諑諓諔諕諗諝諟諬諰諴諵諶諼諿謅謆謋謑謜謞謟謊謭謰謷謼譂", 4, "譈譒譓譔譙譍譞譣譭譶譸譹譼譾讁讄讅讋讍讏讔讕讜讞讟谸谹谽谾豅豇豉豋豏豑豓豔豗豘豛豝豙豣豤豦豨豩豭豳豵豶豻豾貆"],
    ["8fdfa1", "貇貋貐貒貓貙貛貜貤貹貺賅賆賉賋賏賖賕賙賝賡賨賬賯賰賲賵賷賸賾賿贁贃贉贒贗贛赥赩赬赮赿趂趄趈趍趐趑趕趞趟趠趦趫趬趯趲趵趷趹趻跀跅跆跇跈跊跎跑跔跕跗跙跤跥跧跬跰趼跱跲跴跽踁踄踅踆踋踑踔踖踠踡踢"],
    ["8fe0a1", "踣踦踧踱踳踶踷踸踹踽蹀蹁蹋蹍蹎蹏蹔蹛蹜蹝蹞蹡蹢蹩蹬蹭蹯蹰蹱蹹蹺蹻躂躃躉躐躒躕躚躛躝躞躢躧躩躭躮躳躵躺躻軀軁軃軄軇軏軑軔軜軨軮軰軱軷軹軺軭輀輂輇輈輏輐輖輗輘輞輠輡輣輥輧輨輬輭輮輴輵輶輷輺轀轁"],
    ["8fe1a1", "轃轇轏轑", 4, "轘轝轞轥辝辠辡辤辥辦辵辶辸达迀迁迆迊迋迍运迒迓迕迠迣迤迨迮迱迵迶迻迾适逄逈逌逘逛逨逩逯逪逬逭逳逴逷逿遃遄遌遛遝遢遦遧遬遰遴遹邅邈邋邌邎邐邕邗邘邙邛邠邡邢邥邰邲邳邴邶邽郌邾郃"],
    ["8fe2a1", "郄郅郇郈郕郗郘郙郜郝郟郥郒郶郫郯郰郴郾郿鄀鄄鄅鄆鄈鄍鄐鄔鄖鄗鄘鄚鄜鄞鄠鄥鄢鄣鄧鄩鄮鄯鄱鄴鄶鄷鄹鄺鄼鄽酃酇酈酏酓酗酙酚酛酡酤酧酭酴酹酺酻醁醃醅醆醊醎醑醓醔醕醘醞醡醦醨醬醭醮醰醱醲醳醶醻醼醽醿"],
    ["8fe3a1", "釂釃釅釓釔釗釙釚釞釤釥釩釪釬", 5, "釷釹釻釽鈀鈁鈄鈅鈆鈇鈉鈊鈌鈐鈒鈓鈖鈘鈜鈝鈣鈤鈥鈦鈨鈮鈯鈰鈳鈵鈶鈸鈹鈺鈼鈾鉀鉂鉃鉆鉇鉊鉍鉎鉏鉑鉘鉙鉜鉝鉠鉡鉥鉧鉨鉩鉮鉯鉰鉵", 4, "鉻鉼鉽鉿銈銉銊銍銎銒銗"],
    ["8fe4a1", "銙銟銠銤銥銧銨銫銯銲銶銸銺銻銼銽銿", 4, "鋅鋆鋇鋈鋋鋌鋍鋎鋐鋓鋕鋗鋘鋙鋜鋝鋟鋠鋡鋣鋥鋧鋨鋬鋮鋰鋹鋻鋿錀錂錈錍錑錔錕錜錝錞錟錡錤錥錧錩錪錳錴錶錷鍇鍈鍉鍐鍑鍒鍕鍗鍘鍚鍞鍤鍥鍧鍩鍪鍭鍯鍰鍱鍳鍴鍶"],
    ["8fe5a1", "鍺鍽鍿鎀鎁鎂鎈鎊鎋鎍鎏鎒鎕鎘鎛鎞鎡鎣鎤鎦鎨鎫鎴鎵鎶鎺鎩鏁鏄鏅鏆鏇鏉", 4, "鏓鏙鏜鏞鏟鏢鏦鏧鏹鏷鏸鏺鏻鏽鐁鐂鐄鐈鐉鐍鐎鐏鐕鐖鐗鐟鐮鐯鐱鐲鐳鐴鐻鐿鐽鑃鑅鑈鑊鑌鑕鑙鑜鑟鑡鑣鑨鑫鑭鑮鑯鑱鑲钄钃镸镹"],
    ["8fe6a1", "镾閄閈閌閍閎閝閞閟閡閦閩閫閬閴閶閺閽閿闆闈闉闋闐闑闒闓闙闚闝闞闟闠闤闦阝阞阢阤阥阦阬阱阳阷阸阹阺阼阽陁陒陔陖陗陘陡陮陴陻陼陾陿隁隂隃隄隉隑隖隚隝隟隤隥隦隩隮隯隳隺雊雒嶲雘雚雝雞雟雩雯雱雺霂"],
    ["8fe7a1", "霃霅霉霚霛霝霡霢霣霨霱霳靁靃靊靎靏靕靗靘靚靛靣靧靪靮靳靶靷靸靻靽靿鞀鞉鞕鞖鞗鞙鞚鞞鞟鞢鞬鞮鞱鞲鞵鞶鞸鞹鞺鞼鞾鞿韁韄韅韇韉韊韌韍韎韐韑韔韗韘韙韝韞韠韛韡韤韯韱韴韷韸韺頇頊頙頍頎頔頖頜頞頠頣頦"],
    ["8fe8a1", "頫頮頯頰頲頳頵頥頾顄顇顊顑顒顓顖顗顙顚顢顣顥顦顪顬颫颭颮颰颴颷颸颺颻颿飂飅飈飌飡飣飥飦飧飪飳飶餂餇餈餑餕餖餗餚餛餜餟餢餦餧餫餱", 4, "餹餺餻餼饀饁饆饇饈饍饎饔饘饙饛饜饞饟饠馛馝馟馦馰馱馲馵"],
    ["8fe9a1", "馹馺馽馿駃駉駓駔駙駚駜駞駧駪駫駬駰駴駵駹駽駾騂騃騄騋騌騐騑騖騞騠騢騣騤騧騭騮騳騵騶騸驇驁驄驊驋驌驎驑驔驖驝骪骬骮骯骲骴骵骶骹骻骾骿髁髃髆髈髎髐髒髕髖髗髛髜髠髤髥髧髩髬髲髳髵髹髺髽髿", 4],
    ["8feaa1", "鬄鬅鬈鬉鬋鬌鬍鬎鬐鬒鬖鬙鬛鬜鬠鬦鬫鬭鬳鬴鬵鬷鬹鬺鬽魈魋魌魕魖魗魛魞魡魣魥魦魨魪", 4, "魳魵魷魸魹魿鮀鮄鮅鮆鮇鮉鮊鮋鮍鮏鮐鮔鮚鮝鮞鮦鮧鮩鮬鮰鮱鮲鮷鮸鮻鮼鮾鮿鯁鯇鯈鯎鯐鯗鯘鯝鯟鯥鯧鯪鯫鯯鯳鯷鯸"],
    ["8feba1", "鯹鯺鯽鯿鰀鰂鰋鰏鰑鰖鰘鰙鰚鰜鰞鰢鰣鰦", 4, "鰱鰵鰶鰷鰽鱁鱃鱄鱅鱉鱊鱎鱏鱐鱓鱔鱖鱘鱛鱝鱞鱟鱣鱩鱪鱜鱫鱨鱮鱰鱲鱵鱷鱻鳦鳲鳷鳹鴋鴂鴑鴗鴘鴜鴝鴞鴯鴰鴲鴳鴴鴺鴼鵅鴽鵂鵃鵇鵊鵓鵔鵟鵣鵢鵥鵩鵪鵫鵰鵶鵷鵻"],
    ["8feca1", "鵼鵾鶃鶄鶆鶊鶍鶎鶒鶓鶕鶖鶗鶘鶡鶪鶬鶮鶱鶵鶹鶼鶿鷃鷇鷉鷊鷔鷕鷖鷗鷚鷞鷟鷠鷥鷧鷩鷫鷮鷰鷳鷴鷾鸊鸂鸇鸎鸐鸑鸒鸕鸖鸙鸜鸝鹺鹻鹼麀麂麃麄麅麇麎麏麖麘麛麞麤麨麬麮麯麰麳麴麵黆黈黋黕黟黤黧黬黭黮黰黱黲黵"],
    ["8feda1", "黸黿鼂鼃鼉鼏鼐鼑鼒鼔鼖鼗鼙鼚鼛鼟鼢鼦鼪鼫鼯鼱鼲鼴鼷鼹鼺鼼鼽鼿齁齃", 4, "齓齕齖齗齘齚齝齞齨齩齭", 4, "齳齵齺齽龏龐龑龒龔龖龗龞龡龢龣龥"]
  ];
});

// node_modules/iconv-lite/encodings/tables/cp936.json
var require_cp936 = __commonJS((exports, module) => {
  module.exports = [
    ["0", "\x00", 127, "€"],
    ["8140", "丂丄丅丆丏丒丗丟丠両丣並丩丮丯丱丳丵丷丼乀乁乂乄乆乊乑乕乗乚乛乢乣乤乥乧乨乪", 5, "乲乴", 9, "乿", 6, "亇亊"],
    ["8180", "亐亖亗亙亜亝亞亣亪亯亰亱亴亶亷亸亹亼亽亾仈仌仏仐仒仚仛仜仠仢仦仧仩仭仮仯仱仴仸仹仺仼仾伀伂", 6, "伋伌伒", 4, "伜伝伡伣伨伩伬伭伮伱伳伵伷伹伻伾", 4, "佄佅佇", 5, "佒佔佖佡佢佦佨佪佫佭佮佱佲併佷佸佹佺佽侀侁侂侅來侇侊侌侎侐侒侓侕侖侘侙侚侜侞侟価侢"],
    ["8240", "侤侫侭侰", 4, "侶", 8, "俀俁係俆俇俈俉俋俌俍俒", 4, "俙俛俠俢俤俥俧俫俬俰俲俴俵俶俷俹俻俼俽俿", 11],
    ["8280", "個倎倐們倓倕倖倗倛倝倞倠倢倣値倧倫倯", 10, "倻倽倿偀偁偂偄偅偆偉偊偋偍偐", 4, "偖偗偘偙偛偝", 7, "偦", 5, "偭", 8, "偸偹偺偼偽傁傂傃傄傆傇傉傊傋傌傎", 20, "傤傦傪傫傭", 4, "傳", 6, "傼"],
    ["8340", "傽", 17, "僐", 5, "僗僘僙僛", 10, "僨僩僪僫僯僰僱僲僴僶", 4, "僼", 9, "儈"],
    ["8380", "儉儊儌", 5, "儓", 13, "儢", 28, "兂兇兊兌兎兏児兒兓兗兘兙兛兝", 4, "兣兤兦內兩兪兯兲兺兾兿冃冄円冇冊冋冎冏冐冑冓冔冘冚冝冞冟冡冣冦", 4, "冭冮冴冸冹冺冾冿凁凂凃凅凈凊凍凎凐凒", 5],
    ["8440", "凘凙凚凜凞凟凢凣凥", 5, "凬凮凱凲凴凷凾刄刅刉刋刌刏刐刓刔刕刜刞刟刡刢刣別刦刧刪刬刯刱刲刴刵刼刾剄", 5, "剋剎剏剒剓剕剗剘"],
    ["8480", "剙剚剛剝剟剠剢剣剤剦剨剫剬剭剮剰剱剳", 9, "剾劀劃", 4, "劉", 6, "劑劒劔", 6, "劜劤劥劦劧劮劯劰労", 9, "勀勁勂勄勅勆勈勊勌勍勎勏勑勓勔動勗務", 5, "勠勡勢勣勥", 10, "勱", 7, "勻勼勽匁匂匃匄匇匉匊匋匌匎"],
    ["8540", "匑匒匓匔匘匛匜匞匟匢匤匥匧匨匩匫匬匭匯", 9, "匼匽區卂卄卆卋卌卍卐協単卙卛卝卥卨卪卬卭卲卶卹卻卼卽卾厀厁厃厇厈厊厎厏"],
    ["8580", "厐", 4, "厖厗厙厛厜厞厠厡厤厧厪厫厬厭厯", 6, "厷厸厹厺厼厽厾叀參", 4, "収叏叐叒叓叕叚叜叝叞叡叢叧叴叺叾叿吀吂吅吇吋吔吘吙吚吜吢吤吥吪吰吳吶吷吺吽吿呁呂呄呅呇呉呌呍呎呏呑呚呝", 4, "呣呥呧呩", 7, "呴呹呺呾呿咁咃咅咇咈咉咊咍咑咓咗咘咜咞咟咠咡"],
    ["8640", "咢咥咮咰咲咵咶咷咹咺咼咾哃哅哊哋哖哘哛哠", 4, "哫哬哯哰哱哴", 5, "哻哾唀唂唃唄唅唈唊", 4, "唒唓唕", 5, "唜唝唞唟唡唥唦"],
    ["8680", "唨唩唫唭唲唴唵唶唸唹唺唻唽啀啂啅啇啈啋", 4, "啑啒啓啔啗", 4, "啝啞啟啠啢啣啨啩啫啯", 5, "啹啺啽啿喅喆喌喍喎喐喒喓喕喖喗喚喛喞喠", 6, "喨", 8, "喲喴営喸喺喼喿", 4, "嗆嗇嗈嗊嗋嗎嗏嗐嗕嗗", 4, "嗞嗠嗢嗧嗩嗭嗮嗰嗱嗴嗶嗸", 4, "嗿嘂嘃嘄嘅"],
    ["8740", "嘆嘇嘊嘋嘍嘐", 7, "嘙嘚嘜嘝嘠嘡嘢嘥嘦嘨嘩嘪嘫嘮嘯嘰嘳嘵嘷嘸嘺嘼嘽嘾噀", 11, "噏", 4, "噕噖噚噛噝", 4],
    ["8780", "噣噥噦噧噭噮噯噰噲噳噴噵噷噸噹噺噽", 7, "嚇", 6, "嚐嚑嚒嚔", 14, "嚤", 10, "嚰", 6, "嚸嚹嚺嚻嚽", 12, "囋", 8, "囕囖囘囙囜団囥", 5, "囬囮囯囲図囶囷囸囻囼圀圁圂圅圇國", 6],
    ["8840", "園", 9, "圝圞圠圡圢圤圥圦圧圫圱圲圴", 4, "圼圽圿坁坃坄坅坆坈坉坋坒", 4, "坘坙坢坣坥坧坬坮坰坱坲坴坵坸坹坺坽坾坿垀"],
    ["8880", "垁垇垈垉垊垍", 4, "垔", 6, "垜垝垞垟垥垨垪垬垯垰垱垳垵垶垷垹", 8, "埄", 6, "埌埍埐埑埓埖埗埛埜埞埡埢埣埥", 7, "埮埰埱埲埳埵埶執埻埼埾埿堁堃堄堅堈堉堊堌堎堏堐堒堓堔堖堗堘堚堛堜堝堟堢堣堥", 4, "堫", 4, "報堲堳場堶", 7],
    ["8940", "堾", 5, "塅", 6, "塎塏塐塒塓塕塖塗塙", 4, "塟", 5, "塦", 4, "塭", 16, "塿墂墄墆墇墈墊墋墌"],
    ["8980", "墍", 4, "墔", 4, "墛墜墝墠", 7, "墪", 17, "墽墾墿壀壂壃壄壆", 10, "壒壓壔壖", 13, "壥", 5, "壭壯壱売壴壵壷壸壺", 7, "夃夅夆夈", 4, "夎夐夑夒夓夗夘夛夝夞夠夡夢夣夦夨夬夰夲夳夵夶夻"],
    ["8a40", "夽夾夿奀奃奅奆奊奌奍奐奒奓奙奛", 4, "奡奣奤奦", 12, "奵奷奺奻奼奾奿妀妅妉妋妌妎妏妐妑妔妕妘妚妛妜妝妟妠妡妢妦"],
    ["8a80", "妧妬妭妰妱妳", 5, "妺妼妽妿", 6, "姇姈姉姌姍姎姏姕姖姙姛姞", 4, "姤姦姧姩姪姫姭", 11, "姺姼姽姾娀娂娊娋娍娎娏娐娒娔娕娖娗娙娚娛娝娞娡娢娤娦娧娨娪", 6, "娳娵娷", 4, "娽娾娿婁", 4, "婇婈婋", 9, "婖婗婘婙婛", 5],
    ["8b40", "婡婣婤婥婦婨婩婫", 8, "婸婹婻婼婽婾媀", 17, "媓", 6, "媜", 13, "媫媬"],
    ["8b80", "媭", 4, "媴媶媷媹", 4, "媿嫀嫃", 5, "嫊嫋嫍", 4, "嫓嫕嫗嫙嫚嫛嫝嫞嫟嫢嫤嫥嫧嫨嫪嫬", 4, "嫲", 22, "嬊", 11, "嬘", 25, "嬳嬵嬶嬸", 7, "孁", 6],
    ["8c40", "孈", 7, "孒孖孞孠孡孧孨孫孭孮孯孲孴孶孷學孹孻孼孾孿宂宆宊宍宎宐宑宒宔宖実宧宨宩宬宭宮宯宱宲宷宺宻宼寀寁寃寈寉寊寋寍寎寏"],
    ["8c80", "寑寔", 8, "寠寢寣實寧審", 4, "寯寱", 6, "寽対尀専尃尅將專尋尌對導尐尒尓尗尙尛尞尟尠尡尣尦尨尩尪尫尭尮尯尰尲尳尵尶尷屃屄屆屇屌屍屒屓屔屖屗屘屚屛屜屝屟屢層屧", 6, "屰屲", 6, "屻屼屽屾岀岃", 4, "岉岊岋岎岏岒岓岕岝", 4, "岤", 4],
    ["8d40", "岪岮岯岰岲岴岶岹岺岻岼岾峀峂峃峅", 5, "峌", 5, "峓", 5, "峚", 6, "峢峣峧峩峫峬峮峯峱", 9, "峼", 4],
    ["8d80", "崁崄崅崈", 5, "崏", 4, "崕崗崘崙崚崜崝崟", 4, "崥崨崪崫崬崯", 4, "崵", 7, "崿", 7, "嵈嵉嵍", 10, "嵙嵚嵜嵞", 10, "嵪嵭嵮嵰嵱嵲嵳嵵", 12, "嶃", 21, "嶚嶛嶜嶞嶟嶠"],
    ["8e40", "嶡", 21, "嶸", 12, "巆", 6, "巎", 12, "巜巟巠巣巤巪巬巭"],
    ["8e80", "巰巵巶巸", 4, "巿帀帄帇帉帊帋帍帎帒帓帗帞", 7, "帨", 4, "帯帰帲", 4, "帹帺帾帿幀幁幃幆", 5, "幍", 6, "幖", 4, "幜幝幟幠幣", 14, "幵幷幹幾庁庂広庅庈庉庌庍庎庒庘庛庝庡庢庣庤庨", 4, "庮", 4, "庴庺庻庼庽庿", 6],
    ["8f40", "廆廇廈廋", 5, "廔廕廗廘廙廚廜", 11, "廩廫", 8, "廵廸廹廻廼廽弅弆弇弉弌弍弎弐弒弔弖弙弚弜弝弞弡弢弣弤"],
    ["8f80", "弨弫弬弮弰弲", 6, "弻弽弾弿彁", 14, "彑彔彙彚彛彜彞彟彠彣彥彧彨彫彮彯彲彴彵彶彸彺彽彾彿徃徆徍徎徏徑従徔徖徚徛徝從徟徠徢", 5, "復徫徬徯", 5, "徶徸徹徺徻徾", 4, "忇忈忊忋忎忓忔忕忚忛応忞忟忢忣忥忦忨忩忬忯忰忲忳忴忶忷忹忺忼怇"],
    ["9040", "怈怉怋怌怐怑怓怗怘怚怞怟怢怣怤怬怭怮怰", 4, "怶", 4, "怽怾恀恄", 6, "恌恎恏恑恓恔恖恗恘恛恜恞恟恠恡恥恦恮恱恲恴恵恷恾悀"],
    ["9080", "悁悂悅悆悇悈悊悋悎悏悐悑悓悕悗悘悙悜悞悡悢悤悥悧悩悪悮悰悳悵悶悷悹悺悽", 7, "惇惈惉惌", 4, "惒惓惔惖惗惙惛惞惡", 4, "惪惱惲惵惷惸惻", 4, "愂愃愄愅愇愊愋愌愐", 4, "愖愗愘愙愛愜愝愞愡愢愥愨愩愪愬", 18, "慀", 6],
    ["9140", "慇慉態慍慏慐慒慓慔慖", 6, "慞慟慠慡慣慤慥慦慩", 6, "慱慲慳慴慶慸", 18, "憌憍憏", 4, "憕"],
    ["9180", "憖", 6, "憞", 8, "憪憫憭", 9, "憸", 5, "憿懀懁懃", 4, "應懌", 4, "懓懕", 16, "懧", 13, "懶", 8, "戀", 5, "戇戉戓戔戙戜戝戞戠戣戦戧戨戩戫戭戯戰戱戲戵戶戸", 4, "扂扄扅扆扊"],
    ["9240", "扏扐払扖扗扙扚扜", 6, "扤扥扨扱扲扴扵扷扸扺扻扽抁抂抃抅抆抇抈抋", 5, "抔抙抜抝択抣抦抧抩抪抭抮抯抰抲抳抴抶抷抸抺抾拀拁"],
    ["9280", "拃拋拏拑拕拝拞拠拡拤拪拫拰拲拵拸拹拺拻挀挃挄挅挆挊挋挌挍挏挐挒挓挔挕挗挘挙挜挦挧挩挬挭挮挰挱挳", 5, "挻挼挾挿捀捁捄捇捈捊捑捒捓捔捖", 7, "捠捤捥捦捨捪捫捬捯捰捲捳捴捵捸捹捼捽捾捿掁掃掄掅掆掋掍掑掓掔掕掗掙", 6, "採掤掦掫掯掱掲掵掶掹掻掽掿揀"],
    ["9340", "揁揂揃揅揇揈揊揋揌揑揓揔揕揗", 6, "揟揢揤", 4, "揫揬揮揯揰揱揳揵揷揹揺揻揼揾搃搄搆", 4, "損搎搑搒搕", 5, "搝搟搢搣搤"],
    ["9380", "搥搧搨搩搫搮", 5, "搵", 4, "搻搼搾摀摂摃摉摋", 6, "摓摕摖摗摙", 4, "摟", 7, "摨摪摫摬摮", 9, "摻", 6, "撃撆撈", 8, "撓撔撗撘撚撛撜撝撟", 4, "撥撦撧撨撪撫撯撱撲撳撴撶撹撻撽撾撿擁擃擄擆", 6, "擏擑擓擔擕擖擙據"],
    ["9440", "擛擜擝擟擠擡擣擥擧", 24, "攁", 7, "攊", 7, "攓", 4, "攙", 8],
    ["9480", "攢攣攤攦", 4, "攬攭攰攱攲攳攷攺攼攽敀", 4, "敆敇敊敋敍敎敐敒敓敔敗敘敚敜敟敠敡敤敥敧敨敩敪敭敮敯敱敳敵敶數", 14, "斈斉斊斍斎斏斒斔斕斖斘斚斝斞斠斢斣斦斨斪斬斮斱", 7, "斺斻斾斿旀旂旇旈旉旊旍旐旑旓旔旕旘", 7, "旡旣旤旪旫"],
    ["9540", "旲旳旴旵旸旹旻", 4, "昁昄昅昇昈昉昋昍昐昑昒昖昗昘昚昛昜昞昡昢昣昤昦昩昪昫昬昮昰昲昳昷", 4, "昽昿晀時晄", 6, "晍晎晐晑晘"],
    ["9580", "晙晛晜晝晞晠晢晣晥晧晩", 4, "晱晲晳晵晸晹晻晼晽晿暀暁暃暅暆暈暉暊暋暍暎暏暐暒暓暔暕暘", 4, "暞", 8, "暩", 4, "暯", 4, "暵暶暷暸暺暻暼暽暿", 25, "曚曞", 7, "曧曨曪", 5, "曱曵曶書曺曻曽朁朂會"],
    ["9640", "朄朅朆朇朌朎朏朑朒朓朖朘朙朚朜朞朠", 5, "朧朩朮朰朲朳朶朷朸朹朻朼朾朿杁杄杅杇杊杋杍杒杔杕杗", 4, "杝杢杣杤杦杧杫杬杮東杴杶"],
    ["9680", "杸杹杺杻杽枀枂枃枅枆枈枊枌枍枎枏枑枒枓枔枖枙枛枟枠枡枤枦枩枬枮枱枲枴枹", 7, "柂柅", 9, "柕柖柗柛柟柡柣柤柦柧柨柪柫柭柮柲柵", 7, "柾栁栂栃栄栆栍栐栒栔栕栘", 4, "栞栟栠栢", 6, "栫", 6, "栴栵栶栺栻栿桇桋桍桏桒桖", 5],
    ["9740", "桜桝桞桟桪桬", 7, "桵桸", 8, "梂梄梇", 7, "梐梑梒梔梕梖梘", 9, "梣梤梥梩梪梫梬梮梱梲梴梶梷梸"],
    ["9780", "梹", 6, "棁棃", 5, "棊棌棎棏棐棑棓棔棖棗棙棛", 4, "棡棢棤", 9, "棯棲棳棴棶棷棸棻棽棾棿椀椂椃椄椆", 4, "椌椏椑椓", 11, "椡椢椣椥", 7, "椮椯椱椲椳椵椶椷椸椺椻椼椾楀楁楃", 16, "楕楖楘楙楛楜楟"],
    ["9840", "楡楢楤楥楧楨楩楪楬業楯楰楲", 4, "楺楻楽楾楿榁榃榅榊榋榌榎", 5, "榖榗榙榚榝", 9, "榩榪榬榮榯榰榲榳榵榶榸榹榺榼榽"],
    ["9880", "榾榿槀槂", 7, "構槍槏槑槒槓槕", 5, "槜槝槞槡", 11, "槮槯槰槱槳", 9, "槾樀", 9, "樋", 11, "標", 5, "樠樢", 5, "権樫樬樭樮樰樲樳樴樶", 6, "樿", 4, "橅橆橈", 7, "橑", 6, "橚"],
    ["9940", "橜", 4, "橢橣橤橦", 10, "橲", 6, "橺橻橽橾橿檁檂檃檅", 8, "檏檒", 4, "檘", 7, "檡", 5],
    ["9980", "檧檨檪檭", 114, "欥欦欨", 6],
    ["9a40", "欯欰欱欳欴欵欶欸欻欼欽欿歀歁歂歄歅歈歊歋歍", 11, "歚", 7, "歨歩歫", 13, "歺歽歾歿殀殅殈"],
    ["9a80", "殌殎殏殐殑殔殕殗殘殙殜", 4, "殢", 7, "殫", 7, "殶殸", 6, "毀毃毄毆", 4, "毌毎毐毑毘毚毜", 4, "毢", 7, "毬毭毮毰毱毲毴毶毷毸毺毻毼毾", 6, "氈", 4, "氎氒気氜氝氞氠氣氥氫氬氭氱氳氶氷氹氺氻氼氾氿汃汄汅汈汋", 4, "汑汒汓汖汘"],
    ["9b40", "汙汚汢汣汥汦汧汫", 4, "汱汳汵汷汸決汻汼汿沀沄沇沊沋沍沎沑沒沕沖沗沘沚沜沝沞沠沢沨沬沯沰沴沵沶沷沺泀況泂泃泆泇泈泋泍泎泏泑泒泘"],
    ["9b80", "泙泚泜泝泟泤泦泧泩泬泭泲泴泹泿洀洂洃洅洆洈洉洊洍洏洐洑洓洔洕洖洘洜洝洟", 5, "洦洨洩洬洭洯洰洴洶洷洸洺洿浀浂浄浉浌浐浕浖浗浘浛浝浟浡浢浤浥浧浨浫浬浭浰浱浲浳浵浶浹浺浻浽", 4, "涃涄涆涇涊涋涍涏涐涒涖", 4, "涜涢涥涬涭涰涱涳涴涶涷涹", 5, "淁淂淃淈淉淊"],
    ["9c40", "淍淎淏淐淒淓淔淕淗淚淛淜淟淢淣淥淧淨淩淪淭淯淰淲淴淵淶淸淺淽", 7, "渆渇済渉渋渏渒渓渕渘渙減渜渞渟渢渦渧渨渪測渮渰渱渳渵"],
    ["9c80", "渶渷渹渻", 7, "湅", 7, "湏湐湑湒湕湗湙湚湜湝湞湠", 10, "湬湭湯", 14, "満溁溂溄溇溈溊", 4, "溑", 6, "溙溚溛溝溞溠溡溣溤溦溨溩溫溬溭溮溰溳溵溸溹溼溾溿滀滃滄滅滆滈滉滊滌滍滎滐滒滖滘滙滛滜滝滣滧滪", 5],
    ["9d40", "滰滱滲滳滵滶滷滸滺", 7, "漃漄漅漇漈漊", 4, "漐漑漒漖", 9, "漡漢漣漥漦漧漨漬漮漰漲漴漵漷", 6, "漿潀潁潂"],
    ["9d80", "潃潄潅潈潉潊潌潎", 9, "潙潚潛潝潟潠潡潣潤潥潧", 5, "潯潰潱潳潵潶潷潹潻潽", 6, "澅澆澇澊澋澏", 12, "澝澞澟澠澢", 4, "澨", 10, "澴澵澷澸澺", 5, "濁濃", 5, "濊", 6, "濓", 10, "濟濢濣濤濥"],
    ["9e40", "濦", 7, "濰", 32, "瀒", 7, "瀜", 6, "瀤", 6],
    ["9e80", "瀫", 9, "瀶瀷瀸瀺", 17, "灍灎灐", 13, "灟", 11, "灮灱灲灳灴灷灹灺灻災炁炂炃炄炆炇炈炋炌炍炏炐炑炓炗炘炚炛炞", 12, "炰炲炴炵炶為炾炿烄烅烆烇烉烋", 12, "烚"],
    ["9f40", "烜烝烞烠烡烢烣烥烪烮烰", 6, "烸烺烻烼烾", 10, "焋", 4, "焑焒焔焗焛", 10, "焧", 7, "焲焳焴"],
    ["9f80", "焵焷", 13, "煆煇煈煉煋煍煏", 12, "煝煟", 4, "煥煩", 4, "煯煰煱煴煵煶煷煹煻煼煾", 5, "熅", 4, "熋熌熍熎熐熑熒熓熕熖熗熚", 4, "熡", 6, "熩熪熫熭", 5, "熴熶熷熸熺", 8, "燄", 9, "燏", 4],
    ["a040", "燖", 9, "燡燢燣燤燦燨", 5, "燯", 9, "燺", 11, "爇", 19],
    ["a080", "爛爜爞", 9, "爩爫爭爮爯爲爳爴爺爼爾牀", 6, "牉牊牋牎牏牐牑牓牔牕牗牘牚牜牞牠牣牤牥牨牪牫牬牭牰牱牳牴牶牷牸牻牼牽犂犃犅", 4, "犌犎犐犑犓", 11, "犠", 11, "犮犱犲犳犵犺", 6, "狅狆狇狉狊狋狌狏狑狓狔狕狖狘狚狛"],
    ["a1a1", "　、。·ˉˇ¨〃々—～‖…‘’“”〔〕〈", 7, "〖〗【】±×÷∶∧∨∑∏∪∩∈∷√⊥∥∠⌒⊙∫∮≡≌≈∽∝≠≮≯≤≥∞∵∴♂♀°′″℃＄¤￠￡‰§№☆★○●◎◇◆□■△▲※→←↑↓〓"],
    ["a2a1", "ⅰ", 9],
    ["a2b1", "⒈", 19, "⑴", 19, "①", 9],
    ["a2e5", "㈠", 9],
    ["a2f1", "Ⅰ", 11],
    ["a3a1", "！＂＃￥％", 88, "￣"],
    ["a4a1", "ぁ", 82],
    ["a5a1", "ァ", 85],
    ["a6a1", "Α", 16, "Σ", 6],
    ["a6c1", "α", 16, "σ", 6],
    ["a6e0", "︵︶︹︺︿﹀︽︾﹁﹂﹃﹄"],
    ["a6ee", "︻︼︷︸︱"],
    ["a6f4", "︳︴"],
    ["a7a1", "А", 5, "ЁЖ", 25],
    ["a7d1", "а", 5, "ёж", 25],
    ["a840", "ˊˋ˙–―‥‵℅℉↖↗↘↙∕∟∣≒≦≧⊿═", 35, "▁", 6],
    ["a880", "█", 7, "▓▔▕▼▽◢◣◤◥☉⊕〒〝〞"],
    ["a8a1", "āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜüêɑ"],
    ["a8bd", "ńň"],
    ["a8c0", "ɡ"],
    ["a8c5", "ㄅ", 36],
    ["a940", "〡", 8, "㊣㎎㎏㎜㎝㎞㎡㏄㏎㏑㏒㏕︰￢￤"],
    ["a959", "℡㈱"],
    ["a95c", "‐"],
    ["a960", "ー゛゜ヽヾ〆ゝゞ﹉", 9, "﹔﹕﹖﹗﹙", 8],
    ["a980", "﹢", 4, "﹨﹩﹪﹫"],
    ["a996", "〇"],
    ["a9a4", "─", 75],
    ["aa40", "狜狝狟狢", 5, "狪狫狵狶狹狽狾狿猀猂猄", 5, "猋猌猍猏猐猑猒猔猘猙猚猟猠猣猤猦猧猨猭猯猰猲猳猵猶猺猻猼猽獀", 8],
    ["aa80", "獉獊獋獌獎獏獑獓獔獕獖獘", 7, "獡", 10, "獮獰獱"],
    ["ab40", "獲", 11, "獿", 4, "玅玆玈玊玌玍玏玐玒玓玔玕玗玘玙玚玜玝玞玠玡玣", 5, "玪玬玭玱玴玵玶玸玹玼玽玾玿珁珃", 4],
    ["ab80", "珋珌珎珒", 6, "珚珛珜珝珟珡珢珣珤珦珨珪珫珬珮珯珰珱珳", 4],
    ["ac40", "珸", 10, "琄琇琈琋琌琍琎琑", 8, "琜", 5, "琣琤琧琩琫琭琯琱琲琷", 4, "琽琾琿瑀瑂", 11],
    ["ac80", "瑎", 6, "瑖瑘瑝瑠", 12, "瑮瑯瑱", 4, "瑸瑹瑺"],
    ["ad40", "瑻瑼瑽瑿璂璄璅璆璈璉璊璌璍璏璑", 10, "璝璟", 7, "璪", 15, "璻", 12],
    ["ad80", "瓈", 9, "瓓", 8, "瓝瓟瓡瓥瓧", 6, "瓰瓱瓲"],
    ["ae40", "瓳瓵瓸", 6, "甀甁甂甃甅", 7, "甎甐甒甔甕甖甗甛甝甞甠", 4, "甦甧甪甮甴甶甹甼甽甿畁畂畃畄畆畇畉畊畍畐畑畒畓畕畖畗畘"],
    ["ae80", "畝", 7, "畧畨畩畫", 6, "畳畵當畷畺", 4, "疀疁疂疄疅疇"],
    ["af40", "疈疉疊疌疍疎疐疓疕疘疛疜疞疢疦", 4, "疭疶疷疺疻疿痀痁痆痋痌痎痏痐痑痓痗痙痚痜痝痟痠痡痥痩痬痭痮痯痲痳痵痶痷痸痺痻痽痾瘂瘄瘆瘇"],
    ["af80", "瘈瘉瘋瘍瘎瘏瘑瘒瘓瘔瘖瘚瘜瘝瘞瘡瘣瘧瘨瘬瘮瘯瘱瘲瘶瘷瘹瘺瘻瘽癁療癄"],
    ["b040", "癅", 6, "癎", 5, "癕癗", 4, "癝癟癠癡癢癤", 6, "癬癭癮癰", 7, "癹発發癿皀皁皃皅皉皊皌皍皏皐皒皔皕皗皘皚皛"],
    ["b080", "皜", 7, "皥", 8, "皯皰皳皵", 9, "盀盁盃啊阿埃挨哎唉哀皑癌蔼矮艾碍爱隘鞍氨安俺按暗岸胺案肮昂盎凹敖熬翱袄傲奥懊澳芭捌扒叭吧笆八疤巴拔跋靶把耙坝霸罢爸白柏百摆佰败拜稗斑班搬扳般颁板版扮拌伴瓣半办绊邦帮梆榜膀绑棒磅蚌镑傍谤苞胞包褒剥"],
    ["b140", "盄盇盉盋盌盓盕盙盚盜盝盞盠", 4, "盦", 7, "盰盳盵盶盷盺盻盽盿眀眂眃眅眆眊県眎", 10, "眛眜眝眞眡眣眤眥眧眪眫"],
    ["b180", "眬眮眰", 4, "眹眻眽眾眿睂睄睅睆睈", 7, "睒", 7, "睜薄雹保堡饱宝抱报暴豹鲍爆杯碑悲卑北辈背贝钡倍狈备惫焙被奔苯本笨崩绷甭泵蹦迸逼鼻比鄙笔彼碧蓖蔽毕毙毖币庇痹闭敝弊必辟壁臂避陛鞭边编贬扁便变卞辨辩辫遍标彪膘表鳖憋别瘪彬斌濒滨宾摈兵冰柄丙秉饼炳"],
    ["b240", "睝睞睟睠睤睧睩睪睭", 11, "睺睻睼瞁瞂瞃瞆", 5, "瞏瞐瞓", 11, "瞡瞣瞤瞦瞨瞫瞭瞮瞯瞱瞲瞴瞶", 4],
    ["b280", "瞼瞾矀", 12, "矎", 8, "矘矙矚矝", 4, "矤病并玻菠播拨钵波博勃搏铂箔伯帛舶脖膊渤泊驳捕卜哺补埠不布步簿部怖擦猜裁材才财睬踩采彩菜蔡餐参蚕残惭惨灿苍舱仓沧藏操糙槽曹草厕策侧册测层蹭插叉茬茶查碴搽察岔差诧拆柴豺搀掺蝉馋谗缠铲产阐颤昌猖"],
    ["b340", "矦矨矪矯矰矱矲矴矵矷矹矺矻矼砃", 5, "砊砋砎砏砐砓砕砙砛砞砠砡砢砤砨砪砫砮砯砱砲砳砵砶砽砿硁硂硃硄硆硈硉硊硋硍硏硑硓硔硘硙硚"],
    ["b380", "硛硜硞", 11, "硯", 7, "硸硹硺硻硽", 6, "场尝常长偿肠厂敞畅唱倡超抄钞朝嘲潮巢吵炒车扯撤掣彻澈郴臣辰尘晨忱沉陈趁衬撑称城橙成呈乘程惩澄诚承逞骋秤吃痴持匙池迟弛驰耻齿侈尺赤翅斥炽充冲虫崇宠抽酬畴踌稠愁筹仇绸瞅丑臭初出橱厨躇锄雏滁除楚"],
    ["b440", "碄碅碆碈碊碋碏碐碒碔碕碖碙碝碞碠碢碤碦碨", 7, "碵碶碷碸確碻碼碽碿磀磂磃磄磆磇磈磌磍磎磏磑磒磓磖磗磘磚", 9],
    ["b480", "磤磥磦磧磩磪磫磭", 4, "磳磵磶磸磹磻", 5, "礂礃礄礆", 6, "础储矗搐触处揣川穿椽传船喘串疮窗幢床闯创吹炊捶锤垂春椿醇唇淳纯蠢戳绰疵茨磁雌辞慈瓷词此刺赐次聪葱囱匆从丛凑粗醋簇促蹿篡窜摧崔催脆瘁粹淬翠村存寸磋撮搓措挫错搭达答瘩打大呆歹傣戴带殆代贷袋待逮"],
    ["b540", "礍", 5, "礔", 9, "礟", 4, "礥", 14, "礵", 4, "礽礿祂祃祄祅祇祊", 8, "祔祕祘祙祡祣"],
    ["b580", "祤祦祩祪祫祬祮祰", 6, "祹祻", 4, "禂禃禆禇禈禉禋禌禍禎禐禑禒怠耽担丹单郸掸胆旦氮但惮淡诞弹蛋当挡党荡档刀捣蹈倒岛祷导到稻悼道盗德得的蹬灯登等瞪凳邓堤低滴迪敌笛狄涤翟嫡抵底地蒂第帝弟递缔颠掂滇碘点典靛垫电佃甸店惦奠淀殿碉叼雕凋刁掉吊钓调跌爹碟蝶迭谍叠"],
    ["b640", "禓", 6, "禛", 11, "禨", 10, "禴", 4, "禼禿秂秄秅秇秈秊秌秎秏秐秓秔秖秗秙", 5, "秠秡秢秥秨秪"],
    ["b680", "秬秮秱", 6, "秹秺秼秾秿稁稄稅稇稈稉稊稌稏", 4, "稕稖稘稙稛稜丁盯叮钉顶鼎锭定订丢东冬董懂动栋侗恫冻洞兜抖斗陡豆逗痘都督毒犊独读堵睹赌杜镀肚度渡妒端短锻段断缎堆兑队对墩吨蹲敦顿囤钝盾遁掇哆多夺垛躲朵跺舵剁惰堕蛾峨鹅俄额讹娥恶厄扼遏鄂饿恩而儿耳尔饵洱二"],
    ["b740", "稝稟稡稢稤", 14, "稴稵稶稸稺稾穀", 5, "穇", 9, "穒", 4, "穘", 16],
    ["b780", "穩", 6, "穱穲穳穵穻穼穽穾窂窅窇窉窊窋窌窎窏窐窓窔窙窚窛窞窡窢贰发罚筏伐乏阀法珐藩帆番翻樊矾钒繁凡烦反返范贩犯饭泛坊芳方肪房防妨仿访纺放菲非啡飞肥匪诽吠肺废沸费芬酚吩氛分纷坟焚汾粉奋份忿愤粪丰封枫蜂峰锋风疯烽逢冯缝讽奉凤佛否夫敷肤孵扶拂辐幅氟符伏俘服"],
    ["b840", "窣窤窧窩窪窫窮", 4, "窴", 10, "竀", 10, "竌", 9, "竗竘竚竛竜竝竡竢竤竧", 5, "竮竰竱竲竳"],
    ["b880", "竴", 4, "竻竼竾笀笁笂笅笇笉笌笍笎笐笒笓笖笗笘笚笜笝笟笡笢笣笧笩笭浮涪福袱弗甫抚辅俯釜斧脯腑府腐赴副覆赋复傅付阜父腹负富讣附妇缚咐噶嘎该改概钙盖溉干甘杆柑竿肝赶感秆敢赣冈刚钢缸肛纲岗港杠篙皋高膏羔糕搞镐稿告哥歌搁戈鸽胳疙割革葛格蛤阁隔铬个各给根跟耕更庚羹"],
    ["b940", "笯笰笲笴笵笶笷笹笻笽笿", 5, "筆筈筊筍筎筓筕筗筙筜筞筟筡筣", 10, "筯筰筳筴筶筸筺筼筽筿箁箂箃箄箆", 6, "箎箏"],
    ["b980", "箑箒箓箖箘箙箚箛箞箟箠箣箤箥箮箯箰箲箳箵箶箷箹", 7, "篂篃範埂耿梗工攻功恭龚供躬公宫弓巩汞拱贡共钩勾沟苟狗垢构购够辜菇咕箍估沽孤姑鼓古蛊骨谷股故顾固雇刮瓜剐寡挂褂乖拐怪棺关官冠观管馆罐惯灌贯光广逛瑰规圭硅归龟闺轨鬼诡癸桂柜跪贵刽辊滚棍锅郭国果裹过哈"],
    ["ba40", "篅篈築篊篋篍篎篏篐篒篔", 4, "篛篜篞篟篠篢篣篤篧篨篩篫篬篭篯篰篲", 4, "篸篹篺篻篽篿", 7, "簈簉簊簍簎簐", 5, "簗簘簙"],
    ["ba80", "簚", 4, "簠", 5, "簨簩簫", 12, "簹", 5, "籂骸孩海氦亥害骇酣憨邯韩含涵寒函喊罕翰撼捍旱憾悍焊汗汉夯杭航壕嚎豪毫郝好耗号浩呵喝荷菏核禾和何合盒貉阂河涸赫褐鹤贺嘿黑痕很狠恨哼亨横衡恒轰哄烘虹鸿洪宏弘红喉侯猴吼厚候后呼乎忽瑚壶葫胡蝴狐糊湖"],
    ["bb40", "籃", 9, "籎", 36, "籵", 5, "籾", 9],
    ["bb80", "粈粊", 6, "粓粔粖粙粚粛粠粡粣粦粧粨粩粫粬粭粯粰粴", 4, "粺粻弧虎唬护互沪户花哗华猾滑画划化话槐徊怀淮坏欢环桓还缓换患唤痪豢焕涣宦幻荒慌黄磺蝗簧皇凰惶煌晃幌恍谎灰挥辉徽恢蛔回毁悔慧卉惠晦贿秽会烩汇讳诲绘荤昏婚魂浑混豁活伙火获或惑霍货祸击圾基机畸稽积箕"],
    ["bc40", "粿糀糂糃糄糆糉糋糎", 6, "糘糚糛糝糞糡", 6, "糩", 5, "糰", 7, "糹糺糼", 13, "紋", 5],
    ["bc80", "紑", 14, "紡紣紤紥紦紨紩紪紬紭紮細", 6, "肌饥迹激讥鸡姬绩缉吉极棘辑籍集及急疾汲即嫉级挤几脊己蓟技冀季伎祭剂悸济寄寂计记既忌际妓继纪嘉枷夹佳家加荚颊贾甲钾假稼价架驾嫁歼监坚尖笺间煎兼肩艰奸缄茧检柬碱硷拣捡简俭剪减荐槛鉴践贱见键箭件"],
    ["bd40", "紷", 54, "絯", 7],
    ["bd80", "絸", 32, "健舰剑饯渐溅涧建僵姜将浆江疆蒋桨奖讲匠酱降蕉椒礁焦胶交郊浇骄娇嚼搅铰矫侥脚狡角饺缴绞剿教酵轿较叫窖揭接皆秸街阶截劫节桔杰捷睫竭洁结解姐戒藉芥界借介疥诫届巾筋斤金今津襟紧锦仅谨进靳晋禁近烬浸"],
    ["be40", "継", 12, "綧", 6, "綯", 42],
    ["be80", "線", 32, "尽劲荆兢茎睛晶鲸京惊精粳经井警景颈静境敬镜径痉靖竟竞净炯窘揪究纠玖韭久灸九酒厩救旧臼舅咎就疚鞠拘狙疽居驹菊局咀矩举沮聚拒据巨具距踞锯俱句惧炬剧捐鹃娟倦眷卷绢撅攫抉掘倔爵觉决诀绝均菌钧军君峻"],
    ["bf40", "緻", 62],
    ["bf80", "縺縼", 4, "繂", 4, "繈", 21, "俊竣浚郡骏喀咖卡咯开揩楷凯慨刊堪勘坎砍看康慷糠扛抗亢炕考拷烤靠坷苛柯棵磕颗科壳咳可渴克刻客课肯啃垦恳坑吭空恐孔控抠口扣寇枯哭窟苦酷库裤夸垮挎跨胯块筷侩快宽款匡筐狂框矿眶旷况亏盔岿窥葵奎魁傀"],
    ["c040", "繞", 35, "纃", 23, "纜纝纞"],
    ["c080", "纮纴纻纼绖绤绬绹缊缐缞缷缹缻", 6, "罃罆", 9, "罒罓馈愧溃坤昆捆困括扩廓阔垃拉喇蜡腊辣啦莱来赖蓝婪栏拦篮阑兰澜谰揽览懒缆烂滥琅榔狼廊郎朗浪捞劳牢老佬姥酪烙涝勒乐雷镭蕾磊累儡垒擂肋类泪棱楞冷厘梨犁黎篱狸离漓理李里鲤礼莉荔吏栗丽厉励砾历利傈例俐"],
    ["c140", "罖罙罛罜罝罞罠罣", 4, "罫罬罭罯罰罳罵罶罷罸罺罻罼罽罿羀羂", 7, "羋羍羏", 4, "羕", 4, "羛羜羠羢羣羥羦羨", 6, "羱"],
    ["c180", "羳", 4, "羺羻羾翀翂翃翄翆翇翈翉翋翍翏", 4, "翖翗翙", 5, "翢翣痢立粒沥隶力璃哩俩联莲连镰廉怜涟帘敛脸链恋炼练粮凉梁粱良两辆量晾亮谅撩聊僚疗燎寥辽潦了撂镣廖料列裂烈劣猎琳林磷霖临邻鳞淋凛赁吝拎玲菱零龄铃伶羚凌灵陵岭领另令溜琉榴硫馏留刘瘤流柳六龙聋咙笼窿"],
    ["c240", "翤翧翨翪翫翬翭翯翲翴", 6, "翽翾翿耂耇耈耉耊耎耏耑耓耚耛耝耞耟耡耣耤耫", 5, "耲耴耹耺耼耾聀聁聄聅聇聈聉聎聏聐聑聓聕聖聗"],
    ["c280", "聙聛", 13, "聫", 5, "聲", 11, "隆垄拢陇楼娄搂篓漏陋芦卢颅庐炉掳卤虏鲁麓碌露路赂鹿潞禄录陆戮驴吕铝侣旅履屡缕虑氯律率滤绿峦挛孪滦卵乱掠略抡轮伦仑沦纶论萝螺罗逻锣箩骡裸落洛骆络妈麻玛码蚂马骂嘛吗埋买麦卖迈脉瞒馒蛮满蔓曼慢漫"],
    ["c340", "聾肁肂肅肈肊肍", 5, "肔肕肗肙肞肣肦肧肨肬肰肳肵肶肸肹肻胅胇", 4, "胏", 6, "胘胟胠胢胣胦胮胵胷胹胻胾胿脀脁脃脄脅脇脈脋"],
    ["c380", "脌脕脗脙脛脜脝脟", 12, "脭脮脰脳脴脵脷脹", 4, "脿谩芒茫盲氓忙莽猫茅锚毛矛铆卯茂冒帽貌贸么玫枚梅酶霉煤没眉媒镁每美昧寐妹媚门闷们萌蒙檬盟锰猛梦孟眯醚靡糜迷谜弥米秘觅泌蜜密幂棉眠绵冕免勉娩缅面苗描瞄藐秒渺庙妙蔑灭民抿皿敏悯闽明螟鸣铭名命谬摸"],
    ["c440", "腀", 5, "腇腉腍腎腏腒腖腗腘腛", 4, "腡腢腣腤腦腨腪腫腬腯腲腳腵腶腷腸膁膃", 4, "膉膋膌膍膎膐膒", 5, "膙膚膞", 4, "膤膥"],
    ["c480", "膧膩膫", 7, "膴", 5, "膼膽膾膿臄臅臇臈臉臋臍", 6, "摹蘑模膜磨摩魔抹末莫墨默沫漠寞陌谋牟某拇牡亩姆母墓暮幕募慕木目睦牧穆拿哪呐钠那娜纳氖乃奶耐奈南男难囊挠脑恼闹淖呢馁内嫩能妮霓倪泥尼拟你匿腻逆溺蔫拈年碾撵捻念娘酿鸟尿捏聂孽啮镊镍涅您柠狞凝宁"],
    ["c540", "臔", 14, "臤臥臦臨臩臫臮", 4, "臵", 5, "臽臿舃與", 4, "舎舏舑舓舕", 5, "舝舠舤舥舦舧舩舮舲舺舼舽舿"],
    ["c580", "艀艁艂艃艅艆艈艊艌艍艎艐", 7, "艙艛艜艝艞艠", 7, "艩拧泞牛扭钮纽脓浓农弄奴努怒女暖虐疟挪懦糯诺哦欧鸥殴藕呕偶沤啪趴爬帕怕琶拍排牌徘湃派攀潘盘磐盼畔判叛乓庞旁耪胖抛咆刨炮袍跑泡呸胚培裴赔陪配佩沛喷盆砰抨烹澎彭蓬棚硼篷膨朋鹏捧碰坯砒霹批披劈琵毗"],
    ["c640", "艪艫艬艭艱艵艶艷艸艻艼芀芁芃芅芆芇芉芌芐芓芔芕芖芚芛芞芠芢芣芧芲芵芶芺芻芼芿苀苂苃苅苆苉苐苖苙苚苝苢苧苨苩苪苬苭苮苰苲苳苵苶苸"],
    ["c680", "苺苼", 4, "茊茋茍茐茒茓茖茘茙茝", 9, "茩茪茮茰茲茷茻茽啤脾疲皮匹痞僻屁譬篇偏片骗飘漂瓢票撇瞥拼频贫品聘乒坪苹萍平凭瓶评屏坡泼颇婆破魄迫粕剖扑铺仆莆葡菩蒲埔朴圃普浦谱曝瀑期欺栖戚妻七凄漆柒沏其棋奇歧畦崎脐齐旗祈祁骑起岂乞企启契砌器气迄弃汽泣讫掐"],
    ["c740", "茾茿荁荂荄荅荈荊", 4, "荓荕", 4, "荝荢荰", 6, "荹荺荾", 6, "莇莈莊莋莌莍莏莐莑莔莕莖莗莙莚莝莟莡", 6, "莬莭莮"],
    ["c780", "莯莵莻莾莿菂菃菄菆菈菉菋菍菎菐菑菒菓菕菗菙菚菛菞菢菣菤菦菧菨菫菬菭恰洽牵扦钎铅千迁签仟谦乾黔钱钳前潜遣浅谴堑嵌欠歉枪呛腔羌墙蔷强抢橇锹敲悄桥瞧乔侨巧鞘撬翘峭俏窍切茄且怯窃钦侵亲秦琴勤芹擒禽寝沁青轻氢倾卿清擎晴氰情顷请庆琼穷秋丘邱球求囚酋泅趋区蛆曲躯屈驱渠"],
    ["c840", "菮華菳", 4, "菺菻菼菾菿萀萂萅萇萈萉萊萐萒", 5, "萙萚萛萞", 5, "萩", 7, "萲", 5, "萹萺萻萾", 7, "葇葈葉"],
    ["c880", "葊", 6, "葒", 4, "葘葝葞葟葠葢葤", 4, "葪葮葯葰葲葴葷葹葻葼取娶龋趣去圈颧权醛泉全痊拳犬券劝缺炔瘸却鹊榷确雀裙群然燃冉染瓤壤攘嚷让饶扰绕惹热壬仁人忍韧任认刃妊纫扔仍日戎茸蓉荣融熔溶容绒冗揉柔肉茹蠕儒孺如辱乳汝入褥软阮蕊瑞锐闰润若弱撒洒萨腮鳃塞赛三叁"],
    ["c940", "葽", 4, "蒃蒄蒅蒆蒊蒍蒏", 7, "蒘蒚蒛蒝蒞蒟蒠蒢", 12, "蒰蒱蒳蒵蒶蒷蒻蒼蒾蓀蓂蓃蓅蓆蓇蓈蓋蓌蓎蓏蓒蓔蓕蓗"],
    ["c980", "蓘", 4, "蓞蓡蓢蓤蓧", 4, "蓭蓮蓯蓱", 10, "蓽蓾蔀蔁蔂伞散桑嗓丧搔骚扫嫂瑟色涩森僧莎砂杀刹沙纱傻啥煞筛晒珊苫杉山删煽衫闪陕擅赡膳善汕扇缮墒伤商赏晌上尚裳梢捎稍烧芍勺韶少哨邵绍奢赊蛇舌舍赦摄射慑涉社设砷申呻伸身深娠绅神沈审婶甚肾慎渗声生甥牲升绳"],
    ["ca40", "蔃", 8, "蔍蔎蔏蔐蔒蔔蔕蔖蔘蔙蔛蔜蔝蔞蔠蔢", 8, "蔭", 9, "蔾", 4, "蕄蕅蕆蕇蕋", 10],
    ["ca80", "蕗蕘蕚蕛蕜蕝蕟", 4, "蕥蕦蕧蕩", 8, "蕳蕵蕶蕷蕸蕼蕽蕿薀薁省盛剩胜圣师失狮施湿诗尸虱十石拾时什食蚀实识史矢使屎驶始式示士世柿事拭誓逝势是嗜噬适仕侍释饰氏市恃室视试收手首守寿授售受瘦兽蔬枢梳殊抒输叔舒淑疏书赎孰熟薯暑曙署蜀黍鼠属术述树束戍竖墅庶数漱"],
    ["cb40", "薂薃薆薈", 6, "薐", 10, "薝", 6, "薥薦薧薩薫薬薭薱", 5, "薸薺", 6, "藂", 6, "藊", 4, "藑藒"],
    ["cb80", "藔藖", 5, "藝", 6, "藥藦藧藨藪", 14, "恕刷耍摔衰甩帅栓拴霜双爽谁水睡税吮瞬顺舜说硕朔烁斯撕嘶思私司丝死肆寺嗣四伺似饲巳松耸怂颂送宋讼诵搜艘擞嗽苏酥俗素速粟僳塑溯宿诉肃酸蒜算虽隋随绥髓碎岁穗遂隧祟孙损笋蓑梭唆缩琐索锁所塌他它她塔"],
    ["cc40", "藹藺藼藽藾蘀", 4, "蘆", 10, "蘒蘓蘔蘕蘗", 15, "蘨蘪", 13, "蘹蘺蘻蘽蘾蘿虀"],
    ["cc80", "虁", 11, "虒虓處", 4, "虛虜虝號虠虡虣", 7, "獭挞蹋踏胎苔抬台泰酞太态汰坍摊贪瘫滩坛檀痰潭谭谈坦毯袒碳探叹炭汤塘搪堂棠膛唐糖倘躺淌趟烫掏涛滔绦萄桃逃淘陶讨套特藤腾疼誊梯剔踢锑提题蹄啼体替嚏惕涕剃屉天添填田甜恬舔腆挑条迢眺跳贴铁帖厅听烃"],
    ["cd40", "虭虯虰虲", 6, "蚃", 6, "蚎", 4, "蚔蚖", 5, "蚞", 4, "蚥蚦蚫蚭蚮蚲蚳蚷蚸蚹蚻", 4, "蛁蛂蛃蛅蛈蛌蛍蛒蛓蛕蛖蛗蛚蛜"],
    ["cd80", "蛝蛠蛡蛢蛣蛥蛦蛧蛨蛪蛫蛬蛯蛵蛶蛷蛺蛻蛼蛽蛿蜁蜄蜅蜆蜋蜌蜎蜏蜐蜑蜔蜖汀廷停亭庭挺艇通桐酮瞳同铜彤童桶捅筒统痛偷投头透凸秃突图徒途涂屠土吐兔湍团推颓腿蜕褪退吞屯臀拖托脱鸵陀驮驼椭妥拓唾挖哇蛙洼娃瓦袜歪外豌弯湾玩顽丸烷完碗挽晚皖惋宛婉万腕汪王亡枉网往旺望忘妄威"],
    ["ce40", "蜙蜛蜝蜟蜠蜤蜦蜧蜨蜪蜫蜬蜭蜯蜰蜲蜳蜵蜶蜸蜹蜺蜼蜽蝀", 6, "蝊蝋蝍蝏蝐蝑蝒蝔蝕蝖蝘蝚", 5, "蝡蝢蝦", 7, "蝯蝱蝲蝳蝵"],
    ["ce80", "蝷蝸蝹蝺蝿螀螁螄螆螇螉螊螌螎", 4, "螔螕螖螘", 6, "螠", 4, "巍微危韦违桅围唯惟为潍维苇萎委伟伪尾纬未蔚味畏胃喂魏位渭谓尉慰卫瘟温蚊文闻纹吻稳紊问嗡翁瓮挝蜗涡窝我斡卧握沃巫呜钨乌污诬屋无芜梧吾吴毋武五捂午舞伍侮坞戊雾晤物勿务悟误昔熙析西硒矽晰嘻吸锡牺"],
    ["cf40", "螥螦螧螩螪螮螰螱螲螴螶螷螸螹螻螼螾螿蟁", 4, "蟇蟈蟉蟌", 4, "蟔", 6, "蟜蟝蟞蟟蟡蟢蟣蟤蟦蟧蟨蟩蟫蟬蟭蟯", 9],
    ["cf80", "蟺蟻蟼蟽蟿蠀蠁蠂蠄", 5, "蠋", 7, "蠔蠗蠘蠙蠚蠜", 4, "蠣稀息希悉膝夕惜熄烯溪汐犀檄袭席习媳喜铣洗系隙戏细瞎虾匣霞辖暇峡侠狭下厦夏吓掀锨先仙鲜纤咸贤衔舷闲涎弦嫌显险现献县腺馅羡宪陷限线相厢镶香箱襄湘乡翔祥详想响享项巷橡像向象萧硝霄削哮嚣销消宵淆晓"],
    ["d040", "蠤", 13, "蠳", 5, "蠺蠻蠽蠾蠿衁衂衃衆", 5, "衎", 5, "衕衖衘衚", 6, "衦衧衪衭衯衱衳衴衵衶衸衹衺"],
    ["d080", "衻衼袀袃袆袇袉袊袌袎袏袐袑袓袔袕袗", 4, "袝", 4, "袣袥", 5, "小孝校肖啸笑效楔些歇蝎鞋协挟携邪斜胁谐写械卸蟹懈泄泻谢屑薪芯锌欣辛新忻心信衅星腥猩惺兴刑型形邢行醒幸杏性姓兄凶胸匈汹雄熊休修羞朽嗅锈秀袖绣墟戌需虚嘘须徐许蓄酗叙旭序畜恤絮婿绪续轩喧宣悬旋玄"],
    ["d140", "袬袮袯袰袲", 4, "袸袹袺袻袽袾袿裀裃裄裇裈裊裋裌裍裏裐裑裓裖裗裚", 4, "裠裡裦裧裩", 6, "裲裵裶裷裺裻製裿褀褁褃", 5],
    ["d180", "褉褋", 4, "褑褔", 4, "褜", 4, "褢褣褤褦褧褨褩褬褭褮褯褱褲褳褵褷选癣眩绚靴薛学穴雪血勋熏循旬询寻驯巡殉汛训讯逊迅压押鸦鸭呀丫芽牙蚜崖衙涯雅哑亚讶焉咽阉烟淹盐严研蜒岩延言颜阎炎沿奄掩眼衍演艳堰燕厌砚雁唁彦焰宴谚验殃央鸯秧杨扬佯疡羊洋阳氧仰痒养样漾邀腰妖瑶"],
    ["d240", "褸", 8, "襂襃襅", 24, "襠", 5, "襧", 19, "襼"],
    ["d280", "襽襾覀覂覄覅覇", 26, "摇尧遥窑谣姚咬舀药要耀椰噎耶爷野冶也页掖业叶曳腋夜液一壹医揖铱依伊衣颐夷遗移仪胰疑沂宜姨彝椅蚁倚已乙矣以艺抑易邑屹亿役臆逸肄疫亦裔意毅忆义益溢诣议谊译异翼翌绎茵荫因殷音阴姻吟银淫寅饮尹引隐"],
    ["d340", "覢", 30, "觃觍觓觔觕觗觘觙觛觝觟觠觡觢觤觧觨觩觪觬觭觮觰觱觲觴", 6],
    ["d380", "觻", 4, "訁", 5, "計", 21, "印英樱婴鹰应缨莹萤营荧蝇迎赢盈影颖硬映哟拥佣臃痈庸雍踊蛹咏泳涌永恿勇用幽优悠忧尤由邮铀犹油游酉有友右佑釉诱又幼迂淤于盂榆虞愚舆余俞逾鱼愉渝渔隅予娱雨与屿禹宇语羽玉域芋郁吁遇喻峪御愈欲狱育誉"],
    ["d440", "訞", 31, "訿", 8, "詉", 21],
    ["d480", "詟", 25, "詺", 6, "浴寓裕预豫驭鸳渊冤元垣袁原援辕园员圆猿源缘远苑愿怨院曰约越跃钥岳粤月悦阅耘云郧匀陨允运蕴酝晕韵孕匝砸杂栽哉灾宰载再在咱攒暂赞赃脏葬遭糟凿藻枣早澡蚤躁噪造皂灶燥责择则泽贼怎增憎曾赠扎喳渣札轧"],
    ["d540", "誁", 7, "誋", 7, "誔", 46],
    ["d580", "諃", 32, "铡闸眨栅榨咋乍炸诈摘斋宅窄债寨瞻毡詹粘沾盏斩辗崭展蘸栈占战站湛绽樟章彰漳张掌涨杖丈帐账仗胀瘴障招昭找沼赵照罩兆肇召遮折哲蛰辙者锗蔗这浙珍斟真甄砧臻贞针侦枕疹诊震振镇阵蒸挣睁征狰争怔整拯正政"],
    ["d640", "諤", 34, "謈", 27],
    ["d680", "謤謥謧", 30, "帧症郑证芝枝支吱蜘知肢脂汁之织职直植殖执值侄址指止趾只旨纸志挚掷至致置帜峙制智秩稚质炙痔滞治窒中盅忠钟衷终种肿重仲众舟周州洲诌粥轴肘帚咒皱宙昼骤珠株蛛朱猪诸诛逐竹烛煮拄瞩嘱主著柱助蛀贮铸筑"],
    ["d740", "譆", 31, "譧", 4, "譭", 25],
    ["d780", "讇", 24, "讬讱讻诇诐诪谉谞住注祝驻抓爪拽专砖转撰赚篆桩庄装妆撞壮状椎锥追赘坠缀谆准捉拙卓桌琢茁酌啄着灼浊兹咨资姿滋淄孜紫仔籽滓子自渍字鬃棕踪宗综总纵邹走奏揍租足卒族祖诅阻组钻纂嘴醉最罪尊遵昨左佐柞做作坐座"],
    ["d840", "谸", 8, "豂豃豄豅豈豊豋豍", 7, "豖豗豘豙豛", 5, "豣", 6, "豬", 6, "豴豵豶豷豻", 6, "貃貄貆貇"],
    ["d880", "貈貋貍", 6, "貕貖貗貙", 20, "亍丌兀丐廿卅丕亘丞鬲孬噩丨禺丿匕乇夭爻卮氐囟胤馗毓睾鼗丶亟鼐乜乩亓芈孛啬嘏仄厍厝厣厥厮靥赝匚叵匦匮匾赜卦卣刂刈刎刭刳刿剀剌剞剡剜蒯剽劂劁劐劓冂罔亻仃仉仂仨仡仫仞伛仳伢佤仵伥伧伉伫佞佧攸佚佝"],
    ["d940", "貮", 62],
    ["d980", "賭", 32, "佟佗伲伽佶佴侑侉侃侏佾佻侪佼侬侔俦俨俪俅俚俣俜俑俟俸倩偌俳倬倏倮倭俾倜倌倥倨偾偃偕偈偎偬偻傥傧傩傺僖儆僭僬僦僮儇儋仝氽佘佥俎龠汆籴兮巽黉馘冁夔勹匍訇匐凫夙兕亠兖亳衮袤亵脔裒禀嬴蠃羸冫冱冽冼"],
    ["da40", "贎", 14, "贠赑赒赗赟赥赨赩赪赬赮赯赱赲赸", 8, "趂趃趆趇趈趉趌", 4, "趒趓趕", 9, "趠趡"],
    ["da80", "趢趤", 12, "趲趶趷趹趻趽跀跁跂跅跇跈跉跊跍跐跒跓跔凇冖冢冥讠讦讧讪讴讵讷诂诃诋诏诎诒诓诔诖诘诙诜诟诠诤诨诩诮诰诳诶诹诼诿谀谂谄谇谌谏谑谒谔谕谖谙谛谘谝谟谠谡谥谧谪谫谮谯谲谳谵谶卩卺阝阢阡阱阪阽阼陂陉陔陟陧陬陲陴隈隍隗隰邗邛邝邙邬邡邴邳邶邺"],
    ["db40", "跕跘跙跜跠跡跢跥跦跧跩跭跮跰跱跲跴跶跼跾", 6, "踆踇踈踋踍踎踐踑踒踓踕", 7, "踠踡踤", 4, "踫踭踰踲踳踴踶踷踸踻踼踾"],
    ["db80", "踿蹃蹅蹆蹌", 4, "蹓", 5, "蹚", 11, "蹧蹨蹪蹫蹮蹱邸邰郏郅邾郐郄郇郓郦郢郜郗郛郫郯郾鄄鄢鄞鄣鄱鄯鄹酃酆刍奂劢劬劭劾哿勐勖勰叟燮矍廴凵凼鬯厶弁畚巯坌垩垡塾墼壅壑圩圬圪圳圹圮圯坜圻坂坩垅坫垆坼坻坨坭坶坳垭垤垌垲埏垧垴垓垠埕埘埚埙埒垸埴埯埸埤埝"],
    ["dc40", "蹳蹵蹷", 4, "蹽蹾躀躂躃躄躆躈", 6, "躑躒躓躕", 6, "躝躟", 11, "躭躮躰躱躳", 6, "躻", 7],
    ["dc80", "軃", 10, "軏", 21, "堋堍埽埭堀堞堙塄堠塥塬墁墉墚墀馨鼙懿艹艽艿芏芊芨芄芎芑芗芙芫芸芾芰苈苊苣芘芷芮苋苌苁芩芴芡芪芟苄苎芤苡茉苷苤茏茇苜苴苒苘茌苻苓茑茚茆茔茕苠苕茜荑荛荜茈莒茼茴茱莛荞茯荏荇荃荟荀茗荠茭茺茳荦荥"],
    ["dd40", "軥", 62],
    ["dd80", "輤", 32, "荨茛荩荬荪荭荮莰荸莳莴莠莪莓莜莅荼莶莩荽莸荻莘莞莨莺莼菁萁菥菘堇萘萋菝菽菖萜萸萑萆菔菟萏萃菸菹菪菅菀萦菰菡葜葑葚葙葳蒇蒈葺蒉葸萼葆葩葶蒌蒎萱葭蓁蓍蓐蓦蒽蓓蓊蒿蒺蓠蒡蒹蒴蒗蓥蓣蔌甍蔸蓰蔹蔟蔺"],
    ["de40", "轅", 32, "轪辀辌辒辝辠辡辢辤辥辦辧辪辬辭辮辯農辳辴辵辷辸辺辻込辿迀迃迆"],
    ["de80", "迉", 4, "迏迒迖迗迚迠迡迣迧迬迯迱迲迴迵迶迺迻迼迾迿逇逈逌逎逓逕逘蕖蔻蓿蓼蕙蕈蕨蕤蕞蕺瞢蕃蕲蕻薤薨薇薏蕹薮薜薅薹薷薰藓藁藜藿蘧蘅蘩蘖蘼廾弈夼奁耷奕奚奘匏尢尥尬尴扌扪抟抻拊拚拗拮挢拶挹捋捃掭揶捱捺掎掴捭掬掊捩掮掼揲揸揠揿揄揞揎摒揆掾摅摁搋搛搠搌搦搡摞撄摭撖"],
    ["df40", "這逜連逤逥逧", 5, "逰", 4, "逷逹逺逽逿遀遃遅遆遈", 4, "過達違遖遙遚遜", 5, "遤遦遧適遪遫遬遯", 4, "遶", 6, "遾邁"],
    ["df80", "還邅邆邇邉邊邌", 4, "邒邔邖邘邚邜邞邟邠邤邥邧邨邩邫邭邲邷邼邽邿郀摺撷撸撙撺擀擐擗擤擢攉攥攮弋忒甙弑卟叱叽叩叨叻吒吖吆呋呒呓呔呖呃吡呗呙吣吲咂咔呷呱呤咚咛咄呶呦咝哐咭哂咴哒咧咦哓哔呲咣哕咻咿哌哙哚哜咩咪咤哝哏哞唛哧唠哽唔哳唢唣唏唑唧唪啧喏喵啉啭啁啕唿啐唼"],
    ["e040", "郂郃郆郈郉郋郌郍郒郔郕郖郘郙郚郞郟郠郣郤郥郩郪郬郮郰郱郲郳郵郶郷郹郺郻郼郿鄀鄁鄃鄅", 19, "鄚鄛鄜"],
    ["e080", "鄝鄟鄠鄡鄤", 10, "鄰鄲", 6, "鄺", 8, "酄唷啖啵啶啷唳唰啜喋嗒喃喱喹喈喁喟啾嗖喑啻嗟喽喾喔喙嗪嗷嗉嘟嗑嗫嗬嗔嗦嗝嗄嗯嗥嗲嗳嗌嗍嗨嗵嗤辔嘞嘈嘌嘁嘤嘣嗾嘀嘧嘭噘嘹噗嘬噍噢噙噜噌噔嚆噤噱噫噻噼嚅嚓嚯囔囗囝囡囵囫囹囿圄圊圉圜帏帙帔帑帱帻帼"],
    ["e140", "酅酇酈酑酓酔酕酖酘酙酛酜酟酠酦酧酨酫酭酳酺酻酼醀", 4, "醆醈醊醎醏醓", 6, "醜", 5, "醤", 5, "醫醬醰醱醲醳醶醷醸醹醻"],
    ["e180", "醼", 10, "釈釋釐釒", 9, "針", 8, "帷幄幔幛幞幡岌屺岍岐岖岈岘岙岑岚岜岵岢岽岬岫岱岣峁岷峄峒峤峋峥崂崃崧崦崮崤崞崆崛嵘崾崴崽嵬嵛嵯嵝嵫嵋嵊嵩嵴嶂嶙嶝豳嶷巅彳彷徂徇徉後徕徙徜徨徭徵徼衢彡犭犰犴犷犸狃狁狎狍狒狨狯狩狲狴狷猁狳猃狺"],
    ["e240", "釦", 62],
    ["e280", "鈥", 32, "狻猗猓猡猊猞猝猕猢猹猥猬猸猱獐獍獗獠獬獯獾舛夥飧夤夂饣饧", 5, "饴饷饽馀馄馇馊馍馐馑馓馔馕庀庑庋庖庥庠庹庵庾庳赓廒廑廛廨廪膺忄忉忖忏怃忮怄忡忤忾怅怆忪忭忸怙怵怦怛怏怍怩怫怊怿怡恸恹恻恺恂"],
    ["e340", "鉆", 45, "鉵", 16],
    ["e380", "銆", 7, "銏", 24, "恪恽悖悚悭悝悃悒悌悛惬悻悱惝惘惆惚悴愠愦愕愣惴愀愎愫慊慵憬憔憧憷懔懵忝隳闩闫闱闳闵闶闼闾阃阄阆阈阊阋阌阍阏阒阕阖阗阙阚丬爿戕氵汔汜汊沣沅沐沔沌汨汩汴汶沆沩泐泔沭泷泸泱泗沲泠泖泺泫泮沱泓泯泾"],
    ["e440", "銨", 5, "銯", 24, "鋉", 31],
    ["e480", "鋩", 32, "洹洧洌浃浈洇洄洙洎洫浍洮洵洚浏浒浔洳涑浯涞涠浞涓涔浜浠浼浣渚淇淅淞渎涿淠渑淦淝淙渖涫渌涮渫湮湎湫溲湟溆湓湔渲渥湄滟溱溘滠漭滢溥溧溽溻溷滗溴滏溏滂溟潢潆潇漤漕滹漯漶潋潴漪漉漩澉澍澌潸潲潼潺濑"],
    ["e540", "錊", 51, "錿", 10],
    ["e580", "鍊", 31, "鍫濉澧澹澶濂濡濮濞濠濯瀚瀣瀛瀹瀵灏灞宀宄宕宓宥宸甯骞搴寤寮褰寰蹇謇辶迓迕迥迮迤迩迦迳迨逅逄逋逦逑逍逖逡逵逶逭逯遄遑遒遐遨遘遢遛暹遴遽邂邈邃邋彐彗彖彘尻咫屐屙孱屣屦羼弪弩弭艴弼鬻屮妁妃妍妩妪妣"],
    ["e640", "鍬", 34, "鎐", 27],
    ["e680", "鎬", 29, "鏋鏌鏍妗姊妫妞妤姒妲妯姗妾娅娆姝娈姣姘姹娌娉娲娴娑娣娓婀婧婊婕娼婢婵胬媪媛婷婺媾嫫媲嫒嫔媸嫠嫣嫱嫖嫦嫘嫜嬉嬗嬖嬲嬷孀尕尜孚孥孳孑孓孢驵驷驸驺驿驽骀骁骅骈骊骐骒骓骖骘骛骜骝骟骠骢骣骥骧纟纡纣纥纨纩"],
    ["e740", "鏎", 7, "鏗", 54],
    ["e780", "鐎", 32, "纭纰纾绀绁绂绉绋绌绐绔绗绛绠绡绨绫绮绯绱绲缍绶绺绻绾缁缂缃缇缈缋缌缏缑缒缗缙缜缛缟缡", 6, "缪缫缬缭缯", 4, "缵幺畿巛甾邕玎玑玮玢玟珏珂珑玷玳珀珉珈珥珙顼琊珩珧珞玺珲琏琪瑛琦琥琨琰琮琬"],
    ["e840", "鐯", 14, "鐿", 43, "鑬鑭鑮鑯"],
    ["e880", "鑰", 20, "钑钖钘铇铏铓铔铚铦铻锜锠琛琚瑁瑜瑗瑕瑙瑷瑭瑾璜璎璀璁璇璋璞璨璩璐璧瓒璺韪韫韬杌杓杞杈杩枥枇杪杳枘枧杵枨枞枭枋杷杼柰栉柘栊柩枰栌柙枵柚枳柝栀柃枸柢栎柁柽栲栳桠桡桎桢桄桤梃栝桕桦桁桧桀栾桊桉栩梵梏桴桷梓桫棂楮棼椟椠棹"],
    ["e940", "锧锳锽镃镈镋镕镚镠镮镴镵長", 7, "門", 42],
    ["e980", "閫", 32, "椤棰椋椁楗棣椐楱椹楠楂楝榄楫榀榘楸椴槌榇榈槎榉楦楣楹榛榧榻榫榭槔榱槁槊槟榕槠榍槿樯槭樗樘橥槲橄樾檠橐橛樵檎橹樽樨橘橼檑檐檩檗檫猷獒殁殂殇殄殒殓殍殚殛殡殪轫轭轱轲轳轵轶轸轷轹轺轼轾辁辂辄辇辋"],
    ["ea40", "闌", 27, "闬闿阇阓阘阛阞阠阣", 6, "阫阬阭阯阰阷阸阹阺阾陁陃陊陎陏陑陒陓陖陗"],
    ["ea80", "陘陙陚陜陝陞陠陣陥陦陫陭", 4, "陳陸", 12, "隇隉隊辍辎辏辘辚軎戋戗戛戟戢戡戥戤戬臧瓯瓴瓿甏甑甓攴旮旯旰昊昙杲昃昕昀炅曷昝昴昱昶昵耆晟晔晁晏晖晡晗晷暄暌暧暝暾曛曜曦曩贲贳贶贻贽赀赅赆赈赉赇赍赕赙觇觊觋觌觎觏觐觑牮犟牝牦牯牾牿犄犋犍犏犒挈挲掰"],
    ["eb40", "隌階隑隒隓隕隖隚際隝", 9, "隨", 7, "隱隲隴隵隷隸隺隻隿雂雃雈雊雋雐雑雓雔雖", 9, "雡", 6, "雫"],
    ["eb80", "雬雭雮雰雱雲雴雵雸雺電雼雽雿霂霃霅霊霋霌霐霑霒霔霕霗", 4, "霝霟霠搿擘耄毪毳毽毵毹氅氇氆氍氕氘氙氚氡氩氤氪氲攵敕敫牍牒牖爰虢刖肟肜肓肼朊肽肱肫肭肴肷胧胨胩胪胛胂胄胙胍胗朐胝胫胱胴胭脍脎胲胼朕脒豚脶脞脬脘脲腈腌腓腴腙腚腱腠腩腼腽腭腧塍媵膈膂膑滕膣膪臌朦臊膻"],
    ["ec40", "霡", 8, "霫霬霮霯霱霳", 4, "霺霻霼霽霿", 18, "靔靕靗靘靚靜靝靟靣靤靦靧靨靪", 7],
    ["ec80", "靲靵靷", 4, "靽", 7, "鞆", 4, "鞌鞎鞏鞐鞓鞕鞖鞗鞙", 4, "臁膦欤欷欹歃歆歙飑飒飓飕飙飚殳彀毂觳斐齑斓於旆旄旃旌旎旒旖炀炜炖炝炻烀炷炫炱烨烊焐焓焖焯焱煳煜煨煅煲煊煸煺熘熳熵熨熠燠燔燧燹爝爨灬焘煦熹戾戽扃扈扉礻祀祆祉祛祜祓祚祢祗祠祯祧祺禅禊禚禧禳忑忐"],
    ["ed40", "鞞鞟鞡鞢鞤", 6, "鞬鞮鞰鞱鞳鞵", 46],
    ["ed80", "韤韥韨韮", 4, "韴韷", 23, "怼恝恚恧恁恙恣悫愆愍慝憩憝懋懑戆肀聿沓泶淼矶矸砀砉砗砘砑斫砭砜砝砹砺砻砟砼砥砬砣砩硎硭硖硗砦硐硇硌硪碛碓碚碇碜碡碣碲碹碥磔磙磉磬磲礅磴礓礤礞礴龛黹黻黼盱眄眍盹眇眈眚眢眙眭眦眵眸睐睑睇睃睚睨"],
    ["ee40", "頏", 62],
    ["ee80", "顎", 32, "睢睥睿瞍睽瞀瞌瞑瞟瞠瞰瞵瞽町畀畎畋畈畛畲畹疃罘罡罟詈罨罴罱罹羁罾盍盥蠲钅钆钇钋钊钌钍钏钐钔钗钕钚钛钜钣钤钫钪钭钬钯钰钲钴钶", 4, "钼钽钿铄铈", 6, "铐铑铒铕铖铗铙铘铛铞铟铠铢铤铥铧铨铪"],
    ["ef40", "顯", 5, "颋颎颒颕颙颣風", 37, "飏飐飔飖飗飛飜飝飠", 4],
    ["ef80", "飥飦飩", 30, "铩铫铮铯铳铴铵铷铹铼铽铿锃锂锆锇锉锊锍锎锏锒", 4, "锘锛锝锞锟锢锪锫锩锬锱锲锴锶锷锸锼锾锿镂锵镄镅镆镉镌镎镏镒镓镔镖镗镘镙镛镞镟镝镡镢镤", 8, "镯镱镲镳锺矧矬雉秕秭秣秫稆嵇稃稂稞稔"],
    ["f040", "餈", 4, "餎餏餑", 28, "餯", 26],
    ["f080", "饊", 9, "饖", 12, "饤饦饳饸饹饻饾馂馃馉稹稷穑黏馥穰皈皎皓皙皤瓞瓠甬鸠鸢鸨", 4, "鸲鸱鸶鸸鸷鸹鸺鸾鹁鹂鹄鹆鹇鹈鹉鹋鹌鹎鹑鹕鹗鹚鹛鹜鹞鹣鹦", 6, "鹱鹭鹳疒疔疖疠疝疬疣疳疴疸痄疱疰痃痂痖痍痣痨痦痤痫痧瘃痱痼痿瘐瘀瘅瘌瘗瘊瘥瘘瘕瘙"],
    ["f140", "馌馎馚", 10, "馦馧馩", 47],
    ["f180", "駙", 32, "瘛瘼瘢瘠癀瘭瘰瘿瘵癃瘾瘳癍癞癔癜癖癫癯翊竦穸穹窀窆窈窕窦窠窬窨窭窳衤衩衲衽衿袂袢裆袷袼裉裢裎裣裥裱褚裼裨裾裰褡褙褓褛褊褴褫褶襁襦襻疋胥皲皴矜耒耔耖耜耠耢耥耦耧耩耨耱耋耵聃聆聍聒聩聱覃顸颀颃"],
    ["f240", "駺", 62],
    ["f280", "騹", 32, "颉颌颍颏颔颚颛颞颟颡颢颥颦虍虔虬虮虿虺虼虻蚨蚍蚋蚬蚝蚧蚣蚪蚓蚩蚶蛄蚵蛎蚰蚺蚱蚯蛉蛏蚴蛩蛱蛲蛭蛳蛐蜓蛞蛴蛟蛘蛑蜃蜇蛸蜈蜊蜍蜉蜣蜻蜞蜥蜮蜚蜾蝈蜴蜱蜩蜷蜿螂蜢蝽蝾蝻蝠蝰蝌蝮螋蝓蝣蝼蝤蝙蝥螓螯螨蟒"],
    ["f340", "驚", 17, "驲骃骉骍骎骔骕骙骦骩", 6, "骲骳骴骵骹骻骽骾骿髃髄髆", 4, "髍髎髏髐髒體髕髖髗髙髚髛髜"],
    ["f380", "髝髞髠髢髣髤髥髧髨髩髪髬髮髰", 8, "髺髼", 6, "鬄鬅鬆蟆螈螅螭螗螃螫蟥螬螵螳蟋蟓螽蟑蟀蟊蟛蟪蟠蟮蠖蠓蟾蠊蠛蠡蠹蠼缶罂罄罅舐竺竽笈笃笄笕笊笫笏筇笸笪笙笮笱笠笥笤笳笾笞筘筚筅筵筌筝筠筮筻筢筲筱箐箦箧箸箬箝箨箅箪箜箢箫箴篑篁篌篝篚篥篦篪簌篾篼簏簖簋"],
    ["f440", "鬇鬉", 5, "鬐鬑鬒鬔", 10, "鬠鬡鬢鬤", 10, "鬰鬱鬳", 7, "鬽鬾鬿魀魆魊魋魌魎魐魒魓魕", 5],
    ["f480", "魛", 32, "簟簪簦簸籁籀臾舁舂舄臬衄舡舢舣舭舯舨舫舸舻舳舴舾艄艉艋艏艚艟艨衾袅袈裘裟襞羝羟羧羯羰羲籼敉粑粝粜粞粢粲粼粽糁糇糌糍糈糅糗糨艮暨羿翎翕翥翡翦翩翮翳糸絷綦綮繇纛麸麴赳趄趔趑趱赧赭豇豉酊酐酎酏酤"],
    ["f540", "魼", 62],
    ["f580", "鮻", 32, "酢酡酰酩酯酽酾酲酴酹醌醅醐醍醑醢醣醪醭醮醯醵醴醺豕鹾趸跫踅蹙蹩趵趿趼趺跄跖跗跚跞跎跏跛跆跬跷跸跣跹跻跤踉跽踔踝踟踬踮踣踯踺蹀踹踵踽踱蹉蹁蹂蹑蹒蹊蹰蹶蹼蹯蹴躅躏躔躐躜躞豸貂貊貅貘貔斛觖觞觚觜"],
    ["f640", "鯜", 62],
    ["f680", "鰛", 32, "觥觫觯訾謦靓雩雳雯霆霁霈霏霎霪霭霰霾龀龃龅", 5, "龌黾鼋鼍隹隼隽雎雒瞿雠銎銮鋈錾鍪鏊鎏鐾鑫鱿鲂鲅鲆鲇鲈稣鲋鲎鲐鲑鲒鲔鲕鲚鲛鲞", 5, "鲥", 4, "鲫鲭鲮鲰", 7, "鲺鲻鲼鲽鳄鳅鳆鳇鳊鳋"],
    ["f740", "鰼", 62],
    ["f780", "鱻鱽鱾鲀鲃鲄鲉鲊鲌鲏鲓鲖鲗鲘鲙鲝鲪鲬鲯鲹鲾", 4, "鳈鳉鳑鳒鳚鳛鳠鳡鳌", 4, "鳓鳔鳕鳗鳘鳙鳜鳝鳟鳢靼鞅鞑鞒鞔鞯鞫鞣鞲鞴骱骰骷鹘骶骺骼髁髀髅髂髋髌髑魅魃魇魉魈魍魑飨餍餮饕饔髟髡髦髯髫髻髭髹鬈鬏鬓鬟鬣麽麾縻麂麇麈麋麒鏖麝麟黛黜黝黠黟黢黩黧黥黪黯鼢鼬鼯鼹鼷鼽鼾齄"],
    ["f840", "鳣", 62],
    ["f880", "鴢", 32],
    ["f940", "鵃", 62],
    ["f980", "鶂", 32],
    ["fa40", "鶣", 62],
    ["fa80", "鷢", 32],
    ["fb40", "鸃", 27, "鸤鸧鸮鸰鸴鸻鸼鹀鹍鹐鹒鹓鹔鹖鹙鹝鹟鹠鹡鹢鹥鹮鹯鹲鹴", 9, "麀"],
    ["fb80", "麁麃麄麅麆麉麊麌", 5, "麔", 8, "麞麠", 5, "麧麨麩麪"],
    ["fc40", "麫", 8, "麵麶麷麹麺麼麿", 4, "黅黆黇黈黊黋黌黐黒黓黕黖黗黙黚點黡黣黤黦黨黫黬黭黮黰", 8, "黺黽黿", 6],
    ["fc80", "鼆", 4, "鼌鼏鼑鼒鼔鼕鼖鼘鼚", 5, "鼡鼣", 8, "鼭鼮鼰鼱"],
    ["fd40", "鼲", 4, "鼸鼺鼼鼿", 4, "齅", 10, "齒", 38],
    ["fd80", "齹", 5, "龁龂龍", 11, "龜龝龞龡", 4, "郎凉秊裏隣"],
    ["fe40", "兀嗀﨎﨏﨑﨓﨔礼﨟蘒﨡﨣﨤﨧﨨﨩"]
  ];
});

// node_modules/iconv-lite/encodings/tables/gbk-added.json
var require_gbk_added = __commonJS((exports, module) => {
  module.exports = [
    ["a140", "", 62],
    ["a180", "", 32],
    ["a240", "", 62],
    ["a280", "", 32],
    ["a2ab", "", 5],
    ["a2e3", "€"],
    ["a2ef", ""],
    ["a2fd", ""],
    ["a340", "", 62],
    ["a380", "", 31, "　"],
    ["a440", "", 62],
    ["a480", "", 32],
    ["a4f4", "", 10],
    ["a540", "", 62],
    ["a580", "", 32],
    ["a5f7", "", 7],
    ["a640", "", 62],
    ["a680", "", 32],
    ["a6b9", "", 7],
    ["a6d9", "", 6],
    ["a6ec", ""],
    ["a6f3", ""],
    ["a6f6", "", 8],
    ["a740", "", 62],
    ["a780", "", 32],
    ["a7c2", "", 14],
    ["a7f2", "", 12],
    ["a896", "", 10],
    ["a8bc", ""],
    ["a8bf", "ǹ"],
    ["a8c1", ""],
    ["a8ea", "", 20],
    ["a958", ""],
    ["a95b", ""],
    ["a95d", ""],
    ["a989", "〾⿰", 11],
    ["a997", "", 12],
    ["a9f0", "", 14],
    ["aaa1", "", 93],
    ["aba1", "", 93],
    ["aca1", "", 93],
    ["ada1", "", 93],
    ["aea1", "", 93],
    ["afa1", "", 93],
    ["d7fa", "", 4],
    ["f8a1", "", 93],
    ["f9a1", "", 93],
    ["faa1", "", 93],
    ["fba1", "", 93],
    ["fca1", "", 93],
    ["fda1", "", 93],
    ["fe50", "⺁⺄㑳㑇⺈⺋㖞㘚㘎⺌⺗㥮㤘㧏㧟㩳㧐㭎㱮㳠⺧⺪䁖䅟⺮䌷⺳⺶⺷䎱䎬⺻䏝䓖䙡䙌"],
    ["fe80", "䜣䜩䝼䞍⻊䥇䥺䥽䦂䦃䦅䦆䦟䦛䦷䦶䲣䲟䲠䲡䱷䲢䴓", 6, "䶮", 93]
  ];
});

// node_modules/iconv-lite/encodings/tables/gb18030-ranges.json
var require_gb18030_ranges = __commonJS((exports, module) => {
  module.exports = { uChars: [128, 165, 169, 178, 184, 216, 226, 235, 238, 244, 248, 251, 253, 258, 276, 284, 300, 325, 329, 334, 364, 463, 465, 467, 469, 471, 473, 475, 477, 506, 594, 610, 712, 716, 730, 930, 938, 962, 970, 1026, 1104, 1106, 8209, 8215, 8218, 8222, 8231, 8241, 8244, 8246, 8252, 8365, 8452, 8454, 8458, 8471, 8482, 8556, 8570, 8596, 8602, 8713, 8720, 8722, 8726, 8731, 8737, 8740, 8742, 8748, 8751, 8760, 8766, 8777, 8781, 8787, 8802, 8808, 8816, 8854, 8858, 8870, 8896, 8979, 9322, 9372, 9548, 9588, 9616, 9622, 9634, 9652, 9662, 9672, 9676, 9680, 9702, 9735, 9738, 9793, 9795, 11906, 11909, 11913, 11917, 11928, 11944, 11947, 11951, 11956, 11960, 11964, 11979, 12284, 12292, 12312, 12319, 12330, 12351, 12436, 12447, 12535, 12543, 12586, 12842, 12850, 12964, 13200, 13215, 13218, 13253, 13263, 13267, 13270, 13384, 13428, 13727, 13839, 13851, 14617, 14703, 14801, 14816, 14964, 15183, 15471, 15585, 16471, 16736, 17208, 17325, 17330, 17374, 17623, 17997, 18018, 18212, 18218, 18301, 18318, 18760, 18811, 18814, 18820, 18823, 18844, 18848, 18872, 19576, 19620, 19738, 19887, 40870, 59244, 59336, 59367, 59413, 59417, 59423, 59431, 59437, 59443, 59452, 59460, 59478, 59493, 63789, 63866, 63894, 63976, 63986, 64016, 64018, 64021, 64025, 64034, 64037, 64042, 65074, 65093, 65107, 65112, 65127, 65132, 65375, 65510, 65536], gbChars: [0, 36, 38, 45, 50, 81, 89, 95, 96, 100, 103, 104, 105, 109, 126, 133, 148, 172, 175, 179, 208, 306, 307, 308, 309, 310, 311, 312, 313, 341, 428, 443, 544, 545, 558, 741, 742, 749, 750, 805, 819, 820, 7922, 7924, 7925, 7927, 7934, 7943, 7944, 7945, 7950, 8062, 8148, 8149, 8152, 8164, 8174, 8236, 8240, 8262, 8264, 8374, 8380, 8381, 8384, 8388, 8390, 8392, 8393, 8394, 8396, 8401, 8406, 8416, 8419, 8424, 8437, 8439, 8445, 8482, 8485, 8496, 8521, 8603, 8936, 8946, 9046, 9050, 9063, 9066, 9076, 9092, 9100, 9108, 9111, 9113, 9131, 9162, 9164, 9218, 9219, 11329, 11331, 11334, 11336, 11346, 11361, 11363, 11366, 11370, 11372, 11375, 11389, 11682, 11686, 11687, 11692, 11694, 11714, 11716, 11723, 11725, 11730, 11736, 11982, 11989, 12102, 12336, 12348, 12350, 12384, 12393, 12395, 12397, 12510, 12553, 12851, 12962, 12973, 13738, 13823, 13919, 13933, 14080, 14298, 14585, 14698, 15583, 15847, 16318, 16434, 16438, 16481, 16729, 17102, 17122, 17315, 17320, 17402, 17418, 17859, 17909, 17911, 17915, 17916, 17936, 17939, 17961, 18664, 18703, 18814, 18962, 19043, 33469, 33470, 33471, 33484, 33485, 33490, 33497, 33501, 33505, 33513, 33520, 33536, 33550, 37845, 37921, 37948, 38029, 38038, 38064, 38065, 38066, 38069, 38075, 38076, 38078, 39108, 39109, 39113, 39114, 39115, 39116, 39265, 39394, 189000] };
});

// node_modules/iconv-lite/encodings/tables/cp949.json
var require_cp949 = __commonJS((exports, module) => {
  module.exports = [
    ["0", "\x00", 127],
    ["8141", "갂갃갅갆갋", 4, "갘갞갟갡갢갣갥", 6, "갮갲갳갴"],
    ["8161", "갵갶갷갺갻갽갾갿걁", 9, "걌걎", 5, "걕"],
    ["8181", "걖걗걙걚걛걝", 18, "걲걳걵걶걹걻", 4, "겂겇겈겍겎겏겑겒겓겕", 6, "겞겢", 5, "겫겭겮겱", 6, "겺겾겿곀곂곃곅곆곇곉곊곋곍", 7, "곖곘", 7, "곢곣곥곦곩곫곭곮곲곴곷", 4, "곾곿괁괂괃괅괇", 4, "괎괐괒괓"],
    ["8241", "괔괕괖괗괙괚괛괝괞괟괡", 7, "괪괫괮", 5],
    ["8261", "괶괷괹괺괻괽", 6, "굆굈굊", 5, "굑굒굓굕굖굗"],
    ["8281", "굙", 7, "굢굤", 7, "굮굯굱굲굷굸굹굺굾궀궃", 4, "궊궋궍궎궏궑", 10, "궞", 5, "궥", 17, "궸", 7, "귂귃귅귆귇귉", 6, "귒귔", 7, "귝귞귟귡귢귣귥", 18],
    ["8341", "귺귻귽귾긂", 5, "긊긌긎", 5, "긕", 7],
    ["8361", "긝", 18, "긲긳긵긶긹긻긼"],
    ["8381", "긽긾긿깂깄깇깈깉깋깏깑깒깓깕깗", 4, "깞깢깣깤깦깧깪깫깭깮깯깱", 6, "깺깾", 5, "꺆", 5, "꺍", 46, "꺿껁껂껃껅", 6, "껎껒", 5, "껚껛껝", 8],
    ["8441", "껦껧껩껪껬껮", 5, "껵껶껷껹껺껻껽", 8],
    ["8461", "꼆꼉꼊꼋꼌꼎꼏꼑", 18],
    ["8481", "꼤", 7, "꼮꼯꼱꼳꼵", 6, "꼾꽀꽄꽅꽆꽇꽊", 5, "꽑", 10, "꽞", 5, "꽦", 18, "꽺", 5, "꾁꾂꾃꾅꾆꾇꾉", 6, "꾒꾓꾔꾖", 5, "꾝", 26, "꾺꾻꾽꾾"],
    ["8541", "꾿꿁", 5, "꿊꿌꿏", 4, "꿕", 6, "꿝", 4],
    ["8561", "꿢", 5, "꿪", 5, "꿲꿳꿵꿶꿷꿹", 6, "뀂뀃"],
    ["8581", "뀅", 6, "뀍뀎뀏뀑뀒뀓뀕", 6, "뀞", 9, "뀩", 26, "끆끇끉끋끍끏끐끑끒끖끘끚끛끜끞", 29, "끾끿낁낂낃낅", 6, "낎낐낒", 5, "낛낝낞낣낤"],
    ["8641", "낥낦낧낪낰낲낶낷낹낺낻낽", 6, "냆냊", 5, "냒"],
    ["8661", "냓냕냖냗냙", 6, "냡냢냣냤냦", 10],
    ["8681", "냱", 22, "넊넍넎넏넑넔넕넖넗넚넞", 4, "넦넧넩넪넫넭", 6, "넶넺", 5, "녂녃녅녆녇녉", 6, "녒녓녖녗녙녚녛녝녞녟녡", 22, "녺녻녽녾녿놁놃", 4, "놊놌놎놏놐놑놕놖놗놙놚놛놝"],
    ["8741", "놞", 9, "놩", 15],
    ["8761", "놹", 18, "뇍뇎뇏뇑뇒뇓뇕"],
    ["8781", "뇖", 5, "뇞뇠", 7, "뇪뇫뇭뇮뇯뇱", 7, "뇺뇼뇾", 5, "눆눇눉눊눍", 6, "눖눘눚", 5, "눡", 18, "눵", 6, "눽", 26, "뉙뉚뉛뉝뉞뉟뉡", 6, "뉪", 4],
    ["8841", "뉯", 4, "뉶", 5, "뉽", 6, "늆늇늈늊", 4],
    ["8861", "늏늒늓늕늖늗늛", 4, "늢늤늧늨늩늫늭늮늯늱늲늳늵늶늷"],
    ["8881", "늸", 15, "닊닋닍닎닏닑닓", 4, "닚닜닞닟닠닡닣닧닩닪닰닱닲닶닼닽닾댂댃댅댆댇댉", 6, "댒댖", 5, "댝", 54, "덗덙덚덝덠덡덢덣"],
    ["8941", "덦덨덪덬덭덯덲덳덵덶덷덹", 6, "뎂뎆", 5, "뎍"],
    ["8961", "뎎뎏뎑뎒뎓뎕", 10, "뎢", 5, "뎩뎪뎫뎭"],
    ["8981", "뎮", 21, "돆돇돉돊돍돏돑돒돓돖돘돚돜돞돟돡돢돣돥돦돧돩", 18, "돽", 18, "됑", 6, "됙됚됛됝됞됟됡", 6, "됪됬", 7, "됵", 15],
    ["8a41", "둅", 10, "둒둓둕둖둗둙", 6, "둢둤둦"],
    ["8a61", "둧", 4, "둭", 18, "뒁뒂"],
    ["8a81", "뒃", 4, "뒉", 19, "뒞", 5, "뒥뒦뒧뒩뒪뒫뒭", 7, "뒶뒸뒺", 5, "듁듂듃듅듆듇듉", 6, "듑듒듓듔듖", 5, "듞듟듡듢듥듧", 4, "듮듰듲", 5, "듹", 26, "딖딗딙딚딝"],
    ["8b41", "딞", 5, "딦딫", 4, "딲딳딵딶딷딹", 6, "땂땆"],
    ["8b61", "땇땈땉땊땎땏땑땒땓땕", 6, "땞땢", 8],
    ["8b81", "땫", 52, "떢떣떥떦떧떩떬떭떮떯떲떶", 4, "떾떿뗁뗂뗃뗅", 6, "뗎뗒", 5, "뗙", 18, "뗭", 18],
    ["8c41", "똀", 15, "똒똓똕똖똗똙", 4],
    ["8c61", "똞", 6, "똦", 5, "똭", 6, "똵", 5],
    ["8c81", "똻", 12, "뙉", 26, "뙥뙦뙧뙩", 50, "뚞뚟뚡뚢뚣뚥", 5, "뚭뚮뚯뚰뚲", 16],
    ["8d41", "뛃", 16, "뛕", 8],
    ["8d61", "뛞", 17, "뛱뛲뛳뛵뛶뛷뛹뛺"],
    ["8d81", "뛻", 4, "뜂뜃뜄뜆", 33, "뜪뜫뜭뜮뜱", 6, "뜺뜼", 7, "띅띆띇띉띊띋띍", 6, "띖", 9, "띡띢띣띥띦띧띩", 6, "띲띴띶", 5, "띾띿랁랂랃랅", 6, "랎랓랔랕랚랛랝랞"],
    ["8e41", "랟랡", 6, "랪랮", 5, "랶랷랹", 8],
    ["8e61", "럂", 4, "럈럊", 19],
    ["8e81", "럞", 13, "럮럯럱럲럳럵", 6, "럾렂", 4, "렊렋렍렎렏렑", 6, "렚렜렞", 5, "렦렧렩렪렫렭", 6, "렶렺", 5, "롁롂롃롅", 11, "롒롔", 7, "롞롟롡롢롣롥", 6, "롮롰롲", 5, "롹롺롻롽", 7],
    ["8f41", "뢅", 7, "뢎", 17],
    ["8f61", "뢠", 7, "뢩", 6, "뢱뢲뢳뢵뢶뢷뢹", 4],
    ["8f81", "뢾뢿룂룄룆", 5, "룍룎룏룑룒룓룕", 7, "룞룠룢", 5, "룪룫룭룮룯룱", 6, "룺룼룾", 5, "뤅", 18, "뤙", 6, "뤡", 26, "뤾뤿륁륂륃륅", 6, "륍륎륐륒", 5],
    ["9041", "륚륛륝륞륟륡", 6, "륪륬륮", 5, "륶륷륹륺륻륽"],
    ["9061", "륾", 5, "릆릈릋릌릏", 15],
    ["9081", "릟", 12, "릮릯릱릲릳릵", 6, "릾맀맂", 5, "맊맋맍맓", 4, "맚맜맟맠맢맦맧맩맪맫맭", 6, "맶맻", 4, "먂", 5, "먉", 11, "먖", 33, "먺먻먽먾먿멁멃멄멅멆"],
    ["9141", "멇멊멌멏멐멑멒멖멗멙멚멛멝", 6, "멦멪", 5],
    ["9161", "멲멳멵멶멷멹", 9, "몆몈몉몊몋몍", 5],
    ["9181", "몓", 20, "몪몭몮몯몱몳", 4, "몺몼몾", 5, "뫅뫆뫇뫉", 14, "뫚", 33, "뫽뫾뫿묁묂묃묅", 7, "묎묐묒", 5, "묙묚묛묝묞묟묡", 6],
    ["9241", "묨묪묬", 7, "묷묹묺묿", 4, "뭆뭈뭊뭋뭌뭎뭑뭒"],
    ["9261", "뭓뭕뭖뭗뭙", 7, "뭢뭤", 7, "뭭", 4],
    ["9281", "뭲", 21, "뮉뮊뮋뮍뮎뮏뮑", 18, "뮥뮦뮧뮩뮪뮫뮭", 6, "뮵뮶뮸", 7, "믁믂믃믅믆믇믉", 6, "믑믒믔", 35, "믺믻믽믾밁"],
    ["9341", "밃", 4, "밊밎밐밒밓밙밚밠밡밢밣밦밨밪밫밬밮밯밲밳밵"],
    ["9361", "밶밷밹", 6, "뱂뱆뱇뱈뱊뱋뱎뱏뱑", 8],
    ["9381", "뱚뱛뱜뱞", 37, "벆벇벉벊벍벏", 4, "벖벘벛", 4, "벢벣벥벦벩", 6, "벲벶", 5, "벾벿볁볂볃볅", 7, "볎볒볓볔볖볗볙볚볛볝", 22, "볷볹볺볻볽"],
    ["9441", "볾", 5, "봆봈봊", 5, "봑봒봓봕", 8],
    ["9461", "봞", 5, "봥", 6, "봭", 12],
    ["9481", "봺", 5, "뵁", 6, "뵊뵋뵍뵎뵏뵑", 6, "뵚", 9, "뵥뵦뵧뵩", 22, "붂붃붅붆붋", 4, "붒붔붖붗붘붛붝", 6, "붥", 10, "붱", 6, "붹", 24],
    ["9541", "뷒뷓뷖뷗뷙뷚뷛뷝", 11, "뷪", 5, "뷱"],
    ["9561", "뷲뷳뷵뷶뷷뷹", 6, "븁븂븄븆", 5, "븎븏븑븒븓"],
    ["9581", "븕", 6, "븞븠", 35, "빆빇빉빊빋빍빏", 4, "빖빘빜빝빞빟빢빣빥빦빧빩빫", 4, "빲빶", 4, "빾빿뺁뺂뺃뺅", 6, "뺎뺒", 5, "뺚", 13, "뺩", 14],
    ["9641", "뺸", 23, "뻒뻓"],
    ["9661", "뻕뻖뻙", 6, "뻡뻢뻦", 5, "뻭", 8],
    ["9681", "뻶", 10, "뼂", 5, "뼊", 13, "뼚뼞", 33, "뽂뽃뽅뽆뽇뽉", 6, "뽒뽓뽔뽖", 44],
    ["9741", "뾃", 16, "뾕", 8],
    ["9761", "뾞", 17, "뾱", 7],
    ["9781", "뾹", 11, "뿆", 5, "뿎뿏뿑뿒뿓뿕", 6, "뿝뿞뿠뿢", 89, "쀽쀾쀿"],
    ["9841", "쁀", 16, "쁒", 5, "쁙쁚쁛"],
    ["9861", "쁝쁞쁟쁡", 6, "쁪", 15],
    ["9881", "쁺", 21, "삒삓삕삖삗삙", 6, "삢삤삦", 5, "삮삱삲삷", 4, "삾샂샃샄샆샇샊샋샍샎샏샑", 6, "샚샞", 5, "샦샧샩샪샫샭", 6, "샶샸샺", 5, "섁섂섃섅섆섇섉", 6, "섑섒섓섔섖", 5, "섡섢섥섨섩섪섫섮"],
    ["9941", "섲섳섴섵섷섺섻섽섾섿셁", 6, "셊셎", 5, "셖셗"],
    ["9961", "셙셚셛셝", 6, "셦셪", 5, "셱셲셳셵셶셷셹셺셻"],
    ["9981", "셼", 8, "솆", 5, "솏솑솒솓솕솗", 4, "솞솠솢솣솤솦솧솪솫솭솮솯솱", 11, "솾", 5, "쇅쇆쇇쇉쇊쇋쇍", 6, "쇕쇖쇙", 6, "쇡쇢쇣쇥쇦쇧쇩", 6, "쇲쇴", 7, "쇾쇿숁숂숃숅", 6, "숎숐숒", 5, "숚숛숝숞숡숢숣"],
    ["9a41", "숤숥숦숧숪숬숮숰숳숵", 16],
    ["9a61", "쉆쉇쉉", 6, "쉒쉓쉕쉖쉗쉙", 6, "쉡쉢쉣쉤쉦"],
    ["9a81", "쉧", 4, "쉮쉯쉱쉲쉳쉵", 6, "쉾슀슂", 5, "슊", 5, "슑", 6, "슙슚슜슞", 5, "슦슧슩슪슫슮", 5, "슶슸슺", 33, "싞싟싡싢싥", 5, "싮싰싲싳싴싵싷싺싽싾싿쌁", 6, "쌊쌋쌎쌏"],
    ["9b41", "쌐쌑쌒쌖쌗쌙쌚쌛쌝", 6, "쌦쌧쌪", 8],
    ["9b61", "쌳", 17, "썆", 7],
    ["9b81", "썎", 25, "썪썫썭썮썯썱썳", 4, "썺썻썾", 5, "쎅쎆쎇쎉쎊쎋쎍", 50, "쏁", 22, "쏚"],
    ["9c41", "쏛쏝쏞쏡쏣", 4, "쏪쏫쏬쏮", 5, "쏶쏷쏹", 5],
    ["9c61", "쏿", 8, "쐉", 6, "쐑", 9],
    ["9c81", "쐛", 8, "쐥", 6, "쐭쐮쐯쐱쐲쐳쐵", 6, "쐾", 9, "쑉", 26, "쑦쑧쑩쑪쑫쑭", 6, "쑶쑷쑸쑺", 5, "쒁", 18, "쒕", 6, "쒝", 12],
    ["9d41", "쒪", 13, "쒹쒺쒻쒽", 8],
    ["9d61", "쓆", 25],
    ["9d81", "쓠", 8, "쓪", 5, "쓲쓳쓵쓶쓷쓹쓻쓼쓽쓾씂", 9, "씍씎씏씑씒씓씕", 6, "씝", 10, "씪씫씭씮씯씱", 6, "씺씼씾", 5, "앆앇앋앏앐앑앒앖앚앛앜앟앢앣앥앦앧앩", 6, "앲앶", 5, "앾앿얁얂얃얅얆얈얉얊얋얎얐얒얓얔"],
    ["9e41", "얖얙얚얛얝얞얟얡", 7, "얪", 9, "얶"],
    ["9e61", "얷얺얿", 4, "엋엍엏엒엓엕엖엗엙", 6, "엢엤엦엧"],
    ["9e81", "엨엩엪엫엯엱엲엳엵엸엹엺엻옂옃옄옉옊옋옍옎옏옑", 6, "옚옝", 6, "옦옧옩옪옫옯옱옲옶옸옺옼옽옾옿왂왃왅왆왇왉", 6, "왒왖", 5, "왞왟왡", 10, "왭왮왰왲", 5, "왺왻왽왾왿욁", 6, "욊욌욎", 5, "욖욗욙욚욛욝", 6, "욦"],
    ["9f41", "욨욪", 5, "욲욳욵욶욷욻", 4, "웂웄웆", 5, "웎"],
    ["9f61", "웏웑웒웓웕", 6, "웞웟웢", 5, "웪웫웭웮웯웱웲"],
    ["9f81", "웳", 4, "웺웻웼웾", 5, "윆윇윉윊윋윍", 6, "윖윘윚", 5, "윢윣윥윦윧윩", 6, "윲윴윶윸윹윺윻윾윿읁읂읃읅", 4, "읋읎읐읙읚읛읝읞읟읡", 6, "읩읪읬", 7, "읶읷읹읺읻읿잀잁잂잆잋잌잍잏잒잓잕잙잛", 4, "잢잧", 4, "잮잯잱잲잳잵잶잷"],
    ["a041", "잸잹잺잻잾쟂", 5, "쟊쟋쟍쟏쟑", 6, "쟙쟚쟛쟜"],
    ["a061", "쟞", 5, "쟥쟦쟧쟩쟪쟫쟭", 13],
    ["a081", "쟻", 4, "젂젃젅젆젇젉젋", 4, "젒젔젗", 4, "젞젟젡젢젣젥", 6, "젮젰젲", 5, "젹젺젻젽젾젿졁", 6, "졊졋졎", 5, "졕", 26, "졲졳졵졶졷졹졻", 4, "좂좄좈좉좊좎", 5, "좕", 7, "좞좠좢좣좤"],
    ["a141", "좥좦좧좩", 18, "좾좿죀죁"],
    ["a161", "죂죃죅죆죇죉죊죋죍", 6, "죖죘죚", 5, "죢죣죥"],
    ["a181", "죦", 14, "죶", 5, "죾죿줁줂줃줇", 4, "줎　、。·‥…¨〃­―∥＼∼‘’“”〔〕〈", 9, "±×÷≠≤≥∞∴°′″℃Å￠￡￥♂♀∠⊥⌒∂∇≡≒§※☆★○●◎◇◆□■△▲▽▼→←↑↓↔〓≪≫√∽∝∵∫∬∈∋⊆⊇⊂⊃∪∩∧∨￢"],
    ["a241", "줐줒", 5, "줙", 18],
    ["a261", "줭", 6, "줵", 18],
    ["a281", "쥈", 7, "쥒쥓쥕쥖쥗쥙", 6, "쥢쥤", 7, "쥭쥮쥯⇒⇔∀∃´～ˇ˘˝˚˙¸˛¡¿ː∮∑∏¤℉‰◁◀▷▶♤♠♡♥♧♣⊙◈▣◐◑▒▤▥▨▧▦▩♨☏☎☜☞¶†‡↕↗↙↖↘♭♩♪♬㉿㈜№㏇™㏂㏘℡€®"],
    ["a341", "쥱쥲쥳쥵", 6, "쥽", 10, "즊즋즍즎즏"],
    ["a361", "즑", 6, "즚즜즞", 16],
    ["a381", "즯", 16, "짂짃짅짆짉짋", 4, "짒짔짗짘짛！", 58, "￦］", 32, "￣"],
    ["a441", "짞짟짡짣짥짦짨짩짪짫짮짲", 5, "짺짻짽짾짿쨁쨂쨃쨄"],
    ["a461", "쨅쨆쨇쨊쨎", 5, "쨕쨖쨗쨙", 12],
    ["a481", "쨦쨧쨨쨪", 28, "ㄱ", 93],
    ["a541", "쩇", 4, "쩎쩏쩑쩒쩓쩕", 6, "쩞쩢", 5, "쩩쩪"],
    ["a561", "쩫", 17, "쩾", 5, "쪅쪆"],
    ["a581", "쪇", 16, "쪙", 14, "ⅰ", 9],
    ["a5b0", "Ⅰ", 9],
    ["a5c1", "Α", 16, "Σ", 6],
    ["a5e1", "α", 16, "σ", 6],
    ["a641", "쪨", 19, "쪾쪿쫁쫂쫃쫅"],
    ["a661", "쫆", 5, "쫎쫐쫒쫔쫕쫖쫗쫚", 5, "쫡", 6],
    ["a681", "쫨쫩쫪쫫쫭", 6, "쫵", 18, "쬉쬊─│┌┐┘└├┬┤┴┼━┃┏┓┛┗┣┳┫┻╋┠┯┨┷┿┝┰┥┸╂┒┑┚┙┖┕┎┍┞┟┡┢┦┧┩┪┭┮┱┲┵┶┹┺┽┾╀╁╃", 7],
    ["a741", "쬋", 4, "쬑쬒쬓쬕쬖쬗쬙", 6, "쬢", 7],
    ["a761", "쬪", 22, "쭂쭃쭄"],
    ["a781", "쭅쭆쭇쭊쭋쭍쭎쭏쭑", 6, "쭚쭛쭜쭞", 5, "쭥", 7, "㎕㎖㎗ℓ㎘㏄㎣㎤㎥㎦㎙", 9, "㏊㎍㎎㎏㏏㎈㎉㏈㎧㎨㎰", 9, "㎀", 4, "㎺", 5, "㎐", 4, "Ω㏀㏁㎊㎋㎌㏖㏅㎭㎮㎯㏛㎩㎪㎫㎬㏝㏐㏓㏃㏉㏜㏆"],
    ["a841", "쭭", 10, "쭺", 14],
    ["a861", "쮉", 18, "쮝", 6],
    ["a881", "쮤", 19, "쮹", 11, "ÆÐªĦ"],
    ["a8a6", "Ĳ"],
    ["a8a8", "ĿŁØŒºÞŦŊ"],
    ["a8b1", "㉠", 27, "ⓐ", 25, "①", 14, "½⅓⅔¼¾⅛⅜⅝⅞"],
    ["a941", "쯅", 14, "쯕", 10],
    ["a961", "쯠쯡쯢쯣쯥쯦쯨쯪", 18],
    ["a981", "쯽", 14, "찎찏찑찒찓찕", 6, "찞찟찠찣찤æđðħıĳĸŀłøœßþŧŋŉ㈀", 27, "⒜", 25, "⑴", 14, "¹²³⁴ⁿ₁₂₃₄"],
    ["aa41", "찥찦찪찫찭찯찱", 6, "찺찿", 4, "챆챇챉챊챋챍챎"],
    ["aa61", "챏", 4, "챖챚", 5, "챡챢챣챥챧챩", 6, "챱챲"],
    ["aa81", "챳챴챶", 29, "ぁ", 82],
    ["ab41", "첔첕첖첗첚첛첝첞첟첡", 6, "첪첮", 5, "첶첷첹"],
    ["ab61", "첺첻첽", 6, "쳆쳈쳊", 5, "쳑쳒쳓쳕", 5],
    ["ab81", "쳛", 8, "쳥", 6, "쳭쳮쳯쳱", 12, "ァ", 85],
    ["ac41", "쳾쳿촀촂", 5, "촊촋촍촎촏촑", 6, "촚촜촞촟촠"],
    ["ac61", "촡촢촣촥촦촧촩촪촫촭", 11, "촺", 4],
    ["ac81", "촿", 28, "쵝쵞쵟А", 5, "ЁЖ", 25],
    ["acd1", "а", 5, "ёж", 25],
    ["ad41", "쵡쵢쵣쵥", 6, "쵮쵰쵲", 5, "쵹", 7],
    ["ad61", "춁", 6, "춉", 10, "춖춗춙춚춛춝춞춟"],
    ["ad81", "춠춡춢춣춦춨춪", 5, "춱", 18, "췅"],
    ["ae41", "췆", 5, "췍췎췏췑", 16],
    ["ae61", "췢", 5, "췩췪췫췭췮췯췱", 6, "췺췼췾", 4],
    ["ae81", "츃츅츆츇츉츊츋츍", 6, "츕츖츗츘츚", 5, "츢츣츥츦츧츩츪츫"],
    ["af41", "츬츭츮츯츲츴츶", 19],
    ["af61", "칊", 13, "칚칛칝칞칢", 5, "칪칬"],
    ["af81", "칮", 5, "칶칷칹칺칻칽", 6, "캆캈캊", 5, "캒캓캕캖캗캙"],
    ["b041", "캚", 5, "캢캦", 5, "캮", 12],
    ["b061", "캻", 5, "컂", 19],
    ["b081", "컖", 13, "컦컧컩컪컭", 6, "컶컺", 5, "가각간갇갈갉갊감", 7, "같", 4, "갠갤갬갭갯갰갱갸갹갼걀걋걍걔걘걜거걱건걷걸걺검겁것겄겅겆겉겊겋게겐겔겜겝겟겠겡겨격겪견겯결겸겹겻겼경곁계곈곌곕곗고곡곤곧골곪곬곯곰곱곳공곶과곽관괄괆"],
    ["b141", "켂켃켅켆켇켉", 6, "켒켔켖", 5, "켝켞켟켡켢켣"],
    ["b161", "켥", 6, "켮켲", 5, "켹", 11],
    ["b181", "콅", 14, "콖콗콙콚콛콝", 6, "콦콨콪콫콬괌괍괏광괘괜괠괩괬괭괴괵괸괼굄굅굇굉교굔굘굡굣구국군굳굴굵굶굻굼굽굿궁궂궈궉권궐궜궝궤궷귀귁귄귈귐귑귓규균귤그극근귿글긁금급긋긍긔기긱긴긷길긺김깁깃깅깆깊까깍깎깐깔깖깜깝깟깠깡깥깨깩깬깰깸"],
    ["b241", "콭콮콯콲콳콵콶콷콹", 6, "쾁쾂쾃쾄쾆", 5, "쾍"],
    ["b261", "쾎", 18, "쾢", 5, "쾩"],
    ["b281", "쾪", 5, "쾱", 18, "쿅", 6, "깹깻깼깽꺄꺅꺌꺼꺽꺾껀껄껌껍껏껐껑께껙껜껨껫껭껴껸껼꼇꼈꼍꼐꼬꼭꼰꼲꼴꼼꼽꼿꽁꽂꽃꽈꽉꽐꽜꽝꽤꽥꽹꾀꾄꾈꾐꾑꾕꾜꾸꾹꾼꿀꿇꿈꿉꿋꿍꿎꿔꿜꿨꿩꿰꿱꿴꿸뀀뀁뀄뀌뀐뀔뀜뀝뀨끄끅끈끊끌끎끓끔끕끗끙"],
    ["b341", "쿌", 19, "쿢쿣쿥쿦쿧쿩"],
    ["b361", "쿪", 5, "쿲쿴쿶", 5, "쿽쿾쿿퀁퀂퀃퀅", 5],
    ["b381", "퀋", 5, "퀒", 5, "퀙", 19, "끝끼끽낀낄낌낍낏낑나낙낚난낟날낡낢남납낫", 4, "낱낳내낵낸낼냄냅냇냈냉냐냑냔냘냠냥너넉넋넌널넒넓넘넙넛넜넝넣네넥넨넬넴넵넷넸넹녀녁년녈념녑녔녕녘녜녠노녹논놀놂놈놉놋농높놓놔놘놜놨뇌뇐뇔뇜뇝"],
    ["b441", "퀮", 5, "퀶퀷퀹퀺퀻퀽", 6, "큆큈큊", 5],
    ["b461", "큑큒큓큕큖큗큙", 6, "큡", 10, "큮큯"],
    ["b481", "큱큲큳큵", 6, "큾큿킀킂", 18, "뇟뇨뇩뇬뇰뇹뇻뇽누눅눈눋눌눔눕눗눙눠눴눼뉘뉜뉠뉨뉩뉴뉵뉼늄늅늉느늑는늘늙늚늠늡늣능늦늪늬늰늴니닉닌닐닒님닙닛닝닢다닥닦단닫", 4, "닳담답닷", 4, "닿대댁댄댈댐댑댓댔댕댜더덕덖던덛덜덞덟덤덥"],
    ["b541", "킕", 14, "킦킧킩킪킫킭", 5],
    ["b561", "킳킶킸킺", 5, "탂탃탅탆탇탊", 5, "탒탖", 4],
    ["b581", "탛탞탟탡탢탣탥", 6, "탮탲", 5, "탹", 11, "덧덩덫덮데덱덴델뎀뎁뎃뎄뎅뎌뎐뎔뎠뎡뎨뎬도독돈돋돌돎돐돔돕돗동돛돝돠돤돨돼됐되된될됨됩됫됴두둑둔둘둠둡둣둥둬뒀뒈뒝뒤뒨뒬뒵뒷뒹듀듄듈듐듕드득든듣들듦듬듭듯등듸디딕딘딛딜딤딥딧딨딩딪따딱딴딸"],
    ["b641", "턅", 7, "턎", 17],
    ["b661", "턠", 15, "턲턳턵턶턷턹턻턼턽턾"],
    ["b681", "턿텂텆", 5, "텎텏텑텒텓텕", 6, "텞텠텢", 5, "텩텪텫텭땀땁땃땄땅땋때땍땐땔땜땝땟땠땡떠떡떤떨떪떫떰떱떳떴떵떻떼떽뗀뗄뗌뗍뗏뗐뗑뗘뗬또똑똔똘똥똬똴뙈뙤뙨뚜뚝뚠뚤뚫뚬뚱뛔뛰뛴뛸뜀뜁뜅뜨뜩뜬뜯뜰뜸뜹뜻띄띈띌띔띕띠띤띨띰띱띳띵라락란랄람랍랏랐랑랒랖랗"],
    ["b741", "텮", 13, "텽", 6, "톅톆톇톉톊"],
    ["b761", "톋", 20, "톢톣톥톦톧"],
    ["b781", "톩", 6, "톲톴톶톷톸톹톻톽톾톿퇁", 14, "래랙랜랠램랩랫랬랭랴략랸럇량러럭런럴럼럽럿렀렁렇레렉렌렐렘렙렛렝려력련렬렴렵렷렸령례롄롑롓로록론롤롬롭롯롱롸롼뢍뢨뢰뢴뢸룀룁룃룅료룐룔룝룟룡루룩룬룰룸룹룻룽뤄뤘뤠뤼뤽륀륄륌륏륑류륙륜률륨륩"],
    ["b841", "퇐", 7, "퇙", 17],
    ["b861", "퇫", 8, "퇵퇶퇷퇹", 13],
    ["b881", "툈툊", 5, "툑", 24, "륫륭르륵른를름릅릇릉릊릍릎리릭린릴림립릿링마막만많", 4, "맘맙맛망맞맡맣매맥맨맬맴맵맷맸맹맺먀먁먈먕머먹먼멀멂멈멉멋멍멎멓메멕멘멜멤멥멧멨멩며멱면멸몃몄명몇몌모목몫몬몰몲몸몹못몽뫄뫈뫘뫙뫼"],
    ["b941", "툪툫툮툯툱툲툳툵", 6, "툾퉀퉂", 5, "퉉퉊퉋퉌"],
    ["b961", "퉍", 14, "퉝", 6, "퉥퉦퉧퉨"],
    ["b981", "퉩", 22, "튂튃튅튆튇튉튊튋튌묀묄묍묏묑묘묜묠묩묫무묵묶문묻물묽묾뭄뭅뭇뭉뭍뭏뭐뭔뭘뭡뭣뭬뮈뮌뮐뮤뮨뮬뮴뮷므믄믈믐믓미믹민믿밀밂밈밉밋밌밍및밑바", 4, "받", 4, "밤밥밧방밭배백밴밸뱀뱁뱃뱄뱅뱉뱌뱍뱐뱝버벅번벋벌벎범법벗"],
    ["ba41", "튍튎튏튒튓튔튖", 5, "튝튞튟튡튢튣튥", 6, "튭"],
    ["ba61", "튮튯튰튲", 5, "튺튻튽튾틁틃", 4, "틊틌", 5],
    ["ba81", "틒틓틕틖틗틙틚틛틝", 6, "틦", 9, "틲틳틵틶틷틹틺벙벚베벡벤벧벨벰벱벳벴벵벼벽변별볍볏볐병볕볘볜보복볶본볼봄봅봇봉봐봔봤봬뵀뵈뵉뵌뵐뵘뵙뵤뵨부북분붇불붉붊붐붑붓붕붙붚붜붤붰붸뷔뷕뷘뷜뷩뷰뷴뷸븀븃븅브븍븐블븜븝븟비빅빈빌빎빔빕빗빙빚빛빠빡빤"],
    ["bb41", "틻", 4, "팂팄팆", 5, "팏팑팒팓팕팗", 4, "팞팢팣"],
    ["bb61", "팤팦팧팪팫팭팮팯팱", 6, "팺팾", 5, "퍆퍇퍈퍉"],
    ["bb81", "퍊", 31, "빨빪빰빱빳빴빵빻빼빽뺀뺄뺌뺍뺏뺐뺑뺘뺙뺨뻐뻑뻔뻗뻘뻠뻣뻤뻥뻬뼁뼈뼉뼘뼙뼛뼜뼝뽀뽁뽄뽈뽐뽑뽕뾔뾰뿅뿌뿍뿐뿔뿜뿟뿡쀼쁑쁘쁜쁠쁨쁩삐삑삔삘삠삡삣삥사삭삯산삳살삵삶삼삽삿샀상샅새색샌샐샘샙샛샜생샤"],
    ["bc41", "퍪", 17, "퍾퍿펁펂펃펅펆펇"],
    ["bc61", "펈펉펊펋펎펒", 5, "펚펛펝펞펟펡", 6, "펪펬펮"],
    ["bc81", "펯", 4, "펵펶펷펹펺펻펽", 6, "폆폇폊", 5, "폑", 5, "샥샨샬샴샵샷샹섀섄섈섐섕서", 4, "섣설섦섧섬섭섯섰성섶세섹센셀셈셉셋셌셍셔셕션셜셤셥셧셨셩셰셴셸솅소속솎손솔솖솜솝솟송솥솨솩솬솰솽쇄쇈쇌쇔쇗쇘쇠쇤쇨쇰쇱쇳쇼쇽숀숄숌숍숏숑수숙순숟술숨숩숫숭"],
    ["bd41", "폗폙", 7, "폢폤", 7, "폮폯폱폲폳폵폶폷"],
    ["bd61", "폸폹폺폻폾퐀퐂", 5, "퐉", 13],
    ["bd81", "퐗", 5, "퐞", 25, "숯숱숲숴쉈쉐쉑쉔쉘쉠쉥쉬쉭쉰쉴쉼쉽쉿슁슈슉슐슘슛슝스슥슨슬슭슴습슷승시식신싣실싫심십싯싱싶싸싹싻싼쌀쌈쌉쌌쌍쌓쌔쌕쌘쌜쌤쌥쌨쌩썅써썩썬썰썲썸썹썼썽쎄쎈쎌쏀쏘쏙쏜쏟쏠쏢쏨쏩쏭쏴쏵쏸쐈쐐쐤쐬쐰"],
    ["be41", "퐸", 7, "푁푂푃푅", 14],
    ["be61", "푔", 7, "푝푞푟푡푢푣푥", 7, "푮푰푱푲"],
    ["be81", "푳", 4, "푺푻푽푾풁풃", 4, "풊풌풎", 5, "풕", 8, "쐴쐼쐽쑈쑤쑥쑨쑬쑴쑵쑹쒀쒔쒜쒸쒼쓩쓰쓱쓴쓸쓺쓿씀씁씌씐씔씜씨씩씬씰씸씹씻씽아악안앉않알앍앎앓암압앗았앙앝앞애액앤앨앰앱앳앴앵야약얀얄얇얌얍얏양얕얗얘얜얠얩어억언얹얻얼얽얾엄", 6, "엌엎"],
    ["bf41", "풞", 10, "풪", 14],
    ["bf61", "풹", 18, "퓍퓎퓏퓑퓒퓓퓕"],
    ["bf81", "퓖", 5, "퓝퓞퓠", 7, "퓩퓪퓫퓭퓮퓯퓱", 6, "퓹퓺퓼에엑엔엘엠엡엣엥여역엮연열엶엷염", 5, "옅옆옇예옌옐옘옙옛옜오옥온올옭옮옰옳옴옵옷옹옻와왁완왈왐왑왓왔왕왜왝왠왬왯왱외왹왼욀욈욉욋욍요욕욘욜욤욥욧용우욱운울욹욺움웁웃웅워웍원월웜웝웠웡웨"],
    ["c041", "퓾", 5, "픅픆픇픉픊픋픍", 6, "픖픘", 5],
    ["c061", "픞", 25],
    ["c081", "픸픹픺픻픾픿핁핂핃핅", 6, "핎핐핒", 5, "핚핛핝핞핟핡핢핣웩웬웰웸웹웽위윅윈윌윔윕윗윙유육윤율윰윱윳융윷으윽은을읊음읍읏응", 7, "읜읠읨읫이익인일읽읾잃임입잇있잉잊잎자작잔잖잗잘잚잠잡잣잤장잦재잭잰잴잼잽잿쟀쟁쟈쟉쟌쟎쟐쟘쟝쟤쟨쟬저적전절젊"],
    ["c141", "핤핦핧핪핬핮", 5, "핶핷핹핺핻핽", 6, "햆햊햋"],
    ["c161", "햌햍햎햏햑", 19, "햦햧"],
    ["c181", "햨", 31, "점접젓정젖제젝젠젤젬젭젯젱져젼졀졈졉졌졍졔조족존졸졺좀좁좃종좆좇좋좌좍좔좝좟좡좨좼좽죄죈죌죔죕죗죙죠죡죤죵주죽준줄줅줆줌줍줏중줘줬줴쥐쥑쥔쥘쥠쥡쥣쥬쥰쥴쥼즈즉즌즐즘즙즛증지직진짇질짊짐집짓"],
    ["c241", "헊헋헍헎헏헑헓", 4, "헚헜헞", 5, "헦헧헩헪헫헭헮"],
    ["c261", "헯", 4, "헶헸헺", 5, "혂혃혅혆혇혉", 6, "혒"],
    ["c281", "혖", 5, "혝혞혟혡혢혣혥", 7, "혮", 9, "혺혻징짖짙짚짜짝짠짢짤짧짬짭짯짰짱째짹짼쨀쨈쨉쨋쨌쨍쨔쨘쨩쩌쩍쩐쩔쩜쩝쩟쩠쩡쩨쩽쪄쪘쪼쪽쫀쫄쫌쫍쫏쫑쫓쫘쫙쫠쫬쫴쬈쬐쬔쬘쬠쬡쭁쭈쭉쭌쭐쭘쭙쭝쭤쭸쭹쮜쮸쯔쯤쯧쯩찌찍찐찔찜찝찡찢찧차착찬찮찰참찹찻"],
    ["c341", "혽혾혿홁홂홃홄홆홇홊홌홎홏홐홒홓홖홗홙홚홛홝", 4],
    ["c361", "홢", 4, "홨홪", 5, "홲홳홵", 11],
    ["c381", "횁횂횄횆", 5, "횎횏횑횒횓횕", 7, "횞횠횢", 5, "횩횪찼창찾채책챈챌챔챕챗챘챙챠챤챦챨챰챵처척천철첨첩첫첬청체첵첸첼쳄쳅쳇쳉쳐쳔쳤쳬쳰촁초촉촌촐촘촙촛총촤촨촬촹최쵠쵤쵬쵭쵯쵱쵸춈추축춘출춤춥춧충춰췄췌췐취췬췰췸췹췻췽츄츈츌츔츙츠측츤츨츰츱츳층"],
    ["c441", "횫횭횮횯횱", 7, "횺횼", 7, "훆훇훉훊훋"],
    ["c461", "훍훎훏훐훒훓훕훖훘훚", 5, "훡훢훣훥훦훧훩", 4],
    ["c481", "훮훯훱훲훳훴훶", 5, "훾훿휁휂휃휅", 11, "휒휓휔치칙친칟칠칡침칩칫칭카칵칸칼캄캅캇캉캐캑캔캘캠캡캣캤캥캬캭컁커컥컨컫컬컴컵컷컸컹케켁켄켈켐켑켓켕켜켠켤켬켭켯켰켱켸코콕콘콜콤콥콧콩콰콱콴콸쾀쾅쾌쾡쾨쾰쿄쿠쿡쿤쿨쿰쿱쿳쿵쿼퀀퀄퀑퀘퀭퀴퀵퀸퀼"],
    ["c541", "휕휖휗휚휛휝휞휟휡", 6, "휪휬휮", 5, "휶휷휹"],
    ["c561", "휺휻휽", 6, "흅흆흈흊", 5, "흒흓흕흚", 4],
    ["c581", "흟흢흤흦흧흨흪흫흭흮흯흱흲흳흵", 6, "흾흿힀힂", 5, "힊힋큄큅큇큉큐큔큘큠크큭큰클큼큽킁키킥킨킬킴킵킷킹타탁탄탈탉탐탑탓탔탕태택탠탤탬탭탯탰탱탸턍터턱턴털턺텀텁텃텄텅테텍텐텔템텝텟텡텨텬텼톄톈토톡톤톨톰톱톳통톺톼퇀퇘퇴퇸툇툉툐투툭툰툴툼툽툿퉁퉈퉜"],
    ["c641", "힍힎힏힑", 6, "힚힜힞", 5],
    ["c6a1", "퉤튀튁튄튈튐튑튕튜튠튤튬튱트특튼튿틀틂틈틉틋틔틘틜틤틥티틱틴틸팀팁팃팅파팍팎판팔팖팜팝팟팠팡팥패팩팬팰팸팹팻팼팽퍄퍅퍼퍽펀펄펌펍펏펐펑페펙펜펠펨펩펫펭펴편펼폄폅폈평폐폘폡폣포폭폰폴폼폽폿퐁"],
    ["c7a1", "퐈퐝푀푄표푠푤푭푯푸푹푼푿풀풂품풉풋풍풔풩퓌퓐퓔퓜퓟퓨퓬퓰퓸퓻퓽프픈플픔픕픗피픽핀필핌핍핏핑하학한할핥함합핫항해핵핸핼햄햅햇했행햐향허헉헌헐헒험헙헛헝헤헥헨헬헴헵헷헹혀혁현혈혐협혓혔형혜혠"],
    ["c8a1", "혤혭호혹혼홀홅홈홉홋홍홑화확환활홧황홰홱홴횃횅회획횐횔횝횟횡효횬횰횹횻후훅훈훌훑훔훗훙훠훤훨훰훵훼훽휀휄휑휘휙휜휠휨휩휫휭휴휵휸휼흄흇흉흐흑흔흖흗흘흙흠흡흣흥흩희흰흴흼흽힁히힉힌힐힘힙힛힝"],
    ["caa1", "伽佳假價加可呵哥嘉嫁家暇架枷柯歌珂痂稼苛茄街袈訶賈跏軻迦駕刻却各恪慤殼珏脚覺角閣侃刊墾奸姦干幹懇揀杆柬桿澗癎看磵稈竿簡肝艮艱諫間乫喝曷渴碣竭葛褐蝎鞨勘坎堪嵌感憾戡敢柑橄減甘疳監瞰紺邯鑑鑒龕"],
    ["cba1", "匣岬甲胛鉀閘剛堈姜岡崗康强彊慷江畺疆糠絳綱羌腔舡薑襁講鋼降鱇介价個凱塏愷愾慨改槪漑疥皆盖箇芥蓋豈鎧開喀客坑更粳羹醵倨去居巨拒据據擧渠炬祛距踞車遽鉅鋸乾件健巾建愆楗腱虔蹇鍵騫乞傑杰桀儉劍劒檢"],
    ["cca1", "瞼鈐黔劫怯迲偈憩揭擊格檄激膈覡隔堅牽犬甄絹繭肩見譴遣鵑抉決潔結缺訣兼慊箝謙鉗鎌京俓倞傾儆勁勍卿坰境庚徑慶憬擎敬景暻更梗涇炅烱璟璥瓊痙硬磬竟競絅經耕耿脛莖警輕逕鏡頃頸驚鯨係啓堺契季屆悸戒桂械"],
    ["cda1", "棨溪界癸磎稽系繫繼計誡谿階鷄古叩告呱固姑孤尻庫拷攷故敲暠枯槁沽痼皐睾稿羔考股膏苦苽菰藁蠱袴誥賈辜錮雇顧高鼓哭斛曲梏穀谷鵠困坤崑昆梱棍滾琨袞鯤汨滑骨供公共功孔工恐恭拱控攻珙空蚣貢鞏串寡戈果瓜"],
    ["cea1", "科菓誇課跨過鍋顆廓槨藿郭串冠官寬慣棺款灌琯瓘管罐菅觀貫關館刮恝括适侊光匡壙廣曠洸炚狂珖筐胱鑛卦掛罫乖傀塊壞怪愧拐槐魁宏紘肱轟交僑咬喬嬌嶠巧攪敎校橋狡皎矯絞翹膠蕎蛟較轎郊餃驕鮫丘久九仇俱具勾"],
    ["cfa1", "區口句咎嘔坵垢寇嶇廐懼拘救枸柩構歐毆毬求溝灸狗玖球瞿矩究絿耉臼舅舊苟衢謳購軀逑邱鉤銶駒驅鳩鷗龜國局菊鞠鞫麴君窘群裙軍郡堀屈掘窟宮弓穹窮芎躬倦券勸卷圈拳捲權淃眷厥獗蕨蹶闕机櫃潰詭軌饋句晷歸貴"],
    ["d0a1", "鬼龜叫圭奎揆槻珪硅窺竅糾葵規赳逵閨勻均畇筠菌鈞龜橘克剋劇戟棘極隙僅劤勤懃斤根槿瑾筋芹菫覲謹近饉契今妗擒昑檎琴禁禽芩衾衿襟金錦伋及急扱汲級給亘兢矜肯企伎其冀嗜器圻基埼夔奇妓寄岐崎己幾忌技旗旣"],
    ["d1a1", "朞期杞棋棄機欺氣汽沂淇玘琦琪璂璣畸畿碁磯祁祇祈祺箕紀綺羈耆耭肌記譏豈起錡錤飢饑騎騏驥麒緊佶吉拮桔金喫儺喇奈娜懦懶拏拿癩", 5, "那樂", 4, "諾酪駱亂卵暖欄煖爛蘭難鸞捏捺南嵐枏楠湳濫男藍襤拉"],
    ["d2a1", "納臘蠟衲囊娘廊", 4, "乃來內奈柰耐冷女年撚秊念恬拈捻寧寗努勞奴弩怒擄櫓爐瑙盧", 5, "駑魯", 10, "濃籠聾膿農惱牢磊腦賂雷尿壘", 7, "嫩訥杻紐勒", 5, "能菱陵尼泥匿溺多茶"],
    ["d3a1", "丹亶但單團壇彖斷旦檀段湍短端簞緞蛋袒鄲鍛撻澾獺疸達啖坍憺擔曇淡湛潭澹痰聃膽蕁覃談譚錟沓畓答踏遝唐堂塘幢戇撞棠當糖螳黨代垈坮大對岱帶待戴擡玳臺袋貸隊黛宅德悳倒刀到圖堵塗導屠島嶋度徒悼挑掉搗桃"],
    ["d4a1", "棹櫂淘渡滔濤燾盜睹禱稻萄覩賭跳蹈逃途道都鍍陶韜毒瀆牘犢獨督禿篤纛讀墩惇敦旽暾沌焞燉豚頓乭突仝冬凍動同憧東桐棟洞潼疼瞳童胴董銅兜斗杜枓痘竇荳讀豆逗頭屯臀芚遁遯鈍得嶝橙燈登等藤謄鄧騰喇懶拏癩羅"],
    ["d5a1", "蘿螺裸邏樂洛烙珞絡落諾酪駱丹亂卵欄欒瀾爛蘭鸞剌辣嵐擥攬欖濫籃纜藍襤覽拉臘蠟廊朗浪狼琅瑯螂郞來崍徠萊冷掠略亮倆兩凉梁樑粮粱糧良諒輛量侶儷勵呂廬慮戾旅櫚濾礪藜蠣閭驢驪麗黎力曆歷瀝礫轢靂憐戀攣漣"],
    ["d6a1", "煉璉練聯蓮輦連鍊冽列劣洌烈裂廉斂殮濂簾獵令伶囹寧岺嶺怜玲笭羚翎聆逞鈴零靈領齡例澧禮醴隷勞怒撈擄櫓潞瀘爐盧老蘆虜路輅露魯鷺鹵碌祿綠菉錄鹿麓論壟弄朧瀧瓏籠聾儡瀨牢磊賂賚賴雷了僚寮廖料燎療瞭聊蓼"],
    ["d7a1", "遼鬧龍壘婁屢樓淚漏瘻累縷蔞褸鏤陋劉旒柳榴流溜瀏琉瑠留瘤硫謬類六戮陸侖倫崙淪綸輪律慄栗率隆勒肋凜凌楞稜綾菱陵俚利厘吏唎履悧李梨浬犁狸理璃異痢籬罹羸莉裏裡里釐離鯉吝潾燐璘藺躪隣鱗麟林淋琳臨霖砬"],
    ["d8a1", "立笠粒摩瑪痲碼磨馬魔麻寞幕漠膜莫邈万卍娩巒彎慢挽晩曼滿漫灣瞞萬蔓蠻輓饅鰻唜抹末沫茉襪靺亡妄忘忙望網罔芒茫莽輞邙埋妹媒寐昧枚梅每煤罵買賣邁魅脈貊陌驀麥孟氓猛盲盟萌冪覓免冕勉棉沔眄眠綿緬面麵滅"],
    ["d9a1", "蔑冥名命明暝椧溟皿瞑茗蓂螟酩銘鳴袂侮冒募姆帽慕摸摹暮某模母毛牟牡瑁眸矛耗芼茅謀謨貌木沐牧目睦穆鶩歿沒夢朦蒙卯墓妙廟描昴杳渺猫竗苗錨務巫憮懋戊拇撫无楙武毋無珷畝繆舞茂蕪誣貿霧鵡墨默們刎吻問文"],
    ["daa1", "汶紊紋聞蚊門雯勿沕物味媚尾嵋彌微未梶楣渼湄眉米美薇謎迷靡黴岷悶愍憫敏旻旼民泯玟珉緡閔密蜜謐剝博拍搏撲朴樸泊珀璞箔粕縛膊舶薄迫雹駁伴半反叛拌搬攀斑槃泮潘班畔瘢盤盼磐磻礬絆般蟠返頒飯勃拔撥渤潑"],
    ["dba1", "發跋醱鉢髮魃倣傍坊妨尨幇彷房放方旁昉枋榜滂磅紡肪膀舫芳蒡蚌訪謗邦防龐倍俳北培徘拜排杯湃焙盃背胚裴裵褙賠輩配陪伯佰帛柏栢白百魄幡樊煩燔番磻繁蕃藩飜伐筏罰閥凡帆梵氾汎泛犯範范法琺僻劈壁擘檗璧癖"],
    ["dca1", "碧蘗闢霹便卞弁變辨辯邊別瞥鱉鼈丙倂兵屛幷昞昺柄棅炳甁病秉竝輧餠騈保堡報寶普步洑湺潽珤甫菩補褓譜輔伏僕匐卜宓復服福腹茯蔔複覆輹輻馥鰒本乶俸奉封峯峰捧棒烽熢琫縫蓬蜂逢鋒鳳不付俯傅剖副否咐埠夫婦"],
    ["dda1", "孚孵富府復扶敷斧浮溥父符簿缶腐腑膚艀芙莩訃負賦賻赴趺部釜阜附駙鳧北分吩噴墳奔奮忿憤扮昐汾焚盆粉糞紛芬賁雰不佛弗彿拂崩朋棚硼繃鵬丕備匕匪卑妃婢庇悲憊扉批斐枇榧比毖毗毘沸泌琵痺砒碑秕秘粃緋翡肥"],
    ["dea1", "脾臂菲蜚裨誹譬費鄙非飛鼻嚬嬪彬斌檳殯浜濱瀕牝玭貧賓頻憑氷聘騁乍事些仕伺似使俟僿史司唆嗣四士奢娑寫寺射巳師徙思捨斜斯柶査梭死沙泗渣瀉獅砂社祀祠私篩紗絲肆舍莎蓑蛇裟詐詞謝賜赦辭邪飼駟麝削數朔索"],
    ["dfa1", "傘刪山散汕珊産疝算蒜酸霰乷撒殺煞薩三參杉森渗芟蔘衫揷澁鈒颯上傷像償商喪嘗孀尙峠常床庠廂想桑橡湘爽牀狀相祥箱翔裳觴詳象賞霜塞璽賽嗇塞穡索色牲生甥省笙墅壻嶼序庶徐恕抒捿敍暑曙書栖棲犀瑞筮絮緖署"],
    ["e0a1", "胥舒薯西誓逝鋤黍鼠夕奭席惜昔晳析汐淅潟石碩蓆釋錫仙僊先善嬋宣扇敾旋渲煽琁瑄璇璿癬禪線繕羨腺膳船蘚蟬詵跣選銑鐥饍鮮卨屑楔泄洩渫舌薛褻設說雪齧剡暹殲纖蟾贍閃陝攝涉燮葉城姓宬性惺成星晟猩珹盛省筬"],
    ["e1a1", "聖聲腥誠醒世勢歲洗稅笹細說貰召嘯塑宵小少巢所掃搔昭梳沼消溯瀟炤燒甦疏疎瘙笑篠簫素紹蔬蕭蘇訴逍遡邵銷韶騷俗屬束涑粟續謖贖速孫巽損蓀遜飡率宋悚松淞訟誦送頌刷殺灑碎鎖衰釗修受嗽囚垂壽嫂守岫峀帥愁"],
    ["e2a1", "戍手授搜收數樹殊水洙漱燧狩獸琇璲瘦睡秀穗竪粹綏綬繡羞脩茱蒐蓚藪袖誰讐輸遂邃酬銖銹隋隧隨雖需須首髓鬚叔塾夙孰宿淑潚熟琡璹肅菽巡徇循恂旬栒楯橓殉洵淳珣盾瞬筍純脣舜荀蓴蕣詢諄醇錞順馴戌術述鉥崇崧"],
    ["e3a1", "嵩瑟膝蝨濕拾習褶襲丞乘僧勝升承昇繩蠅陞侍匙嘶始媤尸屎屍市弑恃施是時枾柴猜矢示翅蒔蓍視試詩諡豕豺埴寔式息拭植殖湜熄篒蝕識軾食飾伸侁信呻娠宸愼新晨燼申神紳腎臣莘薪藎蜃訊身辛辰迅失室實悉審尋心沁"],
    ["e4a1", "沈深瀋甚芯諶什十拾雙氏亞俄兒啞娥峨我牙芽莪蛾衙訝阿雅餓鴉鵝堊岳嶽幄惡愕握樂渥鄂鍔顎鰐齷安岸按晏案眼雁鞍顔鮟斡謁軋閼唵岩巖庵暗癌菴闇壓押狎鴨仰央怏昻殃秧鴦厓哀埃崖愛曖涯碍艾隘靄厄扼掖液縊腋額"],
    ["e5a1", "櫻罌鶯鸚也倻冶夜惹揶椰爺耶若野弱掠略約若葯蒻藥躍亮佯兩凉壤孃恙揚攘敭暘梁楊樣洋瀁煬痒瘍禳穰糧羊良襄諒讓釀陽量養圄御於漁瘀禦語馭魚齬億憶抑檍臆偃堰彦焉言諺孼蘖俺儼嚴奄掩淹嶪業円予余勵呂女如廬"],
    ["e6a1", "旅歟汝濾璵礖礪與艅茹輿轝閭餘驪麗黎亦力域役易曆歷疫繹譯轢逆驛嚥堧姸娟宴年延憐戀捐挻撚椽沇沿涎涓淵演漣烟然煙煉燃燕璉硏硯秊筵緣練縯聯衍軟輦蓮連鉛鍊鳶列劣咽悅涅烈熱裂說閱厭廉念捻染殮炎焰琰艶苒"],
    ["e7a1", "簾閻髥鹽曄獵燁葉令囹塋寧嶺嶸影怜映暎楹榮永泳渶潁濚瀛瀯煐營獰玲瑛瑩瓔盈穎纓羚聆英詠迎鈴鍈零霙靈領乂倪例刈叡曳汭濊猊睿穢芮藝蘂禮裔詣譽豫醴銳隸霓預五伍俉傲午吾吳嗚塢墺奧娛寤悟惡懊敖旿晤梧汚澳"],
    ["e8a1", "烏熬獒筽蜈誤鰲鼇屋沃獄玉鈺溫瑥瘟穩縕蘊兀壅擁瓮甕癰翁邕雍饔渦瓦窩窪臥蛙蝸訛婉完宛梡椀浣玩琓琬碗緩翫脘腕莞豌阮頑曰往旺枉汪王倭娃歪矮外嵬巍猥畏了僚僥凹堯夭妖姚寥寮尿嶢拗搖撓擾料曜樂橈燎燿瑤療"],
    ["e9a1", "窈窯繇繞耀腰蓼蟯要謠遙遼邀饒慾欲浴縟褥辱俑傭冗勇埇墉容庸慂榕涌湧溶熔瑢用甬聳茸蓉踊鎔鏞龍于佑偶優又友右宇寓尤愚憂旴牛玗瑀盂祐禑禹紆羽芋藕虞迂遇郵釪隅雨雩勖彧旭昱栯煜稶郁頊云暈橒殞澐熉耘芸蕓"],
    ["eaa1", "運隕雲韻蔚鬱亐熊雄元原員圓園垣媛嫄寃怨愿援沅洹湲源爰猿瑗苑袁轅遠阮院願鴛月越鉞位偉僞危圍委威尉慰暐渭爲瑋緯胃萎葦蔿蝟衛褘謂違韋魏乳侑儒兪劉唯喩孺宥幼幽庾悠惟愈愉揄攸有杻柔柚柳楡楢油洧流游溜"],
    ["eba1", "濡猶猷琉瑜由留癒硫紐維臾萸裕誘諛諭踰蹂遊逾遺酉釉鍮類六堉戮毓肉育陸倫允奫尹崙淪潤玧胤贇輪鈗閏律慄栗率聿戎瀜絨融隆垠恩慇殷誾銀隱乙吟淫蔭陰音飮揖泣邑凝應膺鷹依倚儀宜意懿擬椅毅疑矣義艤薏蟻衣誼"],
    ["eca1", "議醫二以伊利吏夷姨履已弛彛怡易李梨泥爾珥理異痍痢移罹而耳肄苡荑裏裡貽貳邇里離飴餌匿溺瀷益翊翌翼謚人仁刃印吝咽因姻寅引忍湮燐璘絪茵藺蚓認隣靭靷鱗麟一佚佾壹日溢逸鎰馹任壬妊姙恁林淋稔臨荏賃入卄"],
    ["eda1", "立笠粒仍剩孕芿仔刺咨姉姿子字孜恣慈滋炙煮玆瓷疵磁紫者自茨蔗藉諮資雌作勺嚼斫昨灼炸爵綽芍酌雀鵲孱棧殘潺盞岑暫潛箴簪蠶雜丈仗匠場墻壯奬將帳庄張掌暲杖樟檣欌漿牆狀獐璋章粧腸臟臧莊葬蔣薔藏裝贓醬長"],
    ["eea1", "障再哉在宰才材栽梓渽滓災縡裁財載齋齎爭箏諍錚佇低儲咀姐底抵杵楮樗沮渚狙猪疽箸紵苧菹著藷詛貯躇這邸雎齟勣吊嫡寂摘敵滴狄炙的積笛籍績翟荻謫賊赤跡蹟迪迹適鏑佃佺傳全典前剪塡塼奠專展廛悛戰栓殿氈澱"],
    ["efa1", "煎琠田甸畑癲筌箋箭篆纏詮輾轉鈿銓錢鐫電顚顫餞切截折浙癤竊節絶占岾店漸点粘霑鮎點接摺蝶丁井亭停偵呈姃定幀庭廷征情挺政整旌晶晸柾楨檉正汀淀淨渟湞瀞炡玎珽町睛碇禎程穽精綎艇訂諪貞鄭酊釘鉦鋌錠霆靖"],
    ["f0a1", "靜頂鼎制劑啼堤帝弟悌提梯濟祭第臍薺製諸蹄醍除際霽題齊俎兆凋助嘲弔彫措操早晁曺曹朝條棗槽漕潮照燥爪璪眺祖祚租稠窕粗糟組繰肇藻蚤詔調趙躁造遭釣阻雕鳥族簇足鏃存尊卒拙猝倧宗從悰慫棕淙琮種終綜縱腫"],
    ["f1a1", "踪踵鍾鐘佐坐左座挫罪主住侏做姝胄呪周嗾奏宙州廚晝朱柱株注洲湊澍炷珠疇籌紂紬綢舟蛛註誅走躊輳週酎酒鑄駐竹粥俊儁准埈寯峻晙樽浚準濬焌畯竣蠢逡遵雋駿茁中仲衆重卽櫛楫汁葺增憎曾拯烝甑症繒蒸證贈之只"],
    ["f2a1", "咫地址志持指摯支旨智枝枳止池沚漬知砥祉祗紙肢脂至芝芷蜘誌識贄趾遲直稙稷織職唇嗔塵振搢晉晋桭榛殄津溱珍瑨璡畛疹盡眞瞋秦縉縝臻蔯袗診賑軫辰進鎭陣陳震侄叱姪嫉帙桎瓆疾秩窒膣蛭質跌迭斟朕什執潗緝輯"],
    ["f3a1", "鏶集徵懲澄且侘借叉嗟嵯差次此磋箚茶蹉車遮捉搾着窄錯鑿齪撰澯燦璨瓚竄簒纂粲纘讚贊鑽餐饌刹察擦札紮僭參塹慘慙懺斬站讒讖倉倡創唱娼廠彰愴敞昌昶暢槍滄漲猖瘡窓脹艙菖蒼債埰寀寨彩採砦綵菜蔡采釵冊柵策"],
    ["f4a1", "責凄妻悽處倜刺剔尺慽戚拓擲斥滌瘠脊蹠陟隻仟千喘天川擅泉淺玔穿舛薦賤踐遷釧闡阡韆凸哲喆徹撤澈綴輟轍鐵僉尖沾添甛瞻簽籤詹諂堞妾帖捷牒疊睫諜貼輒廳晴淸聽菁請靑鯖切剃替涕滯締諦逮遞體初剿哨憔抄招梢"],
    ["f5a1", "椒楚樵炒焦硝礁礎秒稍肖艸苕草蕉貂超酢醋醮促囑燭矗蜀觸寸忖村邨叢塚寵悤憁摠總聰蔥銃撮催崔最墜抽推椎楸樞湫皺秋芻萩諏趨追鄒酋醜錐錘鎚雛騶鰍丑畜祝竺筑築縮蓄蹙蹴軸逐春椿瑃出朮黜充忠沖蟲衝衷悴膵萃"],
    ["f6a1", "贅取吹嘴娶就炊翠聚脆臭趣醉驟鷲側仄厠惻測層侈値嗤峙幟恥梔治淄熾痔痴癡稚穉緇緻置致蚩輜雉馳齒則勅飭親七柒漆侵寢枕沈浸琛砧針鍼蟄秤稱快他咤唾墮妥惰打拖朶楕舵陀馱駝倬卓啄坼度托拓擢晫柝濁濯琢琸託"],
    ["f7a1", "鐸呑嘆坦彈憚歎灘炭綻誕奪脫探眈耽貪塔搭榻宕帑湯糖蕩兌台太怠態殆汰泰笞胎苔跆邰颱宅擇澤撑攄兎吐土討慟桶洞痛筒統通堆槌腿褪退頹偸套妬投透鬪慝特闖坡婆巴把播擺杷波派爬琶破罷芭跛頗判坂板版瓣販辦鈑"],
    ["f8a1", "阪八叭捌佩唄悖敗沛浿牌狽稗覇貝彭澎烹膨愎便偏扁片篇編翩遍鞭騙貶坪平枰萍評吠嬖幣廢弊斃肺蔽閉陛佈包匍匏咆哺圃布怖抛抱捕暴泡浦疱砲胞脯苞葡蒲袍褒逋鋪飽鮑幅暴曝瀑爆輻俵剽彪慓杓標漂瓢票表豹飇飄驃"],
    ["f9a1", "品稟楓諷豊風馮彼披疲皮被避陂匹弼必泌珌畢疋筆苾馝乏逼下何厦夏廈昰河瑕荷蝦賀遐霞鰕壑學虐謔鶴寒恨悍旱汗漢澣瀚罕翰閑閒限韓割轄函含咸啣喊檻涵緘艦銜陷鹹合哈盒蛤閤闔陜亢伉姮嫦巷恒抗杭桁沆港缸肛航"],
    ["faa1", "行降項亥偕咳垓奚孩害懈楷海瀣蟹解該諧邂駭骸劾核倖幸杏荇行享向嚮珦鄕響餉饗香噓墟虛許憲櫶獻軒歇險驗奕爀赫革俔峴弦懸晛泫炫玄玹現眩睍絃絢縣舷衒見賢鉉顯孑穴血頁嫌俠協夾峽挾浹狹脅脇莢鋏頰亨兄刑型"],
    ["fba1", "形泂滎瀅灐炯熒珩瑩荊螢衡逈邢鎣馨兮彗惠慧暳蕙蹊醯鞋乎互呼壕壺好岵弧戶扈昊晧毫浩淏湖滸澔濠濩灝狐琥瑚瓠皓祜糊縞胡芦葫蒿虎號蝴護豪鎬頀顥惑或酷婚昏混渾琿魂忽惚笏哄弘汞泓洪烘紅虹訌鴻化和嬅樺火畵"],
    ["fca1", "禍禾花華話譁貨靴廓擴攫確碻穫丸喚奐宦幻患換歡晥桓渙煥環紈還驩鰥活滑猾豁闊凰幌徨恍惶愰慌晃晄榥況湟滉潢煌璜皇篁簧荒蝗遑隍黃匯回廻徊恢悔懷晦會檜淮澮灰獪繪膾茴蛔誨賄劃獲宖橫鐄哮嚆孝效斅曉梟涍淆"],
    ["fda1", "爻肴酵驍侯候厚后吼喉嗅帿後朽煦珝逅勛勳塤壎焄熏燻薰訓暈薨喧暄煊萱卉喙毁彙徽揮暉煇諱輝麾休携烋畦虧恤譎鷸兇凶匈洶胸黑昕欣炘痕吃屹紇訖欠欽歆吸恰洽翕興僖凞喜噫囍姬嬉希憙憘戱晞曦熙熹熺犧禧稀羲詰"]
  ];
});

// node_modules/iconv-lite/encodings/tables/cp950.json
var require_cp950 = __commonJS((exports, module) => {
  module.exports = [
    ["0", "\x00", 127],
    ["a140", "　，、。．‧；：？！︰…‥﹐﹑﹒·﹔﹕﹖﹗｜–︱—︳╴︴﹏（）︵︶｛｝︷︸〔〕︹︺【】︻︼《》︽︾〈〉︿﹀「」﹁﹂『』﹃﹄﹙﹚"],
    ["a1a1", "﹛﹜﹝﹞‘’“”〝〞‵′＃＆＊※§〃○●△▲◎☆★◇◆□■▽▼㊣℅¯￣＿ˍ﹉﹊﹍﹎﹋﹌﹟﹠﹡＋－×÷±√＜＞＝≦≧≠∞≒≡﹢", 4, "～∩∪⊥∠∟⊿㏒㏑∫∮∵∴♀♂⊕⊙↑↓←→↖↗↙↘∥∣／"],
    ["a240", "＼∕﹨＄￥〒￠￡％＠℃℉﹩﹪﹫㏕㎜㎝㎞㏎㎡㎎㎏㏄°兙兛兞兝兡兣嗧瓩糎▁", 7, "▏▎▍▌▋▊▉┼┴┬┤├▔─│▕┌┐└┘╭"],
    ["a2a1", "╮╰╯═╞╪╡◢◣◥◤╱╲╳０", 9, "Ⅰ", 9, "〡", 8, "十卄卅Ａ", 25, "ａ", 21],
    ["a340", "ｗｘｙｚΑ", 16, "Σ", 6, "α", 16, "σ", 6, "ㄅ", 10],
    ["a3a1", "ㄐ", 25, "˙ˉˊˇˋ"],
    ["a3e1", "€"],
    ["a440", "一乙丁七乃九了二人儿入八几刀刁力匕十卜又三下丈上丫丸凡久么也乞于亡兀刃勺千叉口土士夕大女子孑孓寸小尢尸山川工己已巳巾干廾弋弓才"],
    ["a4a1", "丑丐不中丰丹之尹予云井互五亢仁什仃仆仇仍今介仄元允內六兮公冗凶分切刈勻勾勿化匹午升卅卞厄友及反壬天夫太夭孔少尤尺屯巴幻廿弔引心戈戶手扎支文斗斤方日曰月木欠止歹毋比毛氏水火爪父爻片牙牛犬王丙"],
    ["a540", "世丕且丘主乍乏乎以付仔仕他仗代令仙仞充兄冉冊冬凹出凸刊加功包匆北匝仟半卉卡占卯卮去可古右召叮叩叨叼司叵叫另只史叱台句叭叻四囚外"],
    ["a5a1", "央失奴奶孕它尼巨巧左市布平幼弁弘弗必戊打扔扒扑斥旦朮本未末札正母民氐永汁汀氾犯玄玉瓜瓦甘生用甩田由甲申疋白皮皿目矛矢石示禾穴立丞丟乒乓乩亙交亦亥仿伉伙伊伕伍伐休伏仲件任仰仳份企伋光兇兆先全"],
    ["a640", "共再冰列刑划刎刖劣匈匡匠印危吉吏同吊吐吁吋各向名合吃后吆吒因回囝圳地在圭圬圯圩夙多夷夸妄奸妃好她如妁字存宇守宅安寺尖屹州帆并年"],
    ["a6a1", "式弛忙忖戎戌戍成扣扛托收早旨旬旭曲曳有朽朴朱朵次此死氖汝汗汙江池汐汕污汛汍汎灰牟牝百竹米糸缶羊羽老考而耒耳聿肉肋肌臣自至臼舌舛舟艮色艾虫血行衣西阡串亨位住佇佗佞伴佛何估佐佑伽伺伸佃佔似但佣"],
    ["a740", "作你伯低伶余佝佈佚兌克免兵冶冷別判利刪刨劫助努劬匣即卵吝吭吞吾否呎吧呆呃吳呈呂君吩告吹吻吸吮吵吶吠吼呀吱含吟听囪困囤囫坊坑址坍"],
    ["a7a1", "均坎圾坐坏圻壯夾妝妒妨妞妣妙妖妍妤妓妊妥孝孜孚孛完宋宏尬局屁尿尾岐岑岔岌巫希序庇床廷弄弟彤形彷役忘忌志忍忱快忸忪戒我抄抗抖技扶抉扭把扼找批扳抒扯折扮投抓抑抆改攻攸旱更束李杏材村杜杖杞杉杆杠"],
    ["a840", "杓杗步每求汞沙沁沈沉沅沛汪決沐汰沌汨沖沒汽沃汲汾汴沆汶沍沔沘沂灶灼災灸牢牡牠狄狂玖甬甫男甸皂盯矣私秀禿究系罕肖肓肝肘肛肚育良芒"],
    ["a8a1", "芋芍見角言谷豆豕貝赤走足身車辛辰迂迆迅迄巡邑邢邪邦那酉釆里防阮阱阪阬並乖乳事些亞享京佯依侍佳使佬供例來侃佰併侈佩佻侖佾侏侑佺兔兒兕兩具其典冽函刻券刷刺到刮制剁劾劻卒協卓卑卦卷卸卹取叔受味呵"],
    ["a940", "咖呸咕咀呻呷咄咒咆呼咐呱呶和咚呢周咋命咎固垃坷坪坩坡坦坤坼夜奉奇奈奄奔妾妻委妹妮姑姆姐姍始姓姊妯妳姒姅孟孤季宗定官宜宙宛尚屈居"],
    ["a9a1", "屆岷岡岸岩岫岱岳帘帚帖帕帛帑幸庚店府底庖延弦弧弩往征彿彼忝忠忽念忿怏怔怯怵怖怪怕怡性怩怫怛或戕房戾所承拉拌拄抿拂抹拒招披拓拔拋拈抨抽押拐拙拇拍抵拚抱拘拖拗拆抬拎放斧於旺昔易昌昆昂明昀昏昕昊"],
    ["aa40", "昇服朋杭枋枕東果杳杷枇枝林杯杰板枉松析杵枚枓杼杪杲欣武歧歿氓氛泣注泳沱泌泥河沽沾沼波沫法泓沸泄油況沮泗泅泱沿治泡泛泊沬泯泜泖泠"],
    ["aaa1", "炕炎炒炊炙爬爭爸版牧物狀狎狙狗狐玩玨玟玫玥甽疝疙疚的盂盲直知矽社祀祁秉秈空穹竺糾罔羌羋者肺肥肢肱股肫肩肴肪肯臥臾舍芳芝芙芭芽芟芹花芬芥芯芸芣芰芾芷虎虱初表軋迎返近邵邸邱邶采金長門阜陀阿阻附"],
    ["ab40", "陂隹雨青非亟亭亮信侵侯便俠俑俏保促侶俘俟俊俗侮俐俄係俚俎俞侷兗冒冑冠剎剃削前剌剋則勇勉勃勁匍南卻厚叛咬哀咨哎哉咸咦咳哇哂咽咪品"],
    ["aba1", "哄哈咯咫咱咻咩咧咿囿垂型垠垣垢城垮垓奕契奏奎奐姜姘姿姣姨娃姥姪姚姦威姻孩宣宦室客宥封屎屏屍屋峙峒巷帝帥帟幽庠度建弈弭彥很待徊律徇後徉怒思怠急怎怨恍恰恨恢恆恃恬恫恪恤扁拜挖按拼拭持拮拽指拱拷"],
    ["ac40", "拯括拾拴挑挂政故斫施既春昭映昧是星昨昱昤曷柿染柱柔某柬架枯柵柩柯柄柑枴柚查枸柏柞柳枰柙柢柝柒歪殃殆段毒毗氟泉洋洲洪流津洌洱洞洗"],
    ["aca1", "活洽派洶洛泵洹洧洸洩洮洵洎洫炫為炳炬炯炭炸炮炤爰牲牯牴狩狠狡玷珊玻玲珍珀玳甚甭畏界畎畋疫疤疥疢疣癸皆皇皈盈盆盃盅省盹相眉看盾盼眇矜砂研砌砍祆祉祈祇禹禺科秒秋穿突竿竽籽紂紅紀紉紇約紆缸美羿耄"],
    ["ad40", "耐耍耑耶胖胥胚胃胄背胡胛胎胞胤胝致舢苧范茅苣苛苦茄若茂茉苒苗英茁苜苔苑苞苓苟苯茆虐虹虻虺衍衫要觔計訂訃貞負赴赳趴軍軌述迦迢迪迥"],
    ["ada1", "迭迫迤迨郊郎郁郃酋酊重閂限陋陌降面革韋韭音頁風飛食首香乘亳倌倍倣俯倦倥俸倩倖倆值借倚倒們俺倀倔倨俱倡個候倘俳修倭倪俾倫倉兼冤冥冢凍凌准凋剖剜剔剛剝匪卿原厝叟哨唐唁唷哼哥哲唆哺唔哩哭員唉哮哪"],
    ["ae40", "哦唧唇哽唏圃圄埂埔埋埃堉夏套奘奚娑娘娜娟娛娓姬娠娣娩娥娌娉孫屘宰害家宴宮宵容宸射屑展屐峭峽峻峪峨峰島崁峴差席師庫庭座弱徒徑徐恙"],
    ["aea1", "恣恥恐恕恭恩息悄悟悚悍悔悌悅悖扇拳挈拿捎挾振捕捂捆捏捉挺捐挽挪挫挨捍捌效敉料旁旅時晉晏晃晒晌晅晁書朔朕朗校核案框桓根桂桔栩梳栗桌桑栽柴桐桀格桃株桅栓栘桁殊殉殷氣氧氨氦氤泰浪涕消涇浦浸海浙涓"],
    ["af40", "浬涉浮浚浴浩涌涊浹涅浥涔烊烘烤烙烈烏爹特狼狹狽狸狷玆班琉珮珠珪珞畔畝畜畚留疾病症疲疳疽疼疹痂疸皋皰益盍盎眩真眠眨矩砰砧砸砝破砷"],
    ["afa1", "砥砭砠砟砲祕祐祠祟祖神祝祗祚秤秣秧租秦秩秘窄窈站笆笑粉紡紗紋紊素索純紐紕級紜納紙紛缺罟羔翅翁耆耘耕耙耗耽耿胱脂胰脅胭胴脆胸胳脈能脊胼胯臭臬舀舐航舫舨般芻茫荒荔荊茸荐草茵茴荏茲茹茶茗荀茱茨荃"],
    ["b040", "虔蚊蚪蚓蚤蚩蚌蚣蚜衰衷袁袂衽衹記訐討訌訕訊託訓訖訏訑豈豺豹財貢起躬軒軔軏辱送逆迷退迺迴逃追逅迸邕郡郝郢酒配酌釘針釗釜釙閃院陣陡"],
    ["b0a1", "陛陝除陘陞隻飢馬骨高鬥鬲鬼乾偺偽停假偃偌做偉健偶偎偕偵側偷偏倏偯偭兜冕凰剪副勒務勘動匐匏匙匿區匾參曼商啪啦啄啞啡啃啊唱啖問啕唯啤唸售啜唬啣唳啁啗圈國圉域堅堊堆埠埤基堂堵執培夠奢娶婁婉婦婪婀"],
    ["b140", "娼婢婚婆婊孰寇寅寄寂宿密尉專將屠屜屝崇崆崎崛崖崢崑崩崔崙崤崧崗巢常帶帳帷康庸庶庵庾張強彗彬彩彫得徙從徘御徠徜恿患悉悠您惋悴惦悽"],
    ["b1a1", "情悻悵惜悼惘惕惆惟悸惚惇戚戛扈掠控捲掖探接捷捧掘措捱掩掉掃掛捫推掄授掙採掬排掏掀捻捩捨捺敝敖救教敗啟敏敘敕敔斜斛斬族旋旌旎晝晚晤晨晦晞曹勗望梁梯梢梓梵桿桶梱梧梗械梃棄梭梆梅梔條梨梟梡梂欲殺"],
    ["b240", "毫毬氫涎涼淳淙液淡淌淤添淺清淇淋涯淑涮淞淹涸混淵淅淒渚涵淚淫淘淪深淮淨淆淄涪淬涿淦烹焉焊烽烯爽牽犁猜猛猖猓猙率琅琊球理現琍瓠瓶"],
    ["b2a1", "瓷甜產略畦畢異疏痔痕疵痊痍皎盔盒盛眷眾眼眶眸眺硫硃硎祥票祭移窒窕笠笨笛第符笙笞笮粒粗粕絆絃統紮紹紼絀細紳組累終紲紱缽羞羚翌翎習耜聊聆脯脖脣脫脩脰脤舂舵舷舶船莎莞莘荸莢莖莽莫莒莊莓莉莠荷荻荼"],
    ["b340", "莆莧處彪蛇蛀蚶蛄蚵蛆蛋蚱蚯蛉術袞袈被袒袖袍袋覓規訪訝訣訥許設訟訛訢豉豚販責貫貨貪貧赧赦趾趺軛軟這逍通逗連速逝逐逕逞造透逢逖逛途"],
    ["b3a1", "部郭都酗野釵釦釣釧釭釩閉陪陵陳陸陰陴陶陷陬雀雪雩章竟頂頃魚鳥鹵鹿麥麻傢傍傅備傑傀傖傘傚最凱割剴創剩勞勝勛博厥啻喀喧啼喊喝喘喂喜喪喔喇喋喃喳單喟唾喲喚喻喬喱啾喉喫喙圍堯堪場堤堰報堡堝堠壹壺奠"],
    ["b440", "婷媚婿媒媛媧孳孱寒富寓寐尊尋就嵌嵐崴嵇巽幅帽幀幃幾廊廁廂廄弼彭復循徨惑惡悲悶惠愜愣惺愕惰惻惴慨惱愎惶愉愀愒戟扉掣掌描揀揩揉揆揍"],
    ["b4a1", "插揣提握揖揭揮捶援揪換摒揚揹敞敦敢散斑斐斯普晰晴晶景暑智晾晷曾替期朝棺棕棠棘棗椅棟棵森棧棹棒棲棣棋棍植椒椎棉棚楮棻款欺欽殘殖殼毯氮氯氬港游湔渡渲湧湊渠渥渣減湛湘渤湖湮渭渦湯渴湍渺測湃渝渾滋"],
    ["b540", "溉渙湎湣湄湲湩湟焙焚焦焰無然煮焜牌犄犀猶猥猴猩琺琪琳琢琥琵琶琴琯琛琦琨甥甦畫番痢痛痣痙痘痞痠登發皖皓皴盜睏短硝硬硯稍稈程稅稀窘"],
    ["b5a1", "窗窖童竣等策筆筐筒答筍筋筏筑粟粥絞結絨絕紫絮絲絡給絢絰絳善翔翕耋聒肅腕腔腋腑腎脹腆脾腌腓腴舒舜菩萃菸萍菠菅萋菁華菱菴著萊菰萌菌菽菲菊萸萎萄菜萇菔菟虛蛟蛙蛭蛔蛛蛤蛐蛞街裁裂袱覃視註詠評詞証詁"],
    ["b640", "詔詛詐詆訴診訶詖象貂貯貼貳貽賁費賀貴買貶貿貸越超趁跎距跋跚跑跌跛跆軻軸軼辜逮逵週逸進逶鄂郵鄉郾酣酥量鈔鈕鈣鈉鈞鈍鈐鈇鈑閔閏開閑"],
    ["b6a1", "間閒閎隊階隋陽隅隆隍陲隄雁雅雄集雇雯雲韌項順須飧飪飯飩飲飭馮馭黃黍黑亂傭債傲傳僅傾催傷傻傯僇剿剷剽募勦勤勢勣匯嗟嗨嗓嗦嗎嗜嗇嗑嗣嗤嗯嗚嗡嗅嗆嗥嗉園圓塞塑塘塗塚塔填塌塭塊塢塒塋奧嫁嫉嫌媾媽媼"],
    ["b740", "媳嫂媲嵩嵯幌幹廉廈弒彙徬微愚意慈感想愛惹愁愈慎慌慄慍愾愴愧愍愆愷戡戢搓搾搞搪搭搽搬搏搜搔損搶搖搗搆敬斟新暗暉暇暈暖暄暘暍會榔業"],
    ["b7a1", "楚楷楠楔極椰概楊楨楫楞楓楹榆楝楣楛歇歲毀殿毓毽溢溯滓溶滂源溝滇滅溥溘溼溺溫滑準溜滄滔溪溧溴煎煙煩煤煉照煜煬煦煌煥煞煆煨煖爺牒猷獅猿猾瑯瑚瑕瑟瑞瑁琿瑙瑛瑜當畸瘀痰瘁痲痱痺痿痴痳盞盟睛睫睦睞督"],
    ["b840", "睹睪睬睜睥睨睢矮碎碰碗碘碌碉硼碑碓硿祺祿禁萬禽稜稚稠稔稟稞窟窠筷節筠筮筧粱粳粵經絹綑綁綏絛置罩罪署義羨群聖聘肆肄腱腰腸腥腮腳腫"],
    ["b8a1", "腹腺腦舅艇蒂葷落萱葵葦葫葉葬葛萼萵葡董葩葭葆虞虜號蛹蜓蜈蜇蜀蛾蛻蜂蜃蜆蜊衙裟裔裙補裘裝裡裊裕裒覜解詫該詳試詩詰誇詼詣誠話誅詭詢詮詬詹詻訾詨豢貊貉賊資賈賄貲賃賂賅跡跟跨路跳跺跪跤跦躲較載軾輊"],
    ["b940", "辟農運遊道遂達逼違遐遇遏過遍遑逾遁鄒鄗酬酪酩釉鈷鉗鈸鈽鉀鈾鉛鉋鉤鉑鈴鉉鉍鉅鈹鈿鉚閘隘隔隕雍雋雉雊雷電雹零靖靴靶預頑頓頊頒頌飼飴"],
    ["b9a1", "飽飾馳馱馴髡鳩麂鼎鼓鼠僧僮僥僖僭僚僕像僑僱僎僩兢凳劃劂匱厭嗾嘀嘛嘗嗽嘔嘆嘉嘍嘎嗷嘖嘟嘈嘐嗶團圖塵塾境墓墊塹墅塽壽夥夢夤奪奩嫡嫦嫩嫗嫖嫘嫣孵寞寧寡寥實寨寢寤察對屢嶄嶇幛幣幕幗幔廓廖弊彆彰徹慇"],
    ["ba40", "愿態慷慢慣慟慚慘慵截撇摘摔撤摸摟摺摑摧搴摭摻敲斡旗旖暢暨暝榜榨榕槁榮槓構榛榷榻榫榴槐槍榭槌榦槃榣歉歌氳漳演滾漓滴漩漾漠漬漏漂漢"],
    ["baa1", "滿滯漆漱漸漲漣漕漫漯澈漪滬漁滲滌滷熔熙煽熊熄熒爾犒犖獄獐瑤瑣瑪瑰瑭甄疑瘧瘍瘋瘉瘓盡監瞄睽睿睡磁碟碧碳碩碣禎福禍種稱窪窩竭端管箕箋筵算箝箔箏箸箇箄粹粽精綻綰綜綽綾綠緊綴網綱綺綢綿綵綸維緒緇綬"],
    ["bb40", "罰翠翡翟聞聚肇腐膀膏膈膊腿膂臧臺與舔舞艋蓉蒿蓆蓄蒙蒞蒲蒜蓋蒸蓀蓓蒐蒼蓑蓊蜿蜜蜻蜢蜥蜴蜘蝕蜷蜩裳褂裴裹裸製裨褚裯誦誌語誣認誡誓誤"],
    ["bba1", "說誥誨誘誑誚誧豪貍貌賓賑賒赫趙趕跼輔輒輕輓辣遠遘遜遣遙遞遢遝遛鄙鄘鄞酵酸酷酴鉸銀銅銘銖鉻銓銜銨鉼銑閡閨閩閣閥閤隙障際雌雒需靼鞅韶頗領颯颱餃餅餌餉駁骯骰髦魁魂鳴鳶鳳麼鼻齊億儀僻僵價儂儈儉儅凜"],
    ["bc40", "劇劈劉劍劊勰厲嘮嘻嘹嘲嘿嘴嘩噓噎噗噴嘶嘯嘰墀墟增墳墜墮墩墦奭嬉嫻嬋嫵嬌嬈寮寬審寫層履嶝嶔幢幟幡廢廚廟廝廣廠彈影德徵慶慧慮慝慕憂"],
    ["bca1", "慼慰慫慾憧憐憫憎憬憚憤憔憮戮摩摯摹撞撲撈撐撰撥撓撕撩撒撮播撫撚撬撙撢撳敵敷數暮暫暴暱樣樟槨樁樞標槽模樓樊槳樂樅槭樑歐歎殤毅毆漿潼澄潑潦潔澆潭潛潸潮澎潺潰潤澗潘滕潯潠潟熟熬熱熨牖犛獎獗瑩璋璃"],
    ["bd40", "瑾璀畿瘠瘩瘟瘤瘦瘡瘢皚皺盤瞎瞇瞌瞑瞋磋磅確磊碾磕碼磐稿稼穀稽稷稻窯窮箭箱範箴篆篇篁箠篌糊締練緯緻緘緬緝編緣線緞緩綞緙緲緹罵罷羯"],
    ["bda1", "翩耦膛膜膝膠膚膘蔗蔽蔚蓮蔬蔭蔓蔑蔣蔡蔔蓬蔥蓿蔆螂蝴蝶蝠蝦蝸蝨蝙蝗蝌蝓衛衝褐複褒褓褕褊誼諒談諄誕請諸課諉諂調誰論諍誶誹諛豌豎豬賠賞賦賤賬賭賢賣賜質賡赭趟趣踫踐踝踢踏踩踟踡踞躺輝輛輟輩輦輪輜輞"],
    ["be40", "輥適遮遨遭遷鄰鄭鄧鄱醇醉醋醃鋅銻銷鋪銬鋤鋁銳銼鋒鋇鋰銲閭閱霄霆震霉靠鞍鞋鞏頡頫頜颳養餓餒餘駝駐駟駛駑駕駒駙骷髮髯鬧魅魄魷魯鴆鴉"],
    ["bea1", "鴃麩麾黎墨齒儒儘儔儐儕冀冪凝劑劓勳噙噫噹噩噤噸噪器噥噱噯噬噢噶壁墾壇壅奮嬝嬴學寰導彊憲憑憩憊懍憶憾懊懈戰擅擁擋撻撼據擄擇擂操撿擒擔撾整曆曉暹曄曇暸樽樸樺橙橫橘樹橄橢橡橋橇樵機橈歙歷氅濂澱澡"],
    ["bf40", "濃澤濁澧澳激澹澶澦澠澴熾燉燐燒燈燕熹燎燙燜燃燄獨璜璣璘璟璞瓢甌甍瘴瘸瘺盧盥瞠瞞瞟瞥磨磚磬磧禦積穎穆穌穋窺篙簑築篤篛篡篩篦糕糖縊"],
    ["bfa1", "縑縈縛縣縞縝縉縐罹羲翰翱翮耨膳膩膨臻興艘艙蕊蕙蕈蕨蕩蕃蕉蕭蕪蕞螃螟螞螢融衡褪褲褥褫褡親覦諦諺諫諱謀諜諧諮諾謁謂諷諭諳諶諼豫豭貓賴蹄踱踴蹂踹踵輻輯輸輳辨辦遵遴選遲遼遺鄴醒錠錶鋸錳錯錢鋼錫錄錚"],
    ["c040", "錐錦錡錕錮錙閻隧隨險雕霎霑霖霍霓霏靛靜靦鞘頰頸頻頷頭頹頤餐館餞餛餡餚駭駢駱骸骼髻髭鬨鮑鴕鴣鴦鴨鴒鴛默黔龍龜優償儡儲勵嚎嚀嚐嚅嚇"],
    ["c0a1", "嚏壕壓壑壎嬰嬪嬤孺尷屨嶼嶺嶽嶸幫彌徽應懂懇懦懋戲戴擎擊擘擠擰擦擬擱擢擭斂斃曙曖檀檔檄檢檜櫛檣橾檗檐檠歜殮毚氈濘濱濟濠濛濤濫濯澀濬濡濩濕濮濰燧營燮燦燥燭燬燴燠爵牆獰獲璩環璦璨癆療癌盪瞳瞪瞰瞬"],
    ["c140", "瞧瞭矯磷磺磴磯礁禧禪穗窿簇簍篾篷簌篠糠糜糞糢糟糙糝縮績繆縷縲繃縫總縱繅繁縴縹繈縵縿縯罄翳翼聱聲聰聯聳臆臃膺臂臀膿膽臉膾臨舉艱薪"],
    ["c1a1", "薄蕾薜薑薔薯薛薇薨薊虧蟀蟑螳蟒蟆螫螻螺蟈蟋褻褶襄褸褽覬謎謗謙講謊謠謝謄謐豁谿豳賺賽購賸賻趨蹉蹋蹈蹊轄輾轂轅輿避遽還邁邂邀鄹醣醞醜鍍鎂錨鍵鍊鍥鍋錘鍾鍬鍛鍰鍚鍔闊闋闌闈闆隱隸雖霜霞鞠韓顆颶餵騁"],
    ["c240", "駿鮮鮫鮪鮭鴻鴿麋黏點黜黝黛鼾齋叢嚕嚮壙壘嬸彝懣戳擴擲擾攆擺擻擷斷曜朦檳檬櫃檻檸櫂檮檯歟歸殯瀉瀋濾瀆濺瀑瀏燻燼燾燸獷獵璧璿甕癖癘"],
    ["c2a1", "癒瞽瞿瞻瞼礎禮穡穢穠竄竅簫簧簪簞簣簡糧織繕繞繚繡繒繙罈翹翻職聶臍臏舊藏薩藍藐藉薰薺薹薦蟯蟬蟲蟠覆覲觴謨謹謬謫豐贅蹙蹣蹦蹤蹟蹕軀轉轍邇邃邈醫醬釐鎔鎊鎖鎢鎳鎮鎬鎰鎘鎚鎗闔闖闐闕離雜雙雛雞霤鞣鞦"],
    ["c340", "鞭韹額顏題顎顓颺餾餿餽餮馥騎髁鬃鬆魏魎魍鯊鯉鯽鯈鯀鵑鵝鵠黠鼕鼬儳嚥壞壟壢寵龐廬懲懷懶懵攀攏曠曝櫥櫝櫚櫓瀛瀟瀨瀚瀝瀕瀘爆爍牘犢獸"],
    ["c3a1", "獺璽瓊瓣疇疆癟癡矇礙禱穫穩簾簿簸簽簷籀繫繭繹繩繪羅繳羶羹羸臘藩藝藪藕藤藥藷蟻蠅蠍蟹蟾襠襟襖襞譁譜識證譚譎譏譆譙贈贊蹼蹲躇蹶蹬蹺蹴轔轎辭邊邋醱醮鏡鏑鏟鏃鏈鏜鏝鏖鏢鏍鏘鏤鏗鏨關隴難霪霧靡韜韻類"],
    ["c440", "願顛颼饅饉騖騙鬍鯨鯧鯖鯛鶉鵡鵲鵪鵬麒麗麓麴勸嚨嚷嚶嚴嚼壤孀孃孽寶巉懸懺攘攔攙曦朧櫬瀾瀰瀲爐獻瓏癢癥礦礪礬礫竇競籌籃籍糯糰辮繽繼"],
    ["c4a1", "纂罌耀臚艦藻藹蘑藺蘆蘋蘇蘊蠔蠕襤覺觸議譬警譯譟譫贏贍躉躁躅躂醴釋鐘鐃鏽闡霰飄饒饑馨騫騰騷騵鰓鰍鹹麵黨鼯齟齣齡儷儸囁囀囂夔屬巍懼懾攝攜斕曩櫻欄櫺殲灌爛犧瓖瓔癩矓籐纏續羼蘗蘭蘚蠣蠢蠡蠟襪襬覽譴"],
    ["c540", "護譽贓躊躍躋轟辯醺鐮鐳鐵鐺鐸鐲鐫闢霸霹露響顧顥饗驅驃驀騾髏魔魑鰭鰥鶯鶴鷂鶸麝黯鼙齜齦齧儼儻囈囊囉孿巔巒彎懿攤權歡灑灘玀瓤疊癮癬"],
    ["c5a1", "禳籠籟聾聽臟襲襯觼讀贖贗躑躓轡酈鑄鑑鑒霽霾韃韁顫饕驕驍髒鬚鱉鰱鰾鰻鷓鷗鼴齬齪龔囌巖戀攣攫攪曬欐瓚竊籤籣籥纓纖纔臢蘸蘿蠱變邐邏鑣鑠鑤靨顯饜驚驛驗髓體髑鱔鱗鱖鷥麟黴囑壩攬灞癱癲矗罐羈蠶蠹衢讓讒"],
    ["c640", "讖艷贛釀鑪靂靈靄韆顰驟鬢魘鱟鷹鷺鹼鹽鼇齷齲廳欖灣籬籮蠻觀躡釁鑲鑰顱饞髖鬣黌灤矚讚鑷韉驢驥纜讜躪釅鑽鑾鑼鱷鱸黷豔鑿鸚爨驪鬱鸛鸞籲"],
    ["c940", "乂乜凵匚厂万丌乇亍囗兀屮彳丏冇与丮亓仂仉仈冘勼卬厹圠夃夬尐巿旡殳毌气爿丱丼仨仜仩仡仝仚刌匜卌圢圣夗夯宁宄尒尻屴屳帄庀庂忉戉扐氕"],
    ["c9a1", "氶汃氿氻犮犰玊禸肊阞伎优伬仵伔仱伀价伈伝伂伅伢伓伄仴伒冱刓刉刐劦匢匟卍厊吇囡囟圮圪圴夼妀奼妅奻奾奷奿孖尕尥屼屺屻屾巟幵庄异弚彴忕忔忏扜扞扤扡扦扢扙扠扚扥旯旮朾朹朸朻机朿朼朳氘汆汒汜汏汊汔汋"],
    ["ca40", "汌灱牞犴犵玎甪癿穵网艸艼芀艽艿虍襾邙邗邘邛邔阢阤阠阣佖伻佢佉体佤伾佧佒佟佁佘伭伳伿佡冏冹刜刞刡劭劮匉卣卲厎厏吰吷吪呔呅吙吜吥吘"],
    ["caa1", "吽呏呁吨吤呇囮囧囥坁坅坌坉坋坒夆奀妦妘妠妗妎妢妐妏妧妡宎宒尨尪岍岏岈岋岉岒岊岆岓岕巠帊帎庋庉庌庈庍弅弝彸彶忒忑忐忭忨忮忳忡忤忣忺忯忷忻怀忴戺抃抌抎抏抔抇扱扻扺扰抁抈扷扽扲扴攷旰旴旳旲旵杅杇"],
    ["cb40", "杙杕杌杈杝杍杚杋毐氙氚汸汧汫沄沋沏汱汯汩沚汭沇沕沜汦汳汥汻沎灴灺牣犿犽狃狆狁犺狅玕玗玓玔玒町甹疔疕皁礽耴肕肙肐肒肜芐芏芅芎芑芓"],
    ["cba1", "芊芃芄豸迉辿邟邡邥邞邧邠阰阨阯阭丳侘佼侅佽侀侇佶佴侉侄佷佌侗佪侚佹侁佸侐侜侔侞侒侂侕佫佮冞冼冾刵刲刳剆刱劼匊匋匼厒厔咇呿咁咑咂咈呫呺呾呥呬呴呦咍呯呡呠咘呣呧呤囷囹坯坲坭坫坱坰坶垀坵坻坳坴坢"],
    ["cc40", "坨坽夌奅妵妺姏姎妲姌姁妶妼姃姖妱妽姀姈妴姇孢孥宓宕屄屇岮岤岠岵岯岨岬岟岣岭岢岪岧岝岥岶岰岦帗帔帙弨弢弣弤彔徂彾彽忞忥怭怦怙怲怋"],
    ["cca1", "怴怊怗怳怚怞怬怢怍怐怮怓怑怌怉怜戔戽抭抴拑抾抪抶拊抮抳抯抻抩抰抸攽斨斻昉旼昄昒昈旻昃昋昍昅旽昑昐曶朊枅杬枎枒杶杻枘枆构杴枍枌杺枟枑枙枃杽极杸杹枔欥殀歾毞氝沓泬泫泮泙沶泔沭泧沷泐泂沺泃泆泭泲"],
    ["cd40", "泒泝沴沊沝沀泞泀洰泍泇沰泹泏泩泑炔炘炅炓炆炄炑炖炂炚炃牪狖狋狘狉狜狒狔狚狌狑玤玡玭玦玢玠玬玝瓝瓨甿畀甾疌疘皯盳盱盰盵矸矼矹矻矺"],
    ["cda1", "矷祂礿秅穸穻竻籵糽耵肏肮肣肸肵肭舠芠苀芫芚芘芛芵芧芮芼芞芺芴芨芡芩苂芤苃芶芢虰虯虭虮豖迒迋迓迍迖迕迗邲邴邯邳邰阹阽阼阺陃俍俅俓侲俉俋俁俔俜俙侻侳俛俇俖侺俀侹俬剄剉勀勂匽卼厗厖厙厘咺咡咭咥哏"],
    ["ce40", "哃茍咷咮哖咶哅哆咠呰咼咢咾呲哞咰垵垞垟垤垌垗垝垛垔垘垏垙垥垚垕壴复奓姡姞姮娀姱姝姺姽姼姶姤姲姷姛姩姳姵姠姾姴姭宨屌峐峘峌峗峋峛"],
    ["cea1", "峞峚峉峇峊峖峓峔峏峈峆峎峟峸巹帡帢帣帠帤庰庤庢庛庣庥弇弮彖徆怷怹恔恲恞恅恓恇恉恛恌恀恂恟怤恄恘恦恮扂扃拏挍挋拵挎挃拫拹挏挌拸拶挀挓挔拺挕拻拰敁敃斪斿昶昡昲昵昜昦昢昳昫昺昝昴昹昮朏朐柁柲柈枺"],
    ["cf40", "柜枻柸柘柀枷柅柫柤柟枵柍枳柷柶柮柣柂枹柎柧柰枲柼柆柭柌枮柦柛柺柉柊柃柪柋欨殂殄殶毖毘毠氠氡洨洴洭洟洼洿洒洊泚洳洄洙洺洚洑洀洝浂"],
    ["cfa1", "洁洘洷洃洏浀洇洠洬洈洢洉洐炷炟炾炱炰炡炴炵炩牁牉牊牬牰牳牮狊狤狨狫狟狪狦狣玅珌珂珈珅玹玶玵玴珫玿珇玾珃珆玸珋瓬瓮甮畇畈疧疪癹盄眈眃眄眅眊盷盻盺矧矨砆砑砒砅砐砏砎砉砃砓祊祌祋祅祄秕种秏秖秎窀"],
    ["d040", "穾竑笀笁籺籸籹籿粀粁紃紈紁罘羑羍羾耇耎耏耔耷胘胇胠胑胈胂胐胅胣胙胜胊胕胉胏胗胦胍臿舡芔苙苾苹茇苨茀苕茺苫苖苴苬苡苲苵茌苻苶苰苪"],
    ["d0a1", "苤苠苺苳苭虷虴虼虳衁衎衧衪衩觓訄訇赲迣迡迮迠郱邽邿郕郅邾郇郋郈釔釓陔陏陑陓陊陎倞倅倇倓倢倰倛俵俴倳倷倬俶俷倗倜倠倧倵倯倱倎党冔冓凊凄凅凈凎剡剚剒剞剟剕剢勍匎厞唦哢唗唒哧哳哤唚哿唄唈哫唑唅哱"],
    ["d140", "唊哻哷哸哠唎唃唋圁圂埌堲埕埒垺埆垽垼垸垶垿埇埐垹埁夎奊娙娖娭娮娕娏娗娊娞娳孬宧宭宬尃屖屔峬峿峮峱峷崀峹帩帨庨庮庪庬弳弰彧恝恚恧"],
    ["d1a1", "恁悢悈悀悒悁悝悃悕悛悗悇悜悎戙扆拲挐捖挬捄捅挶捃揤挹捋捊挼挩捁挴捘捔捙挭捇挳捚捑挸捗捀捈敊敆旆旃旄旂晊晟晇晑朒朓栟栚桉栲栳栻桋桏栖栱栜栵栫栭栯桎桄栴栝栒栔栦栨栮桍栺栥栠欬欯欭欱欴歭肂殈毦毤"],
    ["d240", "毨毣毢毧氥浺浣浤浶洍浡涒浘浢浭浯涑涍淯浿涆浞浧浠涗浰浼浟涂涘洯浨涋浾涀涄洖涃浻浽浵涐烜烓烑烝烋缹烢烗烒烞烠烔烍烅烆烇烚烎烡牂牸"],
    ["d2a1", "牷牶猀狺狴狾狶狳狻猁珓珙珥珖玼珧珣珩珜珒珛珔珝珚珗珘珨瓞瓟瓴瓵甡畛畟疰痁疻痄痀疿疶疺皊盉眝眛眐眓眒眣眑眕眙眚眢眧砣砬砢砵砯砨砮砫砡砩砳砪砱祔祛祏祜祓祒祑秫秬秠秮秭秪秜秞秝窆窉窅窋窌窊窇竘笐"],
    ["d340", "笄笓笅笏笈笊笎笉笒粄粑粊粌粈粍粅紞紝紑紎紘紖紓紟紒紏紌罜罡罞罠罝罛羖羒翃翂翀耖耾耹胺胲胹胵脁胻脀舁舯舥茳茭荄茙荑茥荖茿荁茦茜茢"],
    ["d3a1", "荂荎茛茪茈茼荍茖茤茠茷茯茩荇荅荌荓茞茬荋茧荈虓虒蚢蚨蚖蚍蚑蚞蚇蚗蚆蚋蚚蚅蚥蚙蚡蚧蚕蚘蚎蚝蚐蚔衃衄衭衵衶衲袀衱衿衯袃衾衴衼訒豇豗豻貤貣赶赸趵趷趶軑軓迾迵适迿迻逄迼迶郖郠郙郚郣郟郥郘郛郗郜郤酐"],
    ["d440", "酎酏釕釢釚陜陟隼飣髟鬯乿偰偪偡偞偠偓偋偝偲偈偍偁偛偊偢倕偅偟偩偫偣偤偆偀偮偳偗偑凐剫剭剬剮勖勓匭厜啵啶唼啍啐唴唪啑啢唶唵唰啒啅"],
    ["d4a1", "唌唲啥啎唹啈唭唻啀啋圊圇埻堔埢埶埜埴堀埭埽堈埸堋埳埏堇埮埣埲埥埬埡堎埼堐埧堁堌埱埩埰堍堄奜婠婘婕婧婞娸娵婭婐婟婥婬婓婤婗婃婝婒婄婛婈媎娾婍娹婌婰婩婇婑婖婂婜孲孮寁寀屙崞崋崝崚崠崌崨崍崦崥崏"],
    ["d540", "崰崒崣崟崮帾帴庱庴庹庲庳弶弸徛徖徟悊悐悆悾悰悺惓惔惏惤惙惝惈悱惛悷惊悿惃惍惀挲捥掊掂捽掽掞掭掝掗掫掎捯掇掐据掯捵掜捭掮捼掤挻掟"],
    ["d5a1", "捸掅掁掑掍捰敓旍晥晡晛晙晜晢朘桹梇梐梜桭桮梮梫楖桯梣梬梩桵桴梲梏桷梒桼桫桲梪梀桱桾梛梖梋梠梉梤桸桻梑梌梊桽欶欳欷欸殑殏殍殎殌氪淀涫涴涳湴涬淩淢涷淶淔渀淈淠淟淖涾淥淜淝淛淴淊涽淭淰涺淕淂淏淉"],
    ["d640", "淐淲淓淽淗淍淣涻烺焍烷焗烴焌烰焄烳焐烼烿焆焓焀烸烶焋焂焎牾牻牼牿猝猗猇猑猘猊猈狿猏猞玈珶珸珵琄琁珽琇琀珺珼珿琌琋珴琈畤畣痎痒痏"],
    ["d6a1", "痋痌痑痐皏皉盓眹眯眭眱眲眴眳眽眥眻眵硈硒硉硍硊硌砦硅硐祤祧祩祪祣祫祡离秺秸秶秷窏窔窐笵筇笴笥笰笢笤笳笘笪笝笱笫笭笯笲笸笚笣粔粘粖粣紵紽紸紶紺絅紬紩絁絇紾紿絊紻紨罣羕羜羝羛翊翋翍翐翑翇翏翉耟"],
    ["d740", "耞耛聇聃聈脘脥脙脛脭脟脬脞脡脕脧脝脢舑舸舳舺舴舲艴莐莣莨莍荺荳莤荴莏莁莕莙荵莔莩荽莃莌莝莛莪莋荾莥莯莈莗莰荿莦莇莮荶莚虙虖蚿蚷"],
    ["d7a1", "蛂蛁蛅蚺蚰蛈蚹蚳蚸蛌蚴蚻蚼蛃蚽蚾衒袉袕袨袢袪袚袑袡袟袘袧袙袛袗袤袬袌袓袎覂觖觙觕訰訧訬訞谹谻豜豝豽貥赽赻赹趼跂趹趿跁軘軞軝軜軗軠軡逤逋逑逜逌逡郯郪郰郴郲郳郔郫郬郩酖酘酚酓酕釬釴釱釳釸釤釹釪"],
    ["d840", "釫釷釨釮镺閆閈陼陭陫陱陯隿靪頄飥馗傛傕傔傞傋傣傃傌傎傝偨傜傒傂傇兟凔匒匑厤厧喑喨喥喭啷噅喢喓喈喏喵喁喣喒喤啽喌喦啿喕喡喎圌堩堷"],
    ["d8a1", "堙堞堧堣堨埵塈堥堜堛堳堿堶堮堹堸堭堬堻奡媯媔媟婺媢媞婸媦婼媥媬媕媮娷媄媊媗媃媋媩婻婽媌媜媏媓媝寪寍寋寔寑寊寎尌尰崷嵃嵫嵁嵋崿崵嵑嵎嵕崳崺嵒崽崱嵙嵂崹嵉崸崼崲崶嵀嵅幄幁彘徦徥徫惉悹惌惢惎惄愔"],
    ["d940", "惲愊愖愅惵愓惸惼惾惁愃愘愝愐惿愄愋扊掔掱掰揎揥揨揯揃撝揳揊揠揶揕揲揵摡揟掾揝揜揄揘揓揂揇揌揋揈揰揗揙攲敧敪敤敜敨敥斌斝斞斮旐旒"],
    ["d9a1", "晼晬晻暀晱晹晪晲朁椌棓椄棜椪棬棪棱椏棖棷棫棤棶椓椐棳棡椇棌椈楰梴椑棯棆椔棸棐棽棼棨椋椊椗棎棈棝棞棦棴棑椆棔棩椕椥棇欹欻欿欼殔殗殙殕殽毰毲毳氰淼湆湇渟湉溈渼渽湅湢渫渿湁湝湳渜渳湋湀湑渻渃渮湞"],
    ["da40", "湨湜湡渱渨湠湱湫渹渢渰湓湥渧湸湤湷湕湹湒湦渵渶湚焠焞焯烻焮焱焣焥焢焲焟焨焺焛牋牚犈犉犆犅犋猒猋猰猢猱猳猧猲猭猦猣猵猌琮琬琰琫琖"],
    ["daa1", "琚琡琭琱琤琣琝琩琠琲瓻甯畯畬痧痚痡痦痝痟痤痗皕皒盚睆睇睄睍睅睊睎睋睌矞矬硠硤硥硜硭硱硪确硰硩硨硞硢祴祳祲祰稂稊稃稌稄窙竦竤筊笻筄筈筌筎筀筘筅粢粞粨粡絘絯絣絓絖絧絪絏絭絜絫絒絔絩絑絟絎缾缿罥"],
    ["db40", "罦羢羠羡翗聑聏聐胾胔腃腊腒腏腇脽腍脺臦臮臷臸臹舄舼舽舿艵茻菏菹萣菀菨萒菧菤菼菶萐菆菈菫菣莿萁菝菥菘菿菡菋菎菖菵菉萉萏菞萑萆菂菳"],
    ["dba1", "菕菺菇菑菪萓菃菬菮菄菻菗菢萛菛菾蛘蛢蛦蛓蛣蛚蛪蛝蛫蛜蛬蛩蛗蛨蛑衈衖衕袺裗袹袸裀袾袶袼袷袽袲褁裉覕覘覗觝觚觛詎詍訹詙詀詗詘詄詅詒詈詑詊詌詏豟貁貀貺貾貰貹貵趄趀趉跘跓跍跇跖跜跏跕跙跈跗跅軯軷軺"],
    ["dc40", "軹軦軮軥軵軧軨軶軫軱軬軴軩逭逴逯鄆鄬鄄郿郼鄈郹郻鄁鄀鄇鄅鄃酡酤酟酢酠鈁鈊鈥鈃鈚鈦鈏鈌鈀鈒釿釽鈆鈄鈧鈂鈜鈤鈙鈗鈅鈖镻閍閌閐隇陾隈"],
    ["dca1", "隉隃隀雂雈雃雱雰靬靰靮頇颩飫鳦黹亃亄亶傽傿僆傮僄僊傴僈僂傰僁傺傱僋僉傶傸凗剺剸剻剼嗃嗛嗌嗐嗋嗊嗝嗀嗔嗄嗩喿嗒喍嗏嗕嗢嗖嗈嗲嗍嗙嗂圔塓塨塤塏塍塉塯塕塎塝塙塥塛堽塣塱壼嫇嫄嫋媺媸媱媵媰媿嫈媻嫆"],
    ["dd40", "媷嫀嫊媴媶嫍媹媐寖寘寙尟尳嵱嵣嵊嵥嵲嵬嵞嵨嵧嵢巰幏幎幊幍幋廅廌廆廋廇彀徯徭惷慉慊愫慅愶愲愮慆愯慏愩慀戠酨戣戥戤揅揱揫搐搒搉搠搤"],
    ["dda1", "搳摃搟搕搘搹搷搢搣搌搦搰搨摁搵搯搊搚摀搥搧搋揧搛搮搡搎敯斒旓暆暌暕暐暋暊暙暔晸朠楦楟椸楎楢楱椿楅楪椹楂楗楙楺楈楉椵楬椳椽楥棰楸椴楩楀楯楄楶楘楁楴楌椻楋椷楜楏楑椲楒椯楻椼歆歅歃歂歈歁殛嗀毻毼"],
    ["de40", "毹毷毸溛滖滈溏滀溟溓溔溠溱溹滆滒溽滁溞滉溷溰滍溦滏溲溾滃滜滘溙溒溎溍溤溡溿溳滐滊溗溮溣煇煔煒煣煠煁煝煢煲煸煪煡煂煘煃煋煰煟煐煓"],
    ["dea1", "煄煍煚牏犍犌犑犐犎猼獂猻猺獀獊獉瑄瑊瑋瑒瑑瑗瑀瑏瑐瑎瑂瑆瑍瑔瓡瓿瓾瓽甝畹畷榃痯瘏瘃痷痾痼痹痸瘐痻痶痭痵痽皙皵盝睕睟睠睒睖睚睩睧睔睙睭矠碇碚碔碏碄碕碅碆碡碃硹碙碀碖硻祼禂祽祹稑稘稙稒稗稕稢稓"],
    ["df40", "稛稐窣窢窞竫筦筤筭筴筩筲筥筳筱筰筡筸筶筣粲粴粯綈綆綀綍絿綅絺綎絻綃絼綌綔綄絽綒罭罫罧罨罬羦羥羧翛翜耡腤腠腷腜腩腛腢腲朡腞腶腧腯"],
    ["dfa1", "腄腡舝艉艄艀艂艅蓱萿葖葶葹蒏蒍葥葑葀蒆葧萰葍葽葚葙葴葳葝蔇葞萷萺萴葺葃葸萲葅萩菙葋萯葂萭葟葰萹葎葌葒葯蓅蒎萻葇萶萳葨葾葄萫葠葔葮葐蜋蜄蛷蜌蛺蛖蛵蝍蛸蜎蜉蜁蛶蜍蜅裖裋裍裎裞裛裚裌裐覅覛觟觥觤"],
    ["e040", "觡觠觢觜触詶誆詿詡訿詷誂誄詵誃誁詴詺谼豋豊豥豤豦貆貄貅賌赨赩趑趌趎趏趍趓趔趐趒跰跠跬跱跮跐跩跣跢跧跲跫跴輆軿輁輀輅輇輈輂輋遒逿"],
    ["e0a1", "遄遉逽鄐鄍鄏鄑鄖鄔鄋鄎酮酯鉈鉒鈰鈺鉦鈳鉥鉞銃鈮鉊鉆鉭鉬鉏鉠鉧鉯鈶鉡鉰鈱鉔鉣鉐鉲鉎鉓鉌鉖鈲閟閜閞閛隒隓隑隗雎雺雽雸雵靳靷靸靲頏頍頎颬飶飹馯馲馰馵骭骫魛鳪鳭鳧麀黽僦僔僗僨僳僛僪僝僤僓僬僰僯僣僠"],
    ["e140", "凘劀劁勩勫匰厬嘧嘕嘌嘒嗼嘏嘜嘁嘓嘂嗺嘝嘄嗿嗹墉塼墐墘墆墁塿塴墋塺墇墑墎塶墂墈塻墔墏壾奫嫜嫮嫥嫕嫪嫚嫭嫫嫳嫢嫠嫛嫬嫞嫝嫙嫨嫟孷寠"],
    ["e1a1", "寣屣嶂嶀嵽嶆嵺嶁嵷嶊嶉嶈嵾嵼嶍嵹嵿幘幙幓廘廑廗廎廜廕廙廒廔彄彃彯徶愬愨慁慞慱慳慒慓慲慬憀慴慔慺慛慥愻慪慡慖戩戧戫搫摍摛摝摴摶摲摳摽摵摦撦摎撂摞摜摋摓摠摐摿搿摬摫摙摥摷敳斠暡暠暟朅朄朢榱榶槉"],
    ["e240", "榠槎榖榰榬榼榑榙榎榧榍榩榾榯榿槄榽榤槔榹槊榚槏榳榓榪榡榞槙榗榐槂榵榥槆歊歍歋殞殟殠毃毄毾滎滵滱漃漥滸漷滻漮漉潎漙漚漧漘漻漒滭漊"],
    ["e2a1", "漶潳滹滮漭潀漰漼漵滫漇漎潃漅滽滶漹漜滼漺漟漍漞漈漡熇熐熉熀熅熂熏煻熆熁熗牄牓犗犕犓獃獍獑獌瑢瑳瑱瑵瑲瑧瑮甀甂甃畽疐瘖瘈瘌瘕瘑瘊瘔皸瞁睼瞅瞂睮瞀睯睾瞃碲碪碴碭碨硾碫碞碥碠碬碢碤禘禊禋禖禕禔禓"],
    ["e340", "禗禈禒禐稫穊稰稯稨稦窨窫窬竮箈箜箊箑箐箖箍箌箛箎箅箘劄箙箤箂粻粿粼粺綧綷緂綣綪緁緀緅綝緎緄緆緋緌綯綹綖綼綟綦綮綩綡緉罳翢翣翥翞"],
    ["e3a1", "耤聝聜膉膆膃膇膍膌膋舕蒗蒤蒡蒟蒺蓎蓂蒬蒮蒫蒹蒴蓁蓍蒪蒚蒱蓐蒝蒧蒻蒢蒔蓇蓌蒛蒩蒯蒨蓖蒘蒶蓏蒠蓗蓔蓒蓛蒰蒑虡蜳蜣蜨蝫蝀蜮蜞蜡蜙蜛蝃蜬蝁蜾蝆蜠蜲蜪蜭蜼蜒蜺蜱蜵蝂蜦蜧蜸蜤蜚蜰蜑裷裧裱裲裺裾裮裼裶裻"],
    ["e440", "裰裬裫覝覡覟覞觩觫觨誫誙誋誒誏誖谽豨豩賕賏賗趖踉踂跿踍跽踊踃踇踆踅跾踀踄輐輑輎輍鄣鄜鄠鄢鄟鄝鄚鄤鄡鄛酺酲酹酳銥銤鉶銛鉺銠銔銪銍"],
    ["e4a1", "銦銚銫鉹銗鉿銣鋮銎銂銕銢鉽銈銡銊銆銌銙銧鉾銇銩銝銋鈭隞隡雿靘靽靺靾鞃鞀鞂靻鞄鞁靿韎韍頖颭颮餂餀餇馝馜駃馹馻馺駂馽駇骱髣髧鬾鬿魠魡魟鳱鳲鳵麧僿儃儰僸儆儇僶僾儋儌僽儊劋劌勱勯噈噂噌嘵噁噊噉噆噘"],
    ["e540", "噚噀嘳嘽嘬嘾嘸嘪嘺圚墫墝墱墠墣墯墬墥墡壿嫿嫴嫽嫷嫶嬃嫸嬂嫹嬁嬇嬅嬏屧嶙嶗嶟嶒嶢嶓嶕嶠嶜嶡嶚嶞幩幝幠幜緳廛廞廡彉徲憋憃慹憱憰憢憉"],
    ["e5a1", "憛憓憯憭憟憒憪憡憍慦憳戭摮摰撖撠撅撗撜撏撋撊撌撣撟摨撱撘敶敺敹敻斲斳暵暰暩暲暷暪暯樀樆樗槥槸樕槱槤樠槿槬槢樛樝槾樧槲槮樔槷槧橀樈槦槻樍槼槫樉樄樘樥樏槶樦樇槴樖歑殥殣殢殦氁氀毿氂潁漦潾澇濆澒"],
    ["e640", "澍澉澌潢潏澅潚澖潶潬澂潕潲潒潐潗澔澓潝漀潡潫潽潧澐潓澋潩潿澕潣潷潪潻熲熯熛熰熠熚熩熵熝熥熞熤熡熪熜熧熳犘犚獘獒獞獟獠獝獛獡獚獙"],
    ["e6a1", "獢璇璉璊璆璁瑽璅璈瑼瑹甈甇畾瘥瘞瘙瘝瘜瘣瘚瘨瘛皜皝皞皛瞍瞏瞉瞈磍碻磏磌磑磎磔磈磃磄磉禚禡禠禜禢禛歶稹窲窴窳箷篋箾箬篎箯箹篊箵糅糈糌糋緷緛緪緧緗緡縃緺緦緶緱緰緮緟罶羬羰羭翭翫翪翬翦翨聤聧膣膟"],
    ["e740", "膞膕膢膙膗舖艏艓艒艐艎艑蔤蔻蔏蔀蔩蔎蔉蔍蔟蔊蔧蔜蓻蔫蓺蔈蔌蓴蔪蓲蔕蓷蓫蓳蓼蔒蓪蓩蔖蓾蔨蔝蔮蔂蓽蔞蓶蔱蔦蓧蓨蓰蓯蓹蔘蔠蔰蔋蔙蔯虢"],
    ["e7a1", "蝖蝣蝤蝷蟡蝳蝘蝔蝛蝒蝡蝚蝑蝞蝭蝪蝐蝎蝟蝝蝯蝬蝺蝮蝜蝥蝏蝻蝵蝢蝧蝩衚褅褌褔褋褗褘褙褆褖褑褎褉覢覤覣觭觰觬諏諆誸諓諑諔諕誻諗誾諀諅諘諃誺誽諙谾豍貏賥賟賙賨賚賝賧趠趜趡趛踠踣踥踤踮踕踛踖踑踙踦踧"],
    ["e840", "踔踒踘踓踜踗踚輬輤輘輚輠輣輖輗遳遰遯遧遫鄯鄫鄩鄪鄲鄦鄮醅醆醊醁醂醄醀鋐鋃鋄鋀鋙銶鋏鋱鋟鋘鋩鋗鋝鋌鋯鋂鋨鋊鋈鋎鋦鋍鋕鋉鋠鋞鋧鋑鋓"],
    ["e8a1", "銵鋡鋆銴镼閬閫閮閰隤隢雓霅霈霂靚鞊鞎鞈韐韏頞頝頦頩頨頠頛頧颲餈飺餑餔餖餗餕駜駍駏駓駔駎駉駖駘駋駗駌骳髬髫髳髲髱魆魃魧魴魱魦魶魵魰魨魤魬鳼鳺鳽鳿鳷鴇鴀鳹鳻鴈鴅鴄麃黓鼏鼐儜儓儗儚儑凞匴叡噰噠噮"],
    ["e940", "噳噦噣噭噲噞噷圜圛壈墽壉墿墺壂墼壆嬗嬙嬛嬡嬔嬓嬐嬖嬨嬚嬠嬞寯嶬嶱嶩嶧嶵嶰嶮嶪嶨嶲嶭嶯嶴幧幨幦幯廩廧廦廨廥彋徼憝憨憖懅憴懆懁懌憺"],
    ["e9a1", "憿憸憌擗擖擐擏擉撽撉擃擛擳擙攳敿敼斢曈暾曀曊曋曏暽暻暺曌朣樴橦橉橧樲橨樾橝橭橶橛橑樨橚樻樿橁橪橤橐橏橔橯橩橠樼橞橖橕橍橎橆歕歔歖殧殪殫毈毇氄氃氆澭濋澣濇澼濎濈潞濄澽澞濊澨瀄澥澮澺澬澪濏澿澸"],
    ["ea40", "澢濉澫濍澯澲澰燅燂熿熸燖燀燁燋燔燊燇燏熽燘熼燆燚燛犝犞獩獦獧獬獥獫獪瑿璚璠璔璒璕璡甋疀瘯瘭瘱瘽瘳瘼瘵瘲瘰皻盦瞚瞝瞡瞜瞛瞢瞣瞕瞙"],
    ["eaa1", "瞗磝磩磥磪磞磣磛磡磢磭磟磠禤穄穈穇窶窸窵窱窷篞篣篧篝篕篥篚篨篹篔篪篢篜篫篘篟糒糔糗糐糑縒縡縗縌縟縠縓縎縜縕縚縢縋縏縖縍縔縥縤罃罻罼罺羱翯耪耩聬膱膦膮膹膵膫膰膬膴膲膷膧臲艕艖艗蕖蕅蕫蕍蕓蕡蕘"],
    ["eb40", "蕀蕆蕤蕁蕢蕄蕑蕇蕣蔾蕛蕱蕎蕮蕵蕕蕧蕠薌蕦蕝蕔蕥蕬虣虥虤螛螏螗螓螒螈螁螖螘蝹螇螣螅螐螑螝螄螔螜螚螉褞褦褰褭褮褧褱褢褩褣褯褬褟觱諠"],
    ["eba1", "諢諲諴諵諝謔諤諟諰諈諞諡諨諿諯諻貑貒貐賵賮賱賰賳赬赮趥趧踳踾踸蹀蹅踶踼踽蹁踰踿躽輶輮輵輲輹輷輴遶遹遻邆郺鄳鄵鄶醓醐醑醍醏錧錞錈錟錆錏鍺錸錼錛錣錒錁鍆錭錎錍鋋錝鋺錥錓鋹鋷錴錂錤鋿錩錹錵錪錔錌"],
    ["ec40", "錋鋾錉錀鋻錖閼闍閾閹閺閶閿閵閽隩雔霋霒霐鞙鞗鞔韰韸頵頯頲餤餟餧餩馞駮駬駥駤駰駣駪駩駧骹骿骴骻髶髺髹髷鬳鮀鮅鮇魼魾魻鮂鮓鮒鮐魺鮕"],
    ["eca1", "魽鮈鴥鴗鴠鴞鴔鴩鴝鴘鴢鴐鴙鴟麈麆麇麮麭黕黖黺鼒鼽儦儥儢儤儠儩勴嚓嚌嚍嚆嚄嚃噾嚂噿嚁壖壔壏壒嬭嬥嬲嬣嬬嬧嬦嬯嬮孻寱寲嶷幬幪徾徻懃憵憼懧懠懥懤懨懞擯擩擣擫擤擨斁斀斶旚曒檍檖檁檥檉檟檛檡檞檇檓檎"],
    ["ed40", "檕檃檨檤檑橿檦檚檅檌檒歛殭氉濌澩濴濔濣濜濭濧濦濞濲濝濢濨燡燱燨燲燤燰燢獳獮獯璗璲璫璐璪璭璱璥璯甐甑甒甏疄癃癈癉癇皤盩瞵瞫瞲瞷瞶"],
    ["eda1", "瞴瞱瞨矰磳磽礂磻磼磲礅磹磾礄禫禨穜穛穖穘穔穚窾竀竁簅簏篲簀篿篻簎篴簋篳簂簉簃簁篸篽簆篰篱簐簊糨縭縼繂縳顈縸縪繉繀繇縩繌縰縻縶繄縺罅罿罾罽翴翲耬膻臄臌臊臅臇膼臩艛艚艜薃薀薏薧薕薠薋薣蕻薤薚薞"],
    ["ee40", "蕷蕼薉薡蕺蕸蕗薎薖薆薍薙薝薁薢薂薈薅蕹蕶薘薐薟虨螾螪螭蟅螰螬螹螵螼螮蟉蟃蟂蟌螷螯蟄蟊螴螶螿螸螽蟞螲褵褳褼褾襁襒褷襂覭覯覮觲觳謞"],
    ["eea1", "謘謖謑謅謋謢謏謒謕謇謍謈謆謜謓謚豏豰豲豱豯貕貔賹赯蹎蹍蹓蹐蹌蹇轃轀邅遾鄸醚醢醛醙醟醡醝醠鎡鎃鎯鍤鍖鍇鍼鍘鍜鍶鍉鍐鍑鍠鍭鎏鍌鍪鍹鍗鍕鍒鍏鍱鍷鍻鍡鍞鍣鍧鎀鍎鍙闇闀闉闃闅閷隮隰隬霠霟霘霝霙鞚鞡鞜"],
    ["ef40", "鞞鞝韕韔韱顁顄顊顉顅顃餥餫餬餪餳餲餯餭餱餰馘馣馡騂駺駴駷駹駸駶駻駽駾駼騃骾髾髽鬁髼魈鮚鮨鮞鮛鮦鮡鮥鮤鮆鮢鮠鮯鴳鵁鵧鴶鴮鴯鴱鴸鴰"],
    ["efa1", "鵅鵂鵃鴾鴷鵀鴽翵鴭麊麉麍麰黈黚黻黿鼤鼣鼢齔龠儱儭儮嚘嚜嚗嚚嚝嚙奰嬼屩屪巀幭幮懘懟懭懮懱懪懰懫懖懩擿攄擽擸攁攃擼斔旛曚曛曘櫅檹檽櫡櫆檺檶檷櫇檴檭歞毉氋瀇瀌瀍瀁瀅瀔瀎濿瀀濻瀦濼濷瀊爁燿燹爃燽獶"],
    ["f040", "璸瓀璵瓁璾璶璻瓂甔甓癜癤癙癐癓癗癚皦皽盬矂瞺磿礌礓礔礉礐礒礑禭禬穟簜簩簙簠簟簭簝簦簨簢簥簰繜繐繖繣繘繢繟繑繠繗繓羵羳翷翸聵臑臒"],
    ["f0a1", "臐艟艞薴藆藀藃藂薳薵薽藇藄薿藋藎藈藅薱薶藒蘤薸薷薾虩蟧蟦蟢蟛蟫蟪蟥蟟蟳蟤蟔蟜蟓蟭蟘蟣螤蟗蟙蠁蟴蟨蟝襓襋襏襌襆襐襑襉謪謧謣謳謰謵譇謯謼謾謱謥謷謦謶謮謤謻謽謺豂豵貙貘貗賾贄贂贀蹜蹢蹠蹗蹖蹞蹥蹧"],
    ["f140", "蹛蹚蹡蹝蹩蹔轆轇轈轋鄨鄺鄻鄾醨醥醧醯醪鎵鎌鎒鎷鎛鎝鎉鎧鎎鎪鎞鎦鎕鎈鎙鎟鎍鎱鎑鎲鎤鎨鎴鎣鎥闒闓闑隳雗雚巂雟雘雝霣霢霥鞬鞮鞨鞫鞤鞪"],
    ["f1a1", "鞢鞥韗韙韖韘韺顐顑顒颸饁餼餺騏騋騉騍騄騑騊騅騇騆髀髜鬈鬄鬅鬩鬵魊魌魋鯇鯆鯃鮿鯁鮵鮸鯓鮶鯄鮹鮽鵜鵓鵏鵊鵛鵋鵙鵖鵌鵗鵒鵔鵟鵘鵚麎麌黟鼁鼀鼖鼥鼫鼪鼩鼨齌齕儴儵劖勷厴嚫嚭嚦嚧嚪嚬壚壝壛夒嬽嬾嬿巃幰"],
    ["f240", "徿懻攇攐攍攉攌攎斄旞旝曞櫧櫠櫌櫑櫙櫋櫟櫜櫐櫫櫏櫍櫞歠殰氌瀙瀧瀠瀖瀫瀡瀢瀣瀩瀗瀤瀜瀪爌爊爇爂爅犥犦犤犣犡瓋瓅璷瓃甖癠矉矊矄矱礝礛"],
    ["f2a1", "礡礜礗礞禰穧穨簳簼簹簬簻糬糪繶繵繸繰繷繯繺繲繴繨罋罊羃羆羷翽翾聸臗臕艤艡艣藫藱藭藙藡藨藚藗藬藲藸藘藟藣藜藑藰藦藯藞藢蠀蟺蠃蟶蟷蠉蠌蠋蠆蟼蠈蟿蠊蠂襢襚襛襗襡襜襘襝襙覈覷覶觶譐譈譊譀譓譖譔譋譕"],
    ["f340", "譑譂譒譗豃豷豶貚贆贇贉趬趪趭趫蹭蹸蹳蹪蹯蹻軂轒轑轏轐轓辴酀鄿醰醭鏞鏇鏏鏂鏚鏐鏹鏬鏌鏙鎩鏦鏊鏔鏮鏣鏕鏄鏎鏀鏒鏧镽闚闛雡霩霫霬霨霦"],
    ["f3a1", "鞳鞷鞶韝韞韟顜顙顝顗颿颽颻颾饈饇饃馦馧騚騕騥騝騤騛騢騠騧騣騞騜騔髂鬋鬊鬎鬌鬷鯪鯫鯠鯞鯤鯦鯢鯰鯔鯗鯬鯜鯙鯥鯕鯡鯚鵷鶁鶊鶄鶈鵱鶀鵸鶆鶋鶌鵽鵫鵴鵵鵰鵩鶅鵳鵻鶂鵯鵹鵿鶇鵨麔麑黀黼鼭齀齁齍齖齗齘匷嚲"],
    ["f440", "嚵嚳壣孅巆巇廮廯忀忁懹攗攖攕攓旟曨曣曤櫳櫰櫪櫨櫹櫱櫮櫯瀼瀵瀯瀷瀴瀱灂瀸瀿瀺瀹灀瀻瀳灁爓爔犨獽獼璺皫皪皾盭矌矎矏矍矲礥礣礧礨礤礩"],
    ["f4a1", "禲穮穬穭竷籉籈籊籇籅糮繻繾纁纀羺翿聹臛臙舋艨艩蘢藿蘁藾蘛蘀藶蘄蘉蘅蘌藽蠙蠐蠑蠗蠓蠖襣襦覹觷譠譪譝譨譣譥譧譭趮躆躈躄轙轖轗轕轘轚邍酃酁醷醵醲醳鐋鐓鏻鐠鐏鐔鏾鐕鐐鐨鐙鐍鏵鐀鏷鐇鐎鐖鐒鏺鐉鏸鐊鏿"],
    ["f540", "鏼鐌鏶鐑鐆闞闠闟霮霯鞹鞻韽韾顠顢顣顟飁飂饐饎饙饌饋饓騲騴騱騬騪騶騩騮騸騭髇髊髆鬐鬒鬑鰋鰈鯷鰅鰒鯸鱀鰇鰎鰆鰗鰔鰉鶟鶙鶤鶝鶒鶘鶐鶛"],
    ["f5a1", "鶠鶔鶜鶪鶗鶡鶚鶢鶨鶞鶣鶿鶩鶖鶦鶧麙麛麚黥黤黧黦鼰鼮齛齠齞齝齙龑儺儹劘劗囃嚽嚾孈孇巋巏廱懽攛欂櫼欃櫸欀灃灄灊灈灉灅灆爝爚爙獾甗癪矐礭礱礯籔籓糲纊纇纈纋纆纍罍羻耰臝蘘蘪蘦蘟蘣蘜蘙蘧蘮蘡蘠蘩蘞蘥"],
    ["f640", "蠩蠝蠛蠠蠤蠜蠫衊襭襩襮襫觺譹譸譅譺譻贐贔趯躎躌轞轛轝酆酄酅醹鐿鐻鐶鐩鐽鐼鐰鐹鐪鐷鐬鑀鐱闥闤闣霵霺鞿韡顤飉飆飀饘饖騹騽驆驄驂驁騺"],
    ["f6a1", "騿髍鬕鬗鬘鬖鬺魒鰫鰝鰜鰬鰣鰨鰩鰤鰡鶷鶶鶼鷁鷇鷊鷏鶾鷅鷃鶻鶵鷎鶹鶺鶬鷈鶱鶭鷌鶳鷍鶲鹺麜黫黮黭鼛鼘鼚鼱齎齥齤龒亹囆囅囋奱孋孌巕巑廲攡攠攦攢欋欈欉氍灕灖灗灒爞爟犩獿瓘瓕瓙瓗癭皭礵禴穰穱籗籜籙籛籚"],
    ["f740", "糴糱纑罏羇臞艫蘴蘵蘳蘬蘲蘶蠬蠨蠦蠪蠥襱覿覾觻譾讄讂讆讅譿贕躕躔躚躒躐躖躗轠轢酇鑌鑐鑊鑋鑏鑇鑅鑈鑉鑆霿韣顪顩飋饔饛驎驓驔驌驏驈驊"],
    ["f7a1", "驉驒驐髐鬙鬫鬻魖魕鱆鱈鰿鱄鰹鰳鱁鰼鰷鰴鰲鰽鰶鷛鷒鷞鷚鷋鷐鷜鷑鷟鷩鷙鷘鷖鷵鷕鷝麶黰鼵鼳鼲齂齫龕龢儽劙壨壧奲孍巘蠯彏戁戃戄攩攥斖曫欑欒欏毊灛灚爢玂玁玃癰矔籧籦纕艬蘺虀蘹蘼蘱蘻蘾蠰蠲蠮蠳襶襴襳觾"],
    ["f840", "讌讎讋讈豅贙躘轤轣醼鑢鑕鑝鑗鑞韄韅頀驖驙鬞鬟鬠鱒鱘鱐鱊鱍鱋鱕鱙鱌鱎鷻鷷鷯鷣鷫鷸鷤鷶鷡鷮鷦鷲鷰鷢鷬鷴鷳鷨鷭黂黐黲黳鼆鼜鼸鼷鼶齃齏"],
    ["f8a1", "齱齰齮齯囓囍孎屭攭曭曮欓灟灡灝灠爣瓛瓥矕礸禷禶籪纗羉艭虃蠸蠷蠵衋讔讕躞躟躠躝醾醽釂鑫鑨鑩雥靆靃靇韇韥驞髕魙鱣鱧鱦鱢鱞鱠鸂鷾鸇鸃鸆鸅鸀鸁鸉鷿鷽鸄麠鼞齆齴齵齶囔攮斸欘欙欗欚灢爦犪矘矙礹籩籫糶纚"],
    ["f940", "纘纛纙臠臡虆虇虈襹襺襼襻觿讘讙躥躤躣鑮鑭鑯鑱鑳靉顲饟鱨鱮鱭鸋鸍鸐鸏鸒鸑麡黵鼉齇齸齻齺齹圞灦籯蠼趲躦釃鑴鑸鑶鑵驠鱴鱳鱱鱵鸔鸓黶鼊"],
    ["f9a1", "龤灨灥糷虪蠾蠽蠿讞貜躩軉靋顳顴飌饡馫驤驦驧鬤鸕鸗齈戇欞爧虌躨钂钀钁驩驨鬮鸙爩虋讟钃鱹麷癵驫鱺鸝灩灪麤齾齉龘碁銹裏墻恒粧嫺╔╦╗╠╬╣╚╩╝╒╤╕╞╪╡╘╧╛╓╥╖╟╫╢╙╨╜║═╭╮╰╯▓"]
  ];
});

// node_modules/iconv-lite/encodings/tables/big5-added.json
var require_big5_added = __commonJS((exports, module) => {
  module.exports = [
    ["8740", "䏰䰲䘃䖦䕸\uD85C\uDE67䵷䖳\uD85F\uDCB1䳢\uD85F\uDCC5㮕䜶䝄䱇䱀\uD850\uDEBF\uD84D\uDE17\uD85C\uDF52\uD85B\uDE8B\uD85C\uDCD2䱗\uD868\uDF51䝏䗚䲅\uD85F\uDC6C䴇䪤䚡\uD85A\uDF23爥\uD856\uDE54\uD846\uDE63\uD84F\uDE06\uD84F\uDF61晍囻"],
    ["8767", "綕夝\uD862\uDFB9㷴霴\uD85E\uDFEF寛\uD847\uDD5E媤㘥\uD867\uDEB0嫑宷峼杮薓\uD866\uDD45瑡璝㡵\uD847\uDD53\uD84D\uDE9E\uD858\uDC21㻬"],
    ["87a1", "\uD856\uDCDE㫵竼龗\uD850\uDD61\uD862\uDD0D\uD84C\uDDEA\uD842\uDE8A\uD84C\uDE5E䌊蒄龖鐯䤰蘓墖靊鈘秐稲晠権袝瑌篅枂稬剏遆㓦珄\uD857\uDDB9瓆鿇垳䤯呌䄱\uD84D\uDE8E堘穲\uD85E\uDF65讏䚮\uD85B\uDE88䆁\uD857\uDD99箮\uD849\uDCBC鿈\uD849\uDCC1\uD849\uDCC9\uD849\uDCCC鿉蔄\uD84D\uDDBB䂴鿊䓡\uD86B\uDDFF拁灮鿋"],
    ["8840", "㇀", 4, "\uD840\uDD0C㇅\uD840\uDCD1\uD840\uDCCD㇆㇇\uD840\uDCCB\uD847\uDFE8㇈\uD840\uDCCA㇉㇊㇋㇌\uD840\uDD0E㇍㇎ĀÁǍÀĒÉĚÈŌÓǑÒ࿿Ê̄Ế࿿Ê̌ỀÊāáǎàɑēéěèīíǐìōóǒòūúǔùǖǘǚ"],
    ["88a1", "ǜü࿿ê̄ế࿿ê̌ềêɡ⏚⏛"],
    ["8940", "\uD868\uDFA9\uD844\uDD45"],
    ["8943", "攊"],
    ["8946", "丽滝鵎釟"],
    ["894c", "\uD85D\uDF35撑会伨侨兖兴农凤务动医华发变团声处备夲头学实実岚庆总斉柾栄桥济炼电纤纬纺织经统缆缷艺苏药视设询车轧轮"],
    ["89a1", "琑糼緍楆竉刧"],
    ["89ab", "醌碸酞肼"],
    ["89b0", "贋胶\uD842\uDDE7"],
    ["89b5", "肟黇䳍鷉鸌䰾\uD867\uDDF6\uD85C\uDC0E鸊\uD868\uDD33㗁"],
    ["89c1", "溚舾甙"],
    ["89c5", "䤑马骏龙禇\uD861\uDC6C\uD847\uDDCA\uD841\uDDD0\uD84A\uDEE6两亁亀亇亿仫伷㑌侽㹈倃傈㑽㒓㒥円夅凛凼刅争剹劐匧㗇厩㕑厰㕓参吣㕭㕲㚁咓咣咴咹哐哯唘唣唨㖘唿㖥㖿嗗㗅"],
    ["8a40", "\uD85F\uDD84唥"],
    ["8a43", "\uD843\uDC42\uD843\uDD15\uD854\uDD2B喐\uD84B\uDCC6㧬\uD840\uDF41蹆\uD853\uDDB8\uD865\uDCE5䁓\uD860\uDCBE睺\uD84B\uDC38㨴䟕\uD860\uDD5D\uD85A\uDDF2\uD853\uDDEA擝\uD843\uDD7C\uD843\uDFB4\uD843\uDCD5\uD844\uDCF4撍蹾\uD843\uDE96\uD843\uDC0B\uD843\uDF64\uD84B\uDCA9\uD860\uDE56\uD851\uDCD3"],
    ["8a64", "\uD843\uDD46\uD866\uDE4D\uD860\uDCE9䟴\uD853\uDEA7\uD84B\uDCC2骲㩧\uD865\uDDF4㿭㔆\uD854\uDEC7\uD865\uDFD4\uD85E\uDCC8\uD84B\uDD44鵮頕"],
    ["8a76", "䏙\uD858\uDCA5撴哣\uD84B\uDD4C\uD84A\uDFCA\uD844\uDC77㧻\uD844\uDC6F"],
    ["8aa1", "\uD859\uDEDA\uD859\uDF16\uD85E\uDDA0擪\uD854\uDC52\uD843\uDC43蹨\uD848\uDDA1\uD862\uDF4C\uD841\uDF31"],
    ["8aac", "䠋\uD840\uDDA9㿺塳\uD84B\uDD8D"],
    ["8ab2", "\uD851\uDDC8\uD841\uDCFC\uD858\uDC97\uD843\uDF4C\uD843\uDD96啹䂻䎺"],
    ["8abb", "䪴\uD84A\uDE66\uD844\uDC9D膪飵\uD843\uDD9C捹㧾\uD849\uDF75跀嚡摼㹃"],
    ["8ac9", "\uD869\uDE01\uD843\uDE09\uD84A\uDECF\uD84B\uDCC9"],
    ["8ace", "\uD844\uDCC8\uD84E\uDDC2㦒㨆\uD860\uDE9B㕸\uD857\uDE49\uD848\uDCC7噒\uD843\uDF31\uD84B\uDCB2\uD865\uDF20㒼氽\uD853\uDE3B"],
    ["8adf", "\uD85D\uDD74\uD84B\uDE8B\uD848\uDE08\uD869\uDE5B\uD863\uDCCD\uD843\uDE7A\uD843\uDC34\uD85A\uDC1C羓\uD844\uDCCF\uD84A\uDC03\uD84A\uDD39㗻\uD854\uDDE3\uD843\uDE8C\uD843\uDF8D\uD843\uDEAA㾓\uD843\uDF30\uD843\uDD47\uD844\uDD4F\uD843\uDE4C"],
    ["8af6", "\uD843\uDEAB\uD842\uDFA9\uD843\uDD48\uD844\uDCC0\uD844\uDD3D㿹\uD849\uDE96搲\uD843\uDFAD"],
    ["8b40", "\uD84C\uDFF4\uD85D\uDE39\uD84A\uDFCE\uD843\uDD7E\uD843\uDD7F\uD84B\uDC51\uD84B\uDC55㨘\uD843\uDE98\uD844\uDCC7\uD843\uDF2E\uD869\uDE32\uD85A\uDF50\uD863\uDCD2\uD863\uDD99\uD863\uDCCA閪哌苄喹"],
    ["8b55", "\uD867\uDEC3鰦骶\uD85D\uDF5E\uD84B\uDDEE煀腭胬尜\uD859\uDD72脴㞗卟\uD860\uDCBD醶\uD843\uDEFA\uD843\uDE0F\uD843\uDE77\uD843\uDEFB㗝\uD853\uDDEB㘉\uD843\uDCD6嚯\uD849\uDFB5\uD844\uDCC9\uD843\uDE10\uD843\uDE78\uD844\uDC78\uD844\uDD48\uD860\uDE07\uD845\uDC55\uD843\uDE79\uD853\uDE50\uD84B\uDDA4婔\uD844\uDC1D\uD844\uDC1E\uD844\uDCF5\uD844\uDCF6垜\uD843\uDE11"],
    ["8ba1", "\uD85D\uDE94\uD860\uDECD\uD843\uDFB5\uD843\uDE7B\uD854\uDD7E㜃\uD843\uDFB6\uD844\uDD80\uD854\uDED8\uD868\uDEBD\uD852\uDDDA\uD846\uDC3A\uD850\uDD77\uD860\uDE7C墙剨㘚\uD855\uDF3D箲孨䠀䬬鼧䧧鰟鮍\uD856\uDF74\uD84C\uDD3D嗻㗲嚉丨夂\uD846\uDFC1\uD87E\uDC78靑\uD840\uDC86乛亻㔾尣彑忄㣺扌攵歺氵氺灬爫丬犭\uD852\uDCE9罒礻糹罓\uD858\uDE6A㓁"],
    ["8bde", "\uD858\uDF4B耂肀\uD859\uDE12\uD85A\uDD51卝衤见\uD85E\uDCB2讠贝钅镸长门\uD863\uDE0F韦页风飞饣\uD866\uDC10鱼鸟黄歯龜丷\uD840\uDC87阝户钢"],
    ["8c40", "倻淾\uD867\uDC73龦㷉袏\uD850\uDD4E灷峵䬠\uD854\uDDCD㕙\uD857\uDD30愢\uD862\uDE32辧釶熑朙玺\uD84C\uDE81\uD868\uDD07㲋\uD846\uDD80䬐磤琂冮\uD861\uDF0F䀉橣\uD868\uDEBA䈣蘏\uD842\uDE6F稪\uD866\uDD47\uD862\uDEEA靕灍匤\uD848\uDC7E鏴盙\uD862\uDDE3龧矝亣俰傼丯众龨吴綋墒壐\uD847\uDDB6庒庙忂\uD849\uDF12斋"],
    ["8ca1", "\uD84C\uDFF9椙橃\uD84F\uDC63泿"],
    ["8ca7", "爀\uD851\uDD05玌㻛\uD852\uDE13嬕璹讃\uD857\uDCA4\uD855\uDE95窓篬糃繬苸薗龩袐龪躹龫迏蕟駠鈡龬\uD863\uDDB9\uD845\uDC3F䁱䊢娚"],
    ["8cc9", "顨杫䉶圽"],
    ["8cce", "藖\uD852\uDD7B芿\uD85C\uDD0D䲁\uD85B\uDD74嵻\uD85A\uDF15\uD85B\uDFBE龭龮宖龯曧繛湗秊㶈䓃\uD84C\uDE56\uD849\uDF96䎚䔶"],
    ["8ce6", "峕\uD84E\uDF1A諹屸㴒\uD84D\uDD51嵸龲煗䕘\uD850\uDCEC\uD847\uDE23䱷㥸㑊\uD840\uDDA4\uD85B\uDC41諌侴\uD840\uDE39妿腬顖\uD866\uDCFA弻"],
    ["8d40", "\uD842\uDF9F"],
    ["8d42", "\uD848\uDDC1\uD862\uDD6D䄂䚻\uD864\uDC79㼇龳\uD868\uDDB5䃸㟖䛷\uD85B\uDC46䅼\uD861\uDEB2\uD85C\uDFFF䕭㣔\uD855\uDC9A䕡䔛䶉䱻䵶䗪㿈\uD852\uDF0F㙡䓞䒽䇭崾嵈嵖㷼㠏嶤嶹㠠㠸幂庽弥徃㤈㤔㤿㥍惗愽峥㦉憷憹懏㦸戬抐拥挘㧸嚱"],
    ["8da1", "㨃揢揻搇摚㩋擀崕嘡龟㪗斆㪽旿晓㫲暒㬢朖㭂枤栀㭘桊梄㭲㭱㭻椉楃牜楤榟榅㮼槖㯝橥橴橱檂㯬檙㯲檫檵櫔櫶殁毁毪汵沪㳋洂洆洦涁㳯涤涱渕渘温溆\uD862\uDDC0溻滢滚齿滨滩漤漴㵆\uD84F\uDF41澁澾㵪㵵熷岙㶊瀬㶑灐灔灯灿炉\uD840\uDF25䏁㗱\uD843\uDED8"],
    ["8e40", "\uD84F\uDED7垾\uD85B\uDED3焾\uD855\uDFE0㙎榢\uD862\uDFE9孴穉\uD856\uDCE1\uD865\uDCD9穥穽\uD856\uDDAC窻窰竂竃燑\uD859\uDC8D䇊竚竝竪䇯咲\uD857\uDC01笋筕笩\uD854\uDF0E\uD857\uDCFE箢筯莜\uD856\uDFB4\uD85B\uDC7F篐萡箒箸\uD857\uDD20㶭\uD857\uDC65蒒篺簆簵\uD857\uDCC1籄粃\uD852\uDC82粦晽\uD851\uDD78糉糇糦籴糳糵糎"],
    ["8ea1", "繧䔝\uD85B\uDE44絝\uD85B\uDED6璍綉綫焵綳緒\uD850\uDC57\uD858\uDC29緤㴓緵\uD845\uDFF9緥\uD860\uDF6D縝\uD858\uDD21\uD858\uDD5A繮纒䌫鑬縧罀罁罇礶\uD858\uDED0駡羗\uD858\uDF51羣\uD845\uDE61\uD840\uDC68䕜\uD84D\uDF66䔃\uD860\uDF3A翺\uD859\uDC89者耈耝耨耯\uD868\uDC87\uD85B\uDCC3耻耼聡\uD849\uDF14䦉\uD859\uDE26\uD84F\uDDE3\uD859\uDEE8朥肧\uD862\uDE48脇脚墰\uD849\uDEF6汿\uD859\uDC98\uD853\uDFB8擧\uD845\uDC8A舘\uD846\uDC5E橓\uD852\uDE65\uD852\uDE95䑺舩\uD842\uDF0D\uD85A\uDE52\uD84F\uDD7E俹\uD845\uDCFD蓢荢\uD85A\uDF0A\uD852\uDDA7\uD84D\uDD30\uD845\uDF73\uD84F\uDDF8芪椛\uD87E\uDD94䇛"],
    ["8f40", "蕋苐茚\uD843\uDE16\uD845\uDFB4㛁\uD84C\uDD7D\uD84D\uDD5A艻苢茘\uD84F\uDE8B\uD85B\uDDA3\uD85A\uDF05\uD85A\uDF97\uD84D\uDDCE㶿茝嗬莅䔋\uD85B\uDDA5莬菁菓㑾\uD85B\uDED4橗蕚㒖\uD85B\uDE42\uD84B\uDEEF葘\uD856\uDFE4葱㷓䓤檧葊\uD84F\uDCB5祘蒨\uD85A\uDF96\uD85B\uDE77\uD85B\uDE43蓞萏莑䒠蒓蓤\uD857\uDC91䉀\uD857\uDCC0䕃蔴嫲\uD85B\uDE99䔧蕳䔖枿蘖"],
    ["8fa1", "\uD861\uDE25\uD861\uDE3B藁\uD85C\uDC88蘂\uD845\uDD82\uD85C\uDCCD\uD87E\uDDB2䕪蘨㙈\uD846\uDCA2号\uD85C\uDF9A虾蝱\uD868\uDCF8蟮\uD84B\uDC27螱蟚蠏噡虬桖䘏衅衆\uD85D\uDDE0\uD84F\uDDB9\uD85D\uDDE4衞袜䙛袴袵揁装睷\uD85D\uDF0F覇覊覦覩覧覼\uD862\uDE25觧\uD85E\uDD24\uD85E\uDEBD誜瞓釾誐\uD85E\uDE59竩\uD85E\uDF3A\uD84F\uDF8F䜓\uD85E\uDF38煼謌謟\uD855\uDC30\uD855\uDD65謿譌譍誩\uD852\uDE7A讐讛誯\uD845\uDEDF䘕衏貛\uD85F\uDD54\uD85F\uDD8F\uD87E\uDDD4㜥\uD85F\uDD53賖\uD85F\uDD98\uD85F\uDDBD贒贃\uD846\uDD10賛灜贑\uD853\uDCC9㻐起"],
    ["9040", "趩\uD860\uDC02\uD844\uDC14\uD852\uDD8A㭼\uD860\uDDBC\uD85C\uDD0C竧躭躶軃鋔輙輭\uD860\uDF65\uD861\uDC12辥錃\uD868\uDE9F\uD842\uDE50辳䤪\uD862\uDDDE\uD861\uDD3D\uD84F\uDDBB廸\uD84C\uDE62迹\uD868\uDC14\uD861\uDEBC\uD861\uDD01\uD848\uDF25㦀\uD85B\uDED7逷\uD861\uDD3C\uD85E\uDEBE遡\uD861\uDD6C\uD861\uDE0B邨\uD861\uDF13郄\uD861\uDEE6邮都酧㫰醩釄粬\uD862\uDD33\uD847\uDE89鈎沟鉁鉢\uD855\uDDB9銹\uD862\uDEC6\uD84F\uDC9B\uD862\uDF0C\uD855\uDDDB"],
    ["90a1", "\uD843\uDD31錬鍫\uD862\uDEE1\uD862\uDFEB炏嫃\uD862\uDEE2\uD862\uDEE5䥥鉄\uD862\uDFEC\uD863\uDC39\uD862\uDFFF鍳鑛躼閅閦鐦閠濶䊹\uD849\uDE7A\uD861\uDED8\uD844\uDE7C\uD84F\uDE2E䧟氜陻隖䅬隣\uD85B\uDED5懚隶磵\uD862\uDEE0隽双䦡\uD85B\uDCB8\uD840\uDE74\uD859\uDC10\uD864\uDCAF\uD864\uDCE5\uD852\uDED1\uD846\uDD15\uD84C\uDF0A霱虂霶䨏䔽䖅\uD852\uDEE9灵孁霛靜\uD864\uDDD5靗孊\uD864\uDDEB靟鐥僐\uD84C\uDCB7\uD84C\uDCBC鞉鞟鞱鞾韀韒韠\uD855\uDC6C韮琜\uD865\uDC33響韵\uD865\uDC1D\uD85E\uDD7A䫑頴頳顋顦㬎\uD85C\uDD75㵑\uD841\uDE30\uD850\uDD5C"],
    ["9140", "\uD855\uDF06飊颷飈飇䫿\uD85B\uDD27\uD845\uDED3喰飡飦飬鍸餹\uD852\uDE29䭲\uD866\uDC57\uD866\uDD05駵騌騻騐驘\uD855\uDF25㛄\uD864\uDCB1\uD866\uDFD5髠髢\uD866\uDF05髴䰎鬔鬭\uD861\uDE00倴鬴\uD85A\uDDA8㣃\uD84C\uDC7D魐魀\uD867\uDD3E婅\uD846\uDC63鮎\uD850\uDE4B鰂鯿鰌\uD867\uDE68鷔\uD867\uDFB7\uD868\uDD92\uD868\uDDAB\uD868\uDCE1\uD868\uDD23\uD868\uDDDF鵾鶃\uD868\uDD34鸎梈"],
    ["91a1", "鷄\uD848\uDD5B\uD868\uDD93\uD868\uDE20\uD846\uDD3B\uD868\uDE33鴹\uD868\uDCB9\uD868\uDEB4麐麕麞麢䴴麪麯\uD850\uDF64黁㭠㧥㴝伲㞾\uD863\uDC2B鼂鼈䮖鐤\uD85B\uDDA2鼗鼖鼹嚟嚊齅馸\uD864\uDC8B韲葿齢齩竜龎爖䮾\uD852\uDD75\uD852\uDDBB煷\uD852\uDDF8\uD850\uDF48\uD852\uDE51玞\uD862\uDFDA\uD846\uDCFA禟\uD862\uDD7E\uD863\uDE36鍩鏳\uD862\uDE44鋬鎁鏋\uD862\uDD6C\uD851\uDCB9爗㻫睲穃烐\uD851\uDC73\uD850\uDFF8煾\uD845\uDFEF炣\uD846\uDCBE\uD84D\uDD99㻇\uD846\uDC85\uD855\uDC2F\uD845\uDFF8㜢\uD845\uDEFB\uD846\uDC39㛡\uD845\uDF74\uD846\uDCD1\uD857\uDF4B㜣\uD845\uDEC0坛\uD852\uDE25\uD844\uDFFE\uD844\uDEA8"],
    ["9240", "\uD844\uDFC6\uD845\uDCB6蔃\uD84D\uDEA6蔃葕\uD852\uDD94\uD85C\uDD65\uD84F\uDE31\uD855\uDD5C\uD84F\uDEFB\uD85C\uDC52䓴\uD84D\uDEEE\uD866\uDD9D\uD85B\uDF26柹㜳㰕㷧塬\uD846\uDD22栐䁗\uD84D\uDF3F\uD850\uDCE1\uD850\uDC8B\uD850\uDD0F\uD85B\uDC21哋嚞\uD859\uDEB1嚒\uD843\uDFDF\uD842\uDFA8\uD843\uDE0D鏆\uD862\uDF13鎜仸儫㠙\uD851\uDC36亼\uD841\uDC65\uD840\uDF7F佋侊\uD855\uDE51婨\uD840\uDDAB\uD840\uDFCB㦙\uD840\uDF0A\uD841\uDC14㐵伩\uD840\uDEC0\uD863\uDEB3\uD840\uDE75諚\uD840\uDE0C亘"],
    ["92a1", "働儍侢伃\uD852\uDE0E\uD84F\uDE8A佂倮偬傁俌俥偘僼兙兛兝兞湶\uD84D\uDD95\uD84F\uDE39\uD84F\uDEBF浲\uD846\uDC84\uD84F\uDE89冨凃\uD841\uDDE0䓝\uD841\uDCA3\uD841\uDC92\uD841\uDC91赺\uD862\uDE9C\uD841\uDF0E剙劤\uD842\uDC73勡鍮䙺熌\uD850\uDF8C\uD843\uDC20\uD852\uDDAC\uD844\uDCE4槑\uD843\uDE1D瑹㻞璙琔瑖玘䮎\uD852\uDEBC\uD850\uDC8D叐㖄爏\uD850\uDCC9喴\uD840\uDF45响\uD842\uDFC6圝鉝雴鍦埝垍坿㘾壋媙\uD862\uDE46\uD845\uDEFA\uD845\uDF6F\uD845\uDF10娬妸銏婾嫏娒\uD856\uDD46\uD846\uDDF3\uD846\uDC61\uD850\uDE95㛵洅瑃娡\uD857\uDE83"],
    ["9340", "媁\uD862\uDFD7\uD841\uDC13鏠璌\uD844\uDF03焅䥲鐈\uD862\uDDFB鎽㞠尞岞幞幈\uD846\uDD96\uD846\uDD7C\uD84E\uDEEE廍孏\uD846\uDD03\uD846\uDD04㜁\uD846\uDCA0㛝\uD845\uDEFE㛓脪\uD862\uDE47\uD847\uDDBA\uD84D\uDC72\uD862\uDDA8弌弎\uD846\uDD27\uD845\uDFAB婫\uD845\uDF3B孄蘔\uD85D\uDDFD衠恾\uD84A\uDC60\uD849\uDE2B忛㺸\uD849\uDDAF\uD849\uDDBE\uD864\uDC88\uD85B\uDF73懀\uD840\uDC3E\uD840\uDC46\uD849\uDE1B憙憘恵\uD84B\uDC9B\uD84B\uDD07\uD851\uDED4\uD864\uDD4D"],
    ["93a1", "摱\uD851\uDE65\uD84A\uDF6A㨩\uD84A\uDF22\uD84D\uDC50\uD866\uDCEA\uD84B\uDE78挷\uD869\uDC5B撶挱揑\uD852\uDDE3\uD84B\uDD67护\uD84B\uDCA1搻敫楲㯴\uD84C\uDC8E\uD84C\uDEAD\uD852\uDD89\uD84C\uDEAB唍\uD84C\uDEE0\uD846\uDCD9\uD865\uDC3F曎\uD84C\uDE89\uD84C\uDDB3㫠䆐\uD855\uDD84\uD862\uDF22\uD855\uDD8F\uD845\uDEFC\uD855\uDD5B\uD855\uDC25磮\uD84C\uDD03\uD846\uDC2A\uD84C\uDE34㑤\uD84C\uDE0F\uD84C\uDD82\uD850\uDEC9暎\uD85B\uDD24晫䮓昰\uD85E\uDC70\uD847\uDDEB晣\uD84C\uDED2\uD84C\uDEE1昞\uD856\uDC72㣑\uD84E\uDC3A\uD84D\uDFBC㮙\uD84D\uDFA2\uD84C\uDFFE瓐㮖枏\uD851\uDE2A梶栞㯄檾㡣\uD84D\uDFD5\uD851\uDC87樳橒櫉欅\uD846\uDD12攑梘橌㯗橺歗\uD84F\uDFC0\uD84F\uDC9A鎠鋲\uD862\uDFEA\uD862\uDECB"],
    ["9440", "銉\uD860\uDC1E\uD862\uDDDC鑧涥漋\uD852\uDDEC浧\uD84F\uDF7F㶏渄\uD850\uDC3C娽渊塇洤硂焻\uD850\uDF1A\uD850\uDE76烱牐犇犔\uD851\uDF8F\uD851\uDF25兹\uD852\uDEA4\uD841\uDDEB瑺\uD84F\uDEF8\uD84D\uDE5F\uD852\uDE4A\uD852\uDD17\uD857\uDFE1㼆㺱\uD852\uDEDF\uD863\uDC23\uD84F\uDF35悧㻳瓌琼鎇琷䒟\uD85B\uDDEA䕑疃㽣\uD853\uDCD9\uD853\uDD06㽘畕癳\uD869\uDDC6㬙瑨\uD862\uDECC\uD852\uDDAB\uD852\uDD8E㫻"],
    ["94a1", "㷍\uD852\uDE4E㻿\uD852\uDDC5\uD852\uDCF3釺圲鍂\uD862\uDEE3\uD846\uDC64僟\uD854\uDE21\uD854\uDDE7睸\uD84C\uDE32眎眏睻\uD851\uDE97\uD84D\uDF81㩞\uD852\uDCF0琸璛㺿\uD852\uDEBA\uD852\uDEC7䃈\uD852\uDE96\uD858\uDDAE錇\uD855\uDD81砞碍碈磒珐祙\uD85D\uDF41\uD855\uDEE3䄎禛蒖禥樭\uD84F\uDEFA稺秴䅮\uD845\uDEE6䄲鈵秱\uD843\uDD4C\uD852\uDD8C\uD840\uDE99\uD84F\uDDBA\uD845\uDF6E㖗啫㕰㚪\uD840\uDDD4\uD843\uDC0D竢婙\uD849\uDEF5\uD856\uDEAF\uD856\uDE9C娍\uD840\uDE5B磰娪\uD856\uDFC6竾䇹籝籭䈑\uD856\uDFB3\uD857\uDEBC\uD857\uDEA6糍\uD852\uDDF9\uD845\uDFB0粎籼粮檲緜縇緓罎\uD858\uDE61"],
    ["9540", "\uD858\uDD5C\uD85E\uDF48綗\uD857\uDE82䉪\uD85A\uDF75\uD842\uDD16柖\uD840\uDC4E\uD84D\uDDCF埄\uD859\uDC12\uD858\uDFF8\uD852\uDD62翝笧\uD842\uDC2C\uD856\uDEE9\uD857\uDD43笌\uD857\uDE0E駦虅驣樜\uD84D\uDC3F㧢\uD852\uDDF7\uD859\uDDAD騟\uD859\uDDA0蒀\uD85C\uDD27\uD85B\uDCD1䓪脷䐂胆脉腂\uD859\uDFB4飃\uD85A\uDE42艢艥\uD85A\uDE51葓\uD85B\uDDA7蘐\uD85C\uDE1B媆䅿\uD846\uDC40嬫\uD846\uDCA1嫤\uD846\uDCD8蚠\uD87E\uDDBC\uD84F\uDD8F蠭\uD85D\uDC22娂"],
    ["95a1", "衮佅袇袿裦襥襍\uD855\uDE83襔\uD85D\uDF85\uD85D\uDF84\uD862\uDFF5\uD862\uDFD9\uD862\uDF9C\uD862\uDDF9㺭蒣䛵䛏㟲訽訜\uD865\uDC48彍鈫\uD850\uDE84旔焩烄\uD846\uDC45鵭貟賩\uD85F\uDDDC妚矃姰䍮㛔踪躧\uD853\uDC09輰轊䋴汘澻\uD848\uDF21䢛潹溋\uD845\uDFDA鯩㚵\uD852\uDD2F邻邗啱䤆醻鐄\uD862\uDE4B䁢\uD862\uDEFC鐧\uD863\uDC1D\uD863\uDC3B蓥訫閙閧閗閖\uD863\uDD34瑅㻂\uD852\uDCFF\uD852\uDE42\uD850\uDFEA㻧\uD84C\uDE25随\uD863\uDEE7\uD863\uDE66\uD863\uDE65㻌\uD852\uDDED\uD852\uDE78\uD84F\uDFEE琒瑫㻼靁\uD864\uDCB0"],
    ["9640", "桇䨝\uD864\uDC93\uD855\uDFDF靝鍨\uD862\uDD89\uD863\uDC26\uD862\uDF2F\uD858\uDFBE銺嬑譩䤼珹\uD850\uDE1B鞛靱餸\uD843\uDF26巁\uD862\uDFC5\uD852\uDEB2頟\uD865\uDCDA鋶\uD865\uDDD7釥䓀\uD862\uDF50\uD852\uDE67\uD862\uDF64飜\uD862\uDE45㼀鈪䤥萔餻饍\uD85E\uDF06㷽馛䭯馪驜\uD862\uDF65\uD856\uDCC8檏騡嫾騯\uD866\uDCF1䮐\uD866\uDD48馼䮽䮗鍽塲\uD844\uDF02堢\uD852\uDDB8"],
    ["96a1", "\uD845\uDCE8硄\uD849\uDF1F\uD84F\uDDB8棅㵽鑘㤧慐\uD849\uDF81\uD84A\uDD6B愇鱏鱓鱻鰵鰐魿鯏\uD867\uDE2D鮟\uD868\uDDF5\uD868\uDCFE鴡䲮\uD850\uDD04鸘䲰鴌\uD868\uDDB4\uD868\uDCED\uD868\uDCF3\uD866\uDD2F鶥蒽\uD85B\uDE12\uD85B\uDFDF\uD85A\uDF82藼䔳\uD85B\uDDA4\uD85B\uDE84\uD85B\uDDF0萠藮\uD85B\uDE00\uD84D\uDFD7\uD858\uDC64秢\uD84D\uDD9C\uD84D\uDE40䤭\uD852\uDDDE㵢鏛銾鍈\uD840\uDEBF碹鉷鑍俤㑀遤\uD855\uDD5D砽硔碶硋\uD845\uDF57\uD84C\uDDC9\uD852\uDD41㚚佲濚濙瀞瀞吔\uD850\uDDB5垻壳垊鴖埗焴㒯\uD850\uDDAC燫\uD85B\uDC40\uD853\uDF97嬨\uD845\uDFB5\uD862\uDE49"],
    ["9740", "愌嫎娋䊼\uD851\uDC88㜬䭻\uD862\uDDFC鎻鎸\uD846\uDCD6\uD843\uDF1D葲\uD85B\uDCC0\uD845\uDC13\uD850\uDEFA\uD84B\uDC26\uD850\uDFC1妔\uD84F\uDDB7\uD859\uDF41綨\uD858\uDD5B\uD858\uDCA4\uD852\uDDB9\uD852\uDD8B\uD862\uDDFA鋥珢㻩璴\uD862\uDF63\uD846\uDC9F㻡\uD852\uDEB3櫘珳珻㻖\uD852\uDE3E\uD852\uDE94\uD845\uDFD9\uD852\uDE66\uD840\uDFA7\uD845\uDC24\uD852\uDDE5瑈\uD852\uDD16炥\uD852\uDD76銄珦鍟\uD841\uDCFE錱\uD862\uDECE\uD862\uDE16鎆\uD862\uDFE7\uD855\uDDD5䤵\uD862\uDE82煫"],
    ["97a1", "\uD852\uDD43\uD843\uDCFF嚤\uD841\uDE1A\uD842\uDFEB\uD843\uDCB8唂秄\uD845\uDFFA緾\uD845\uDEC2\uD852\uDE50\uD846\uDC52䔮鐁㜊\uD862\uDEC0\uD852\uDDAD妰\uD846\uDCBF\uD846\uDC83\uD85D\uDC84媡㛢\uD84F\uDD5B㚰鉟婹\uD862\uDE81\uD846\uDC62鍴㳍\uD842\uDEB4䪖㦊僴㵩㵌\uD844\uDF9C煵䋻\uD860\uDE18渏\uD864\uDCE4䓫浗\uD85F\uDE4F灧沯㳖\uD84F\uDFED\uD84F\uDE2D渂漌㵯\uD840\uDFF5畑㚼㓈䚀㻚䡱姄鉮䤾轁\uD863\uDC1C\uD85A\uDFC0堒埈㛖\uD845\uDC52烾\uD850\uDF62\uD852\uDE71\uD84B\uDFE3\uD844\uDEB0\uD848\uDFBD梹楧\uD844\uDF98\uD84D\uDCE5\uD85E\uDFF4\uD84D\uDEDF\uD862\uDE83\uD84D\uDFD6\uD84C\uDFFA\uD853\uDC9F樚\uD84D\uDEAD\uD85B\uDCB7萾䓟䓎"],
    ["9840", "\uD85B\uDD26\uD85B\uDD51\uD85B\uDC82\uD85B\uDFDE漗\uD85C\uDD09茽\uD845\uDF3A菭\uD85B\uDC80\uD85C\uDC53\uD845\uDFDB妉媂\uD845\uDFB3婡婱\uD846\uDD05\uD850\uDDFC㜭姯\uD845\uDF3C㛇熎鎐暚\uD850\uDEA5婮娫\uD850\uDE93樫\uD84F\uDEF9\uD85D\uDF36\uD851\uDC5B\uD850\uDECA焝\uD850\uDE59\uD862\uDDE1侰\uD85B\uDD28峂\uD851\uDCCE\uD85F\uDE4D\uD850\uDFBD樌\uD850\uDE56\uD844\uDF04炦焳\uD850\uDFE9㶥泟\uD87E\uDC25\uD852\uDE4F繥姫崯㷳彜\uD852\uDE5D\uD845\uDFDF綤萦"],
    ["98a1", "咅\uD84E\uDEFA\uD84C\uDF00\uD840\uDE14坾\uD842\uDCD5\uD841\uDE19㿥\uD847\uDF9E\uD868\uDEB6瀃\uD864\uDD5B嵰玏糓\uD862\uDE59\uD865\uDC20俈翧狍猐\uD85E\uDEF4猸猹\uD855\uDEF6獁獈㺩\uD85E\uDF18遬燵\uD852\uDCF2珡臶㻊県㻑沢国琙琞琟㻢㻰㻴㻺瓓㼎㽓畂畭畲疍㽼痈痜㿀癍㿗癴㿜発\uD853\uDF5C熈嘣覀塩䀝睃䀹条䁅㗛瞘䁪䁯属瞾矋売砘点砜䂨砹硇硑硦葈\uD855\uDD35礳栃礲䄃"],
    ["9940", "䄉禑禙辻稆込䅧窑䆲窼艹䇄竏竛䇏両筢筬筻簒簛䉠䉺类粜䊌粸䊔糭输烀\uD843\uDCCF総緔緐緽羮羴犟䎗耠耥笹耮耱联㷌垴炠肷胩䏭脌猪脎脒畠脔䐁㬹腖腙腚"],
    ["99a1", "䐓堺腼膄䐥膓䐭膥埯臁臤艔䒏芦艶苊苘苿䒰荗险榊萅烵葤惣蒈䔄蒾蓡蓸蔐蔸蕒䔻蕯蕰藠䕷虲蚒蚲蛯际螋䘆䘗袮裿褤襇覑\uD85E\uDD67訩訸誔誴豑賔賲贜䞘塟跃䟭仮踺嗘坔蹱嗵躰䠷軎転軤軭軲辷迁迊迌逳駄䢭飠鈓䤞鈨鉘鉫銱銮銿"],
    ["9a40", "鋣鋫鋳鋴鋽鍃鎄鎭䥅䥑麿鐗匁鐝鐭鐾䥪鑔鑹锭関䦧间阳䧥枠䨤靀䨵鞲韂噔䫤惨颹䬙飱塄餎餙冴餜餷饂饝饢䭰駅䮝騼鬏窃魩鮁鯝鯱鯴䱭鰠㝯\uD846\uDFC2鵉鰺"],
    ["9aa1", "黾噐鶓鶽鷀鷼银辶鹻麬麱麽黆铜黢黱黸竈齄\uD840\uDC94\uD840\uDEB7\uD840\uDFA0椚铃妬\uD841\uDCD7塀铁㞹\uD841\uDDD5\uD841\uDE15\uD841\uDE76\uD845\uDEBA块煳\uD842\uDEC2\uD842\uDECD\uD842\uDFBF呪\uD87E\uDC3B\uD842\uDFCB咞\uD842\uDFFB\uD843\uDC3B\uD843\uDC53\uD843\uDC65\uD843\uDC7C惧\uD843\uDC8D噺\uD843\uDCB5\uD843\uDCDD\uD843\uDCED\uD843\uDD6F\uD843\uDDB2\uD843\uDDC8楕鰯螥\uD843\uDE04\uD843\uDE0E\uD843\uDED7\uD843\uDF90\uD843\uDF2D\uD843\uDE73尠\uD843\uDFBC帋\uD844\uDC5C\uD844\uDC4F\uD844\uDC76朞\uD844\uDC7B\uD844\uDC88\uD844\uDC96㙇\uD844\uDCBF\uD844\uDCD3\uD844\uDD2F\uD844\uDD3B卤蒭\uD844\uDEE3\uD844\uDF75\uD844\uDF36讁\uD845\uDD77\uD845\uDE19\uD845\uDFC3\uD845\uDFC7乸炻\uD846\uDC2D\uD846\uDD6A"],
    ["9b40", "\uD846\uDE2D\uD846\uDE45\uD847\uDC2A\uD847\uDC70\uD847\uDCAC\uD847\uDEC8拃\uD847\uDED5\uD847\uDF15熘桕\uD848\uDC45槩㛈\uD848\uDE7C\uD848\uDFD7\uD848\uDFFA\uD849\uDF2A\uD84A\uDC71\uD84A\uDD4F苽\uD84A\uDD67\uD84A\uDD93\uD84A\uDED5覥\uD84A\uDEE8辠\uD84A\uDF0E鞸\uD84A\uDF3F顇骽\uD84B\uDC4C"],
    ["9b62", "\uD84B\uDC88\uD84B\uDCB7\uD856\uDFE8\uD84B\uDD08\uD84B\uDD12\uD84B\uDDB7\uD84B\uDD95\uD84B\uDE42\uD84B\uDF74\uD84B\uDFCC\uD84C\uDC33\uD84C\uDC66\uD84C\uDF1F\uD84C\uDFDE徱晈暿\uD85E\uDE79\uD84D\uDD67\uD84D\uDDF3爁\uD852\uDDBA矗\uD84D\uDE1A\uD84D\uDF16纇\uD840\uDF46墵朎"],
    ["9ba1", "椘\uD84E\uDEA7\uD85D\uDE57\uD857\uDFE2\uD84F\uDE11\uD84F\uDEB9\uD85D\uDDFE\uD848\uDC9A䣐䪸\uD850\uDD19\uD862\uDE9A\uD850\uDEEE\uD850\uDF0D\uD850\uDC3B\uD850\uDF34\uD850\uDF96\uD852\uDE45\uD841\uDDCA凒\uD841\uDE11妟\uD847\uDEA8㮾\uD84F\uDCFF\uD851\uDC04\uD851\uDCD6垈\uD851\uDE74㦛\uD851\uDF2F\uD861\uDDE8\uD866\uDDC9㝢\uD848\uDDC3譞\uD862\uDF4E駖\uD852\uDC12\uD852\uDCFB\uD852\uDE15爉\uD852\uDEC0\uD843\uDC78奥\uD853\uDEA5\uD853\uDF86\uD841\uDF79軚\uD854\uDC2C劏圿煱\uD854\uDE99\uD855\uDC19\uD84F\uDF4A\uD852\uDEA7喼\uD855\uDC46\uD855\uDC6E\uD85A\uDF52釔㑳\uD855\uDD3F\uD85D\uDE32\uD855\uDD5E䜘\uD855\uDD62\uD855\uDD66\uD855\uDFC7\uD852\uDD3F\uD856\uDC5D偦㓻\uD84C\uDFCC惞\uD856\uDD03䝼\uD862\uDD48\uD856\uDEAE\uD856\uDF89\uD857\uDC06\uD847\uDD90垡煑澶\uD858\uDD02\uD85F\uDC12遖\uD858\uDDB2\uD853\uDF9A譢\uD859\uDC02\uD859\uDC4A"],
    ["9c40", "嵛\uD85A\uDFF7輶\uD859\uDC84\uD846\uDD1C諪\uD852\uDDF6\uD859\uDC88\uD84F\uDFEF\uD859\uDD12䯀\uD859\uDDBF\uD859\uDEB5\uD849\uDF1B鑥\uD855\uDFE1憕娧\uD87E\uDCCD侻嚹\uD851\uDD21\uD859\uDEFC乪\uD852\uDD34陖涏\uD85B\uDCBD㘘襷\uD859\uDF99\uD85A\uDC6E\uD859\uDC11\uD85A\uDC5E營\uD85A\uDCC7筂\uD864\uDCC0\uD842\uDE11\uD85A\uDD26鄄\uD85A\uDD39穅鷰\uD85A\uDDFA騦\uD85A\uDE2D㙟\uD859\uDC69\uD840\uDC21禃\uD85A\uDE34\uD85A\uDF5B崬\uD84D\uDD19菏\uD85A\uDF9D䛐\uD85B\uDCA4画补\uD85B\uDDAE墶"],
    ["9ca1", "㜜\uD849\uDD8D\uD85C\uDC4B\uD85C\uDDCD㱔\uD85C\uDE80\uD85C\uDE85銁\uD848\uDD7A\uD85C\uDE8B錰\uD85C\uDEE6\uD852\uDDD0氹钟\uD85D\uDC50\uD843\uDEF8蠧裵\uD84A\uDD26\uD861\uDC73\uD845\uDFB1溸\uD852\uDE2A\uD846\uDC20㦤㚹尐秣䔿暶\uD867\uDCAD\uD866\uDCA4襃\uD85D\uDFCC\uD85E\uDC58囖䃟\uD845\uDE0A㦡\uD84D\uDF2F\uD860\uDCE8\uD844\uDFC5熭荦\uD85E\uDDDD\uD864\uDDA8婧䲷\uD85C\uDCAF\uD862\uDDAB\uD85E\uDDFD\uD85E\uDE0A\uD85E\uDF0B\uD85F\uDD66\uD850\uDD7A筃祾\uD860\uDC09澵\uD868\uDEDF樃\uD860\uDF18厢\uD85B\uDE07鎿栶靝\uD860\uDD6F\uD860\uDC23\uD85A\uDDB5\uD844\uDFED\uD84C\uDE2F\uD860\uDC48嶅\uD863\uDC30\uD860\uDC83圕頣\uD862\uDD49嶫\uD852\uDD88斾槕叒\uD852\uDEA5\uD84F\uDF81㰑朶\uD860\uDC90\uD860\uDCF4\uD860\uDD2E\uD847\uDFA1\uD860\uDD4F"],
    ["9d40", "\uD860\uDD89\uD860\uDDAF\uD860\uDE1A\uD860\uDF06\uD860\uDF2F\uD860\uDF8A㗊\uD861\uDC68\uD861\uDEAA䣺揦\uD862\uDD56砈鉕\uD862\uDDB8䏲\uD862\uDDE7䏟\uD862\uDDE8\uD862\uDF46\uD862\uDFD4姸\uD863\uDC09輋\uD863\uDFC5\uD864\uDCEC筑\uD864\uDD10\uD864\uDD3C㷷\uD864\uDD5E\uD852\uDECA运犏嚋\uD865\uDCE7\uD865\uDDE9\uD865\uDDB0\uD865\uDDB8\uD865\uDF32\uD866\uDCD1\uD866\uDD49\uD866\uDD6A\uD866\uDDC3\uD866\uDE28\uD866\uDF0E\uD867\uDD5A\uD867\uDD9B纟\uD867\uDEF8\uD867\uDF23䲤镇\uD868\uDE93熢\uD868\uDEFF䶑递\uD869\uDDCB䶜\uD843\uDC9C达嗁"],
    ["9da1", "辺\uD849\uDCB0边\uD852\uDE93䔉繿潖檱仪㓤\uD862\uDF2C\uD85E\uDC9D㜺躀\uD845\uDFF5\uD860\uDC24\uD862\uDF6C\uD862\uDF99\uD85E\uDE3E\uD859\uDEAF㷫\uD85D\uDE55\uD84F\uDCB7\uD855\uDE35\uD856\uDD56亚\uD857\uDE81\uD858\uDE58嚿\uD843\uDE6D踎孭\uD84F\uDE88\uD853\uDC9E揞拐\uD845\uDFF6\uD846\uDC7B攰嘭\uD857\uDC4A吚\uD854\uDF11㷆\uD867\uDD98䱽嘢嘞罉\uD857\uDED8奵\uD84F\uDD40蝰东\uD843\uDFEA\uD843\uDD49\uD84D\uDEBA脗鵞贘瘻鱅癎瞹鍅吲腈苷嘥脲萘肽嗪祢噃吖\uD843\uDE9D㗎嘅嗱曱\uD860\uDEE2㘭甴嗰喺咗啲\uD843\uDC41\uD843\uDC96廐\uD854\uDD48\uD843\uDE76\uD84B\uDC62"],
    ["9e40", "\uD843\uDEA2麫絚嗞\uD844\uDC75抝靭咔賍燶酶揼掹揾啩\uD84A\uDF43鱲\uD84B\uDEB3冚㓟\uD843\uDDA7冧呍唞唓癦踭\uD85A\uDC8A疱肶蠄螆裇膶萜\uD844\uDCC1䓬猄\uD851\uDF06宐茋\uD85A\uDC93噻\uD849\uDEF4\uD85F\uDD2F\uD850\uDDA3\uD85F\uDD73\uD85B\uDED0\uD85C\uDEB6酰\uD844\uDDD9鈈\uD84F\uDCFC\uD869\uDEA9\uD843\uDEAC\uD843\uDEF9牦\uD847\uDCA2䝎\uD853\uDFC2\uD85F\uDFF9\uD843\uDFEB䃺"],
    ["9ea1", "鱝攟\uD84B\uDDA0䣳\uD851\uDFE0\uD867\uDD7C\uD843\uDFEC\uD843\uDE0A恢\uD85D\uDDA3\uD843\uDFED"],
    ["9ead", "\uD858\uDC48\uD844\uDD87熣纎鵐业丄㕷嬍沲卧㚬㧜卽㚥\uD851\uDE18墚\uD852\uDF6E舭呋垪\uD856\uDE95\uD842\uDD79"],
    ["9ec5", "㩒\uD849\uDC65獴\uD867\uDEAC䴉鯭\uD84F\uDCFE\uD867\uDF30䱛\uD853\uDFA9\uD865\uDD9E\uD867\uDFDE葜\uD84F\uDDB6\uD85C\uDEB2\uD859\uDFB3\uD84D\uDF20挮紥\uD84F\uDEF7\uD84F\uDE2C㨪逈勌㹴㙺䗩\uD841\uDC8E癀嫰\uD843\uDEB6硺\uD85F\uDF2E墧䂿噼鮋嵴癔\uD869\uDC34麅䳡痹㟻愙\uD84C\uDCDA\uD850\uDFF2"],
    ["9ef5", "噝\uD844\uDEA9垧\uD852\uDD63\uD867\uDE06刴\uD85C\uDCAE㖭汊鵼"],
    ["9f40", "籖鬹埞\uD845\uDF6C屓擓\uD865\uDCD0\uD858\uDF35\uD85C\uDD64蚭\uD843\uDD28\uD85B\uDD22\uD852\uDEE2\uD843\uDD71"],
    ["9f4f", "凾\uD847\uDF0F嶎霃\uD847\uDDD1麁遌笟鬂峑箣扨挵髿篏鬪籾鬮籂粆鰕篼鬉鼗鰛\uD852\uDD3E齚啳寃俽麘俲剠㸆勑坧偖妷帒韈鶫轜呩鞴饀鞺匬愰"],
    ["9fa1", "椬叚鰊鴂䰻陁榀傦畆\uD845\uDF6D駚剳"],
    ["9fae", "酙隁酜"],
    ["9fb2", "酑\uD863\uDE97捿\uD85B\uDD23櫊嘑醎畺抅\uD840\uDFFC獏籰\uD857\uDC21\uD84F\uDCFD"],
    ["9fc1", "\uD852\uDD19盖鮝个\uD843\uDCD4莾衂"],
    ["9fc9", "届槀僭坺刟巵从氱\uD840\uDDF2伹咜哚劚趂㗾弌㗳"],
    ["9fdb", "歒酼龥鮗頮颴骺麨麄煺笔"],
    ["9fe7", "毺蠘罸"],
    ["9feb", "嘠\uD869\uDE4A蹷齓"],
    ["9ff0", "跔蹏鸜踁抂\uD860\uDF7D踨蹵竓\uD852\uDE77稾磘泪詧瘇"],
    ["a040", "\uD862\uDE5A鼦泎蟖痃\uD868\uDEB2硓\uD87E\uDC40贌狢獱謭猂瓱賫\uD852\uDEBB蘯徺袠䒷"],
    ["a055", "\uD846\uDC3B\uD85B\uDE05"],
    ["a058", "詾\uD849\uDD1B"],
    ["a05b", "惽癧髗鵄鍮鮏蟵"],
    ["a063", "蠏賷猬霡鮰㗖犲䰇籑饊\uD858\uDD59慙䰄麖慽"],
    ["a073", "坟慯抦戹拎㩜懢厪\uD84C\uDFF5捤栂㗒"],
    ["a0a1", "嵗\uD862\uDFC2迚\uD863\uDE39"],
    ["a0a6", "僙\uD847\uDD46礆匲阸\uD843\uDF3B䁥"],
    ["a0ae", "矾"],
    ["a0b0", "糂\uD857\uDF1A糚稭聦聣絍甅瓲覔舚朌聢\uD85D\uDC86聛瓰脃眤覉\uD859\uDFCC畓\uD85B\uDED1螩蟎臈螌詉貭譃眫瓸蓚㘵榲趦"],
    ["a0d4", "覩瑨涹蟁\uD850\uDC11瓧㷛煶悤憜㳑煢恷"],
    ["a0e2", "罱\uD862\uDF2D牐惩䭾删㰘\uD84F\uDCC7\uD857\uDED7\uD85D\uDE56\uD855\uDD31\uD846\uDD44\uD844\uDEFE\uD866\uDD03\uD85B\uDDDC\uD85C\uDCAD峁\uD858\uDDAD\uD862\uDE0F\uD84D\uDE77\uD840\uDCEE\uD85A\uDC46\uD853\uDF0E䕢嬟\uD858\uDF4C齐麦\uD858\uDE6B"],
    ["a3c0", "␀", 31, "␡"],
    ["c6a1", "①", 9, "⑴", 9, "ⅰ", 9, "丶丿亅亠冂冖冫勹匸卩厶夊宀巛⼳广廴彐彡攴无疒癶辵隶¨ˆヽヾゝゞ〃仝々〆〇ー［］✽ぁ", 23],
    ["c740", "す", 58, "ァアィイ"],
    ["c7a1", "ゥ", 81, "А", 5, "ЁЖ", 4],
    ["c840", "Л", 26, "ёж", 25, "⇧↸↹㇏\uD840\uDCCC乚\uD840\uDC8A刂䒑"],
    ["c8a1", "龰冈龱\uD85D\uDE07"],
    ["c8cd", "￢￤＇＂㈱№℡゛゜⺀⺄⺆⺇⺈⺊⺌⺍⺕⺜⺝⺥⺧⺪⺬⺮⺶⺼⺾⻆⻊⻌⻍⻏⻖⻗⻞⻣"],
    ["c8f5", "ʃɐɛɔɵœøŋʊɪ"],
    ["f9fe", "￭"],
    ["fa40", "\uD841\uDD47鋛\uD841\uDDDF\uD84F\uDFC5蕌䊵珯况㙉\uD852\uDD42\uD862\uDDE4鍄\uD846\uDDDB苮\uD84F\uDCC8砼杄拟\uD852\uDD33\uD862\uDDAA\uD840\uDEA0\uD85A\uDFB3\uD844\uDF05侫\uD849\uDCED倈\uD85B\uDD29\uD85E\uDE84\uD84D\uDE00\uD852\uDEB1\uD849\uDD13倩\uD840\uDF7E徤\uD840\uDF80\uD840\uDF47滛\uD841\uDC1F偽儁㑺儎顬㝃萖\uD852\uDDA4\uD841\uDC87兠\uD84C\uDFB4兪\uD842\uDFFF\uD848\uDCFC\uD840\uDEE5\uD849\uDD30\uD841\uDD8E\uD84C\uDE33\uD846\uDD83宂蝽\uD841\uDDB3\uD84F\uDC99冲冸"],
    ["faa1", "鴴凉减凑㳜凓\uD852\uDEA6决凢卂凭菍椾\uD84D\uDF2D彻刋刦刼劵剗劔効勅簕蕂勠蘍\uD85A\uDF13包\uD862\uDEDE啉滙\uD84F\uDF80\uD842\uDD54\uD84F\uDFEC匳卄\uD842\uDFE2泋\uD845\uDF26栛珕恊㺪㣌\uD845\uDEE8燝䒢卭却\uD861\uDEAB卾卿\uD845\uDD96\uD845\uDE13矦厓\uD862\uDE9B厠厫厮玧\uD855\uDF72㽙玜叁叅汉义埾叙㪫\uD842\uDF8F叠\uD84F\uDFEB\uD84B\uDDA3叶\uD843\uDC77吓灹唫晗浛呭\uD85A\uDF53\uD843\uDD74啝咏咤䞦\uD845\uDF0D\uD843\uDEDD㶴\uD843\uDD4D"],
    ["fb40", "\uD862\uDDBC\uD849\uDE98啇䳭启琗喆喩嘅\uD846\uDCD7\uD850\uDC3A䕒\uD851\uDC35暳\uD844\uDCB4嘷曍\uD84C\uDE8A暤暭噍噏磱囱鞇叾圀囯园\uD862\uDF66㘣\uD844\uDE4F坆\uD850\uDDA5汮炋坂㚱\uD85B\uDC7E埦\uD845\uDC16堃\uD845\uDC54\uD850\uDF63堦\uD852\uDFF5塜墪㕡壠壜\uD844\uDE3C壻寿坃\uD868\uDD50\uD850\uDE78鏓㖡够梦㛃湙"],
    ["fba1", "\uD845\uDE3E娤啓\uD845\uDE92蔅姉\uD843\uDD4E\uD85B\uDC81\uD85B\uDD2A\uD845\uDFDC姙\uD845\uDFFB\uD845\uDFB2\uD85B\uDDA6浱\uD846\uDC28\uD845\uDED5姹\uD85B\uDE45媫婣㛦\uD852\uDDA9婷㜈媖瑥嫓\uD85B\uDFA1\uD849\uDD54㶅\uD846\uDD11㜲\uD845\uDEB8広勐孶斈孼\uD85E\uDE0E䀄䡝\uD840\uDE04寕慠\uD846\uDE34\uD856\uDDCC\uD841\uDDA5寳宝䴐尅\uD846\uDF44尓珎尔\uD847\uDCA5\uD85A\uDF28屉䣝岅峩峯嶋\uD847\uDDF9\uD847\uDE37崐崘嵆\uD847\uDEA4岺巗苼㠭\uD852\uDD01\uD848\uDC49\uD848\uDD73芇㠶㯂帮檊幵幺\uD851\uDCBC\uD843\uDCD3厦亷廐厨\uD845\uDF71帉廴\uD861\uDC82"],
    ["fc40", "廹廻㢠廼栾鐛弍\uD840\uDDC1\uD87E\uDC94㫞䢮\uD844\uDF3A强\uD85A\uDC88\uD848\uDFD0彘\uD849\uDC71彣鞽\uD85B\uDE6E彲鍀\uD862\uDE36徧嶶㵟\uD854\uDE50\uD847\uDF6A\uD85C\uDCF8\uD849\uDE68釖\uD840\uDE9E\uD862\uDE29怱暅\uD846\uDC77㥣㷇㘹垐\uD849\uDFB4祱㹀悞悤悳\uD852\uDD82\uD852\uDD8F\uD85E\uDE53璤僡媠慤萤慂\uD87E\uDCA6\uD85B\uDED2憁凴\uD841\uDE56憇宪\uD84F\uDFB7"],
    ["fca1", "\uD84A\uDC5F懓\uD862\uDF9D\uD866\uDD5D懐㤲\uD84A\uDD80\uD84A\uDCC1怣慜攞掋\uD840\uDD18担\uD845\uDF70拕\uD84B\uDE0D捬\uD852\uDDDF㨗搸揸\uD844\uDF8E\uD845\uDFFC撐澊\uD84B\uDE36頔\uD850\uDC8C\uD855\uDF1D擡擥鑻㩦携㩗敍漖\uD852\uDE28\uD852\uDE23斅敭敟\uD84C\uDC7E斵\uD852\uDD40䬷旑䃘\uD846\uDC29无旣忟\uD84D\uDC00昘\uD84C\uDDF7\uD84C\uDDF8晄\uD84C\uDDA4\uD84C\uDDA5晋\uD843\uDE75晧\uD854\uDDE6晳晴\uD847\uDE3D\uD84C\uDE31\uD861\uDDF4\uD84C\uDDC8\uD854\uDF13矅\uD84A\uDCF7馤朂\uD850\uDF9C\uD852\uDE21㬫槺\uD84D\uDFC2杞杧杢\uD850\uDDCD\uD864\uDCED柗䓩栢湐鈼栁\uD84C\uDFE6\uD85B\uDDA0桝"],
    ["fd40", "\uD84D\uDC6F槡樋\uD862\uDEDF楳棃\uD84D\uDDCD椁椀㴲㨁\uD84D\uDE3C㮀枬楡\uD862\uDE4A䋼椶榘㮡\uD840\uDFC9荣傐槹\uD84D\uDE59\uD848\uDD2A橅\uD84D\uDF03檝㯳枱櫈\uD864\uDD9C㰍欝\uD842\uDD23惞欵歴\uD849\uDFCD溵\uD84E\uDEDB\uD840\uDFB5\uD846\uDD58㝀吡\uD84E\uDF5A毡\uD84F\uDEFC毜氷\uD849\uDC8B\uD852\uDCF1\uD85A\uDF51汚舦汹\uD84F\uDDBC䓅\uD84F\uDDBD\uD850\uDDA4\uD852\uDD0C\uD852\uDD00"],
    ["fda1", "\uD84F\uDCC9㛥㳫\uD843\uDD32鮃\uD84C\uDDF9\uD849\uDC91羏样\uD85B\uDD25\uD85B\uDDA1\uD85B\uDDEB涖浜湼漄\uD852\uDD7F\uD850\uDC85\uD85B\uDE72蔳\uD85B\uDF74凇沜渝萮\uD862\uDF21港\uD84F\uDE2F瑓\uD84F\uDF82秌湏媑\uD84C\uDC4B濸㜍澝\uD84F\uDE30滺\uD845\uDC97\uD850\uDC3D䕕鏰潄潜㵎潴\uD864\uDD70㴻澟\uD850\uDD44濓\uD850\uDC91\uD850\uDD55\uD850\uDC39\uD84F\uDFF0\uD84F\uDFB4\uD850\uDD3F凟\uD850\uDD56\uD850\uDD57\uD850\uDD40\uD858\uDDDD灋灾炧炁烌烕烖烟䄄㷨熴熖\uD850\uDE77焫煅媈煊煮岜\uD850\uDF65煏鍢\uD850\uDEC1焬\uD851\uDC5A\uD852\uDE27\uD852\uDE22熺\uD862\uDFE8炽爎"],
    ["fe40", "鑂爕夑鑃爤鍁\uD855\uDE05爮牀\uD852\uDD74梽牕牗㹕\uD84C\uDC44栍漽犂猪猫\uD852\uDC23\uD862\uDC2B䣭\uD862\uDC04猨献珏玪\uD843\uDC3A\uD85A\uDE2E珉瑉\uD850\uDDE2\uD845\uDEE7\uD852\uDE24昣㛅\uD852\uDDB7\uD852\uDD8D\uD852\uDDFB珷琕椃\uD852\uDE26琹\uD841\uDDC3㻗瑜\uD84A\uDCAD瑠\uD863\uDEB2瑇珤瑶莹瑬㜰瑴鏱樬璂䥓\uD852\uDE8C"],
    ["fea1", "\uD850\uDD5F\uD852\uDE79\uD862\uDF8F孆\uD863\uDC03\uD846\uDC9E瓈\uD846\uDD88甎瓩甞\uD863\uDED9\uD846\uDE4B寗\uD863\uDEAC鎅畍畊畧畮\uD853\uDF82㼄\uD853\uDD13疎瑝疞疴瘂瘬癑癏癯癶\uD858\uDFF5皐臯㟸\uD85A\uDD11\uD85A\uDD0E皡皥皷盌\uD85B\uDF9F葢\uD854\uDC9D\uD854\uDD7D\uD847\uDE1C眞眦着撯\uD854\uDE20睘\uD84C\uDEAC瞯\uD862\uDD64\uD862\uDD68\uD845\uDEC1矴砉\uD844\uDF76\uD852\uDE12棊碯磇磓隥礮\uD855\uDDE0磗礴碱\uD85D\uDE0C辸袄\uD862\uDF2B\uD858\uDC83\uD849\uDE1C禆褀椂禀\uD856\uDC57禝\uD85E\uDF39礼禩渪\uD85C\uDD26㺨秆\uD864\uDD0D秔"]
  ];
});

// node_modules/iconv-lite/encodings/dbcs-data.js
var require_dbcs_data = __commonJS((exports, module) => {
  module.exports = {
    shiftjis: {
      type: "_dbcs",
      table: function() {
        return require_shiftjis();
      },
      encodeAdd: { "¥": 92, "‾": 126 },
      encodeSkipVals: [{ from: 60736, to: 63808 }]
    },
    csshiftjis: "shiftjis",
    mskanji: "shiftjis",
    sjis: "shiftjis",
    windows31j: "shiftjis",
    ms31j: "shiftjis",
    xsjis: "shiftjis",
    windows932: "shiftjis",
    ms932: "shiftjis",
    "932": "shiftjis",
    cp932: "shiftjis",
    eucjp: {
      type: "_dbcs",
      table: function() {
        return require_eucjp();
      },
      encodeAdd: { "¥": 92, "‾": 126 }
    },
    gb2312: "cp936",
    gb231280: "cp936",
    gb23121980: "cp936",
    csgb2312: "cp936",
    csiso58gb231280: "cp936",
    euccn: "cp936",
    windows936: "cp936",
    ms936: "cp936",
    "936": "cp936",
    cp936: {
      type: "_dbcs",
      table: function() {
        return require_cp936();
      }
    },
    gbk: {
      type: "_dbcs",
      table: function() {
        return require_cp936().concat(require_gbk_added());
      }
    },
    xgbk: "gbk",
    isoir58: "gbk",
    gb18030: {
      type: "_dbcs",
      table: function() {
        return require_cp936().concat(require_gbk_added());
      },
      gb18030: function() {
        return require_gb18030_ranges();
      },
      encodeSkipVals: [128],
      encodeAdd: { "€": 41699 }
    },
    chinese: "gb18030",
    windows949: "cp949",
    ms949: "cp949",
    "949": "cp949",
    cp949: {
      type: "_dbcs",
      table: function() {
        return require_cp949();
      }
    },
    cseuckr: "cp949",
    csksc56011987: "cp949",
    euckr: "cp949",
    isoir149: "cp949",
    korean: "cp949",
    ksc56011987: "cp949",
    ksc56011989: "cp949",
    ksc5601: "cp949",
    windows950: "cp950",
    ms950: "cp950",
    "950": "cp950",
    cp950: {
      type: "_dbcs",
      table: function() {
        return require_cp950();
      }
    },
    big5: "big5hkscs",
    big5hkscs: {
      type: "_dbcs",
      table: function() {
        return require_cp950().concat(require_big5_added());
      },
      encodeSkipVals: [41676]
    },
    cnbig5: "big5hkscs",
    csbig5: "big5hkscs",
    xxbig5: "big5hkscs"
  };
});

// node_modules/iconv-lite/encodings/index.js
var require_encodings = __commonJS((exports, module) => {
  var modules = [
    require_internal(),
    require_utf16(),
    require_utf7(),
    require_sbcs_codec(),
    require_sbcs_data(),
    require_sbcs_data_generated(),
    require_dbcs_codec(),
    require_dbcs_data()
  ];
  for (i = 0;i < modules.length; i++) {
    module = modules[i];
    for (enc in module)
      if (Object.prototype.hasOwnProperty.call(module, enc))
        exports[enc] = module[enc];
  }
  var module;
  var enc;
  var i;
});

// node_modules/iconv-lite/lib/streams.js
var require_streams = __commonJS((exports, module) => {
  var Buffer2 = __require("buffer").Buffer;
  var Transform = __require("stream").Transform;
  module.exports = function(iconv) {
    iconv.encodeStream = function encodeStream(encoding, options) {
      return new IconvLiteEncoderStream(iconv.getEncoder(encoding, options), options);
    };
    iconv.decodeStream = function decodeStream(encoding, options) {
      return new IconvLiteDecoderStream(iconv.getDecoder(encoding, options), options);
    };
    iconv.supportsStreams = true;
    iconv.IconvLiteEncoderStream = IconvLiteEncoderStream;
    iconv.IconvLiteDecoderStream = IconvLiteDecoderStream;
    iconv._collect = IconvLiteDecoderStream.prototype.collect;
  };
  function IconvLiteEncoderStream(conv, options) {
    this.conv = conv;
    options = options || {};
    options.decodeStrings = false;
    Transform.call(this, options);
  }
  IconvLiteEncoderStream.prototype = Object.create(Transform.prototype, {
    constructor: { value: IconvLiteEncoderStream }
  });
  IconvLiteEncoderStream.prototype._transform = function(chunk, encoding, done) {
    if (typeof chunk != "string")
      return done(new Error("Iconv encoding stream needs strings as its input."));
    try {
      var res = this.conv.write(chunk);
      if (res && res.length)
        this.push(res);
      done();
    } catch (e) {
      done(e);
    }
  };
  IconvLiteEncoderStream.prototype._flush = function(done) {
    try {
      var res = this.conv.end();
      if (res && res.length)
        this.push(res);
      done();
    } catch (e) {
      done(e);
    }
  };
  IconvLiteEncoderStream.prototype.collect = function(cb) {
    var chunks = [];
    this.on("error", cb);
    this.on("data", function(chunk) {
      chunks.push(chunk);
    });
    this.on("end", function() {
      cb(null, Buffer2.concat(chunks));
    });
    return this;
  };
  function IconvLiteDecoderStream(conv, options) {
    this.conv = conv;
    options = options || {};
    options.encoding = this.encoding = "utf8";
    Transform.call(this, options);
  }
  IconvLiteDecoderStream.prototype = Object.create(Transform.prototype, {
    constructor: { value: IconvLiteDecoderStream }
  });
  IconvLiteDecoderStream.prototype._transform = function(chunk, encoding, done) {
    if (!Buffer2.isBuffer(chunk))
      return done(new Error("Iconv decoding stream needs buffers as its input."));
    try {
      var res = this.conv.write(chunk);
      if (res && res.length)
        this.push(res, this.encoding);
      done();
    } catch (e) {
      done(e);
    }
  };
  IconvLiteDecoderStream.prototype._flush = function(done) {
    try {
      var res = this.conv.end();
      if (res && res.length)
        this.push(res, this.encoding);
      done();
    } catch (e) {
      done(e);
    }
  };
  IconvLiteDecoderStream.prototype.collect = function(cb) {
    var res = "";
    this.on("error", cb);
    this.on("data", function(chunk) {
      res += chunk;
    });
    this.on("end", function() {
      cb(null, res);
    });
    return this;
  };
});

// node_modules/iconv-lite/lib/extend-node.js
var require_extend_node = __commonJS((exports, module) => {
  var Buffer2 = __require("buffer").Buffer;
  module.exports = function(iconv) {
    var original = undefined;
    iconv.supportsNodeEncodingsExtension = !(Buffer2.from || new Buffer2(0) instanceof Uint8Array);
    iconv.extendNodeEncodings = function extendNodeEncodings() {
      if (original)
        return;
      original = {};
      if (!iconv.supportsNodeEncodingsExtension) {
        console.error("ACTION NEEDED: require('iconv-lite').extendNodeEncodings() is not supported in your version of Node");
        console.error("See more info at https://github.com/ashtuchkin/iconv-lite/wiki/Node-v4-compatibility");
        return;
      }
      var nodeNativeEncodings = {
        hex: true,
        utf8: true,
        "utf-8": true,
        ascii: true,
        binary: true,
        base64: true,
        ucs2: true,
        "ucs-2": true,
        utf16le: true,
        "utf-16le": true
      };
      Buffer2.isNativeEncoding = function(enc) {
        return enc && nodeNativeEncodings[enc.toLowerCase()];
      };
      var SlowBuffer = __require("buffer").SlowBuffer;
      original.SlowBufferToString = SlowBuffer.prototype.toString;
      SlowBuffer.prototype.toString = function(encoding, start, end) {
        encoding = String(encoding || "utf8").toLowerCase();
        if (Buffer2.isNativeEncoding(encoding))
          return original.SlowBufferToString.call(this, encoding, start, end);
        if (typeof start == "undefined")
          start = 0;
        if (typeof end == "undefined")
          end = this.length;
        return iconv.decode(this.slice(start, end), encoding);
      };
      original.SlowBufferWrite = SlowBuffer.prototype.write;
      SlowBuffer.prototype.write = function(string, offset, length, encoding) {
        if (isFinite(offset)) {
          if (!isFinite(length)) {
            encoding = length;
            length = undefined;
          }
        } else {
          var swap = encoding;
          encoding = offset;
          offset = length;
          length = swap;
        }
        offset = +offset || 0;
        var remaining = this.length - offset;
        if (!length) {
          length = remaining;
        } else {
          length = +length;
          if (length > remaining) {
            length = remaining;
          }
        }
        encoding = String(encoding || "utf8").toLowerCase();
        if (Buffer2.isNativeEncoding(encoding))
          return original.SlowBufferWrite.call(this, string, offset, length, encoding);
        if (string.length > 0 && (length < 0 || offset < 0))
          throw new RangeError("attempt to write beyond buffer bounds");
        var buf = iconv.encode(string, encoding);
        if (buf.length < length)
          length = buf.length;
        buf.copy(this, offset, 0, length);
        return length;
      };
      original.BufferIsEncoding = Buffer2.isEncoding;
      Buffer2.isEncoding = function(encoding) {
        return Buffer2.isNativeEncoding(encoding) || iconv.encodingExists(encoding);
      };
      original.BufferByteLength = Buffer2.byteLength;
      Buffer2.byteLength = SlowBuffer.byteLength = function(str, encoding) {
        encoding = String(encoding || "utf8").toLowerCase();
        if (Buffer2.isNativeEncoding(encoding))
          return original.BufferByteLength.call(this, str, encoding);
        return iconv.encode(str, encoding).length;
      };
      original.BufferToString = Buffer2.prototype.toString;
      Buffer2.prototype.toString = function(encoding, start, end) {
        encoding = String(encoding || "utf8").toLowerCase();
        if (Buffer2.isNativeEncoding(encoding))
          return original.BufferToString.call(this, encoding, start, end);
        if (typeof start == "undefined")
          start = 0;
        if (typeof end == "undefined")
          end = this.length;
        return iconv.decode(this.slice(start, end), encoding);
      };
      original.BufferWrite = Buffer2.prototype.write;
      Buffer2.prototype.write = function(string, offset, length, encoding) {
        var _offset = offset, _length = length, _encoding = encoding;
        if (isFinite(offset)) {
          if (!isFinite(length)) {
            encoding = length;
            length = undefined;
          }
        } else {
          var swap = encoding;
          encoding = offset;
          offset = length;
          length = swap;
        }
        encoding = String(encoding || "utf8").toLowerCase();
        if (Buffer2.isNativeEncoding(encoding))
          return original.BufferWrite.call(this, string, _offset, _length, _encoding);
        offset = +offset || 0;
        var remaining = this.length - offset;
        if (!length) {
          length = remaining;
        } else {
          length = +length;
          if (length > remaining) {
            length = remaining;
          }
        }
        if (string.length > 0 && (length < 0 || offset < 0))
          throw new RangeError("attempt to write beyond buffer bounds");
        var buf = iconv.encode(string, encoding);
        if (buf.length < length)
          length = buf.length;
        buf.copy(this, offset, 0, length);
        return length;
      };
      if (iconv.supportsStreams) {
        var Readable = __require("stream").Readable;
        original.ReadableSetEncoding = Readable.prototype.setEncoding;
        Readable.prototype.setEncoding = function setEncoding(enc, options) {
          this._readableState.decoder = iconv.getDecoder(enc, options);
          this._readableState.encoding = enc;
        };
        Readable.prototype.collect = iconv._collect;
      }
    };
    iconv.undoExtendNodeEncodings = function undoExtendNodeEncodings() {
      if (!iconv.supportsNodeEncodingsExtension)
        return;
      if (!original)
        throw new Error("require('iconv-lite').undoExtendNodeEncodings(): Nothing to undo; extendNodeEncodings() is not called.");
      delete Buffer2.isNativeEncoding;
      var SlowBuffer = __require("buffer").SlowBuffer;
      SlowBuffer.prototype.toString = original.SlowBufferToString;
      SlowBuffer.prototype.write = original.SlowBufferWrite;
      Buffer2.isEncoding = original.BufferIsEncoding;
      Buffer2.byteLength = original.BufferByteLength;
      Buffer2.prototype.toString = original.BufferToString;
      Buffer2.prototype.write = original.BufferWrite;
      if (iconv.supportsStreams) {
        var Readable = __require("stream").Readable;
        Readable.prototype.setEncoding = original.ReadableSetEncoding;
        delete Readable.prototype.collect;
      }
      original = undefined;
    };
  };
});

// node_modules/iconv-lite/lib/index.js
var require_lib3 = __commonJS((exports, module) => {
  var Buffer2 = require_safer().Buffer;
  var bomHandling = require_bom_handling();
  var iconv = exports;
  iconv.encodings = null;
  iconv.defaultCharUnicode = "�";
  iconv.defaultCharSingleByte = "?";
  iconv.encode = function encode(str, encoding, options) {
    str = "" + (str || "");
    var encoder = iconv.getEncoder(encoding, options);
    var res = encoder.write(str);
    var trail = encoder.end();
    return trail && trail.length > 0 ? Buffer2.concat([res, trail]) : res;
  };
  iconv.decode = function decode(buf, encoding, options) {
    if (typeof buf === "string") {
      if (!iconv.skipDecodeWarning) {
        console.error("Iconv-lite warning: decode()-ing strings is deprecated. Refer to https://github.com/ashtuchkin/iconv-lite/wiki/Use-Buffers-when-decoding");
        iconv.skipDecodeWarning = true;
      }
      buf = Buffer2.from("" + (buf || ""), "binary");
    }
    var decoder = iconv.getDecoder(encoding, options);
    var res = decoder.write(buf);
    var trail = decoder.end();
    return trail ? res + trail : res;
  };
  iconv.encodingExists = function encodingExists(enc) {
    try {
      iconv.getCodec(enc);
      return true;
    } catch (e) {
      return false;
    }
  };
  iconv.toEncoding = iconv.encode;
  iconv.fromEncoding = iconv.decode;
  iconv._codecDataCache = {};
  iconv.getCodec = function getCodec(encoding) {
    if (!iconv.encodings)
      iconv.encodings = require_encodings();
    var enc = iconv._canonicalizeEncoding(encoding);
    var codecOptions = {};
    while (true) {
      var codec = iconv._codecDataCache[enc];
      if (codec)
        return codec;
      var codecDef = iconv.encodings[enc];
      switch (typeof codecDef) {
        case "string":
          enc = codecDef;
          break;
        case "object":
          for (var key2 in codecDef)
            codecOptions[key2] = codecDef[key2];
          if (!codecOptions.encodingName)
            codecOptions.encodingName = enc;
          enc = codecDef.type;
          break;
        case "function":
          if (!codecOptions.encodingName)
            codecOptions.encodingName = enc;
          codec = new codecDef(codecOptions, iconv);
          iconv._codecDataCache[codecOptions.encodingName] = codec;
          return codec;
        default:
          throw new Error("Encoding not recognized: '" + encoding + "' (searched as: '" + enc + "')");
      }
    }
  };
  iconv._canonicalizeEncoding = function(encoding) {
    return ("" + encoding).toLowerCase().replace(/:\d{4}$|[^0-9a-z]/g, "");
  };
  iconv.getEncoder = function getEncoder(encoding, options) {
    var codec = iconv.getCodec(encoding), encoder = new codec.encoder(options, codec);
    if (codec.bomAware && options && options.addBOM)
      encoder = new bomHandling.PrependBOM(encoder, options);
    return encoder;
  };
  iconv.getDecoder = function getDecoder(encoding, options) {
    var codec = iconv.getCodec(encoding), decoder = new codec.decoder(options, codec);
    if (codec.bomAware && !(options && options.stripBOM === false))
      decoder = new bomHandling.StripBOM(decoder, options);
    return decoder;
  };
  var nodeVer = typeof process !== "undefined" && process.versions && process.versions.node;
  if (nodeVer) {
    nodeVerArr = nodeVer.split(".").map(Number);
    if (nodeVerArr[0] > 0 || nodeVerArr[1] >= 10) {
      require_streams()(iconv);
    }
    require_extend_node()(iconv);
  }
  var nodeVerArr;
  if (false) {
  }
});

// node_modules/os-tmpdir/index.js
var require_os_tmpdir = __commonJS((exports, module) => {
  var isWindows = process.platform === "win32";
  var trailingSlashRe = isWindows ? /[^:]\\$/ : /.\/$/;
  module.exports = function() {
    var path;
    if (isWindows) {
      path = process.env.TEMP || process.env.TMP || (process.env.SystemRoot || process.env.windir) + "\\temp";
    } else {
      path = process.env.TMPDIR || process.env.TMP || process.env.TEMP || "/tmp";
    }
    if (trailingSlashRe.test(path)) {
      path = path.slice(0, -1);
    }
    return path;
  };
});

// node_modules/tmp/lib/tmp.js
var require_tmp = __commonJS((exports, module) => {
  /*!
   * Tmp
   *
   * Copyright (c) 2011-2017 KARASZI Istvan <github@spam.raszi.hu>
   *
   * MIT Licensed
   */
  var fs = __require("fs");
  var path = __require("path");
  var crypto = __require("crypto");
  var osTmpDir = require_os_tmpdir();
  var _c = process.binding("constants");
  var tmpDir = osTmpDir();
  var RANDOM_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  var TEMPLATE_PATTERN = /XXXXXX/;
  var DEFAULT_TRIES = 3;
  var CREATE_FLAGS = (_c.O_CREAT || _c.fs.O_CREAT) | (_c.O_EXCL || _c.fs.O_EXCL) | (_c.O_RDWR || _c.fs.O_RDWR);
  var EBADF = _c.EBADF || _c.os.errno.EBADF;
  var ENOENT = _c.ENOENT || _c.os.errno.ENOENT;
  var DIR_MODE = 448;
  var FILE_MODE = 384;
  var _removeObjects = [];
  var _gracefulCleanup = false;
  var _uncaughtException = false;
  function _randomChars(howMany) {
    var value = [], rnd = null;
    try {
      rnd = crypto.randomBytes(howMany);
    } catch (e) {
      rnd = crypto.pseudoRandomBytes(howMany);
    }
    for (var i = 0;i < howMany; i++) {
      value.push(RANDOM_CHARS[rnd[i] % RANDOM_CHARS.length]);
    }
    return value.join("");
  }
  function _isUndefined(obj) {
    return typeof obj === "undefined";
  }
  function _parseArguments(options, callback) {
    if (typeof options == "function") {
      return [callback || {}, options];
    }
    if (_isUndefined(options)) {
      return [{}, callback];
    }
    return [options, callback];
  }
  function _generateTmpName(opts) {
    if (opts.name) {
      return path.join(opts.dir || tmpDir, opts.name);
    }
    if (opts.template) {
      return opts.template.replace(TEMPLATE_PATTERN, _randomChars(6));
    }
    const name = [
      opts.prefix || "tmp-",
      process.pid,
      _randomChars(12),
      opts.postfix || ""
    ].join("");
    return path.join(opts.dir || tmpDir, name);
  }
  function tmpName(options, callback) {
    var args = _parseArguments(options, callback), opts = args[0], cb = args[1], tries = opts.name ? 1 : opts.tries || DEFAULT_TRIES;
    if (isNaN(tries) || tries < 0)
      return cb(new Error("Invalid tries"));
    if (opts.template && !opts.template.match(TEMPLATE_PATTERN))
      return cb(new Error("Invalid template provided"));
    (function _getUniqueName() {
      const name = _generateTmpName(opts);
      fs.stat(name, function(err) {
        if (!err) {
          if (tries-- > 0)
            return _getUniqueName();
          return cb(new Error("Could not get a unique tmp filename, max tries reached " + name));
        }
        cb(null, name);
      });
    })();
  }
  function tmpNameSync(options) {
    var args = _parseArguments(options), opts = args[0], tries = opts.name ? 1 : opts.tries || DEFAULT_TRIES;
    if (isNaN(tries) || tries < 0)
      throw new Error("Invalid tries");
    if (opts.template && !opts.template.match(TEMPLATE_PATTERN))
      throw new Error("Invalid template provided");
    do {
      const name = _generateTmpName(opts);
      try {
        fs.statSync(name);
      } catch (e) {
        return name;
      }
    } while (tries-- > 0);
    throw new Error("Could not get a unique tmp filename, max tries reached");
  }
  function file(options, callback) {
    var args = _parseArguments(options, callback), opts = args[0], cb = args[1];
    opts.postfix = _isUndefined(opts.postfix) ? ".tmp" : opts.postfix;
    tmpName(opts, function _tmpNameCreated(err, name) {
      if (err)
        return cb(err);
      fs.open(name, CREATE_FLAGS, opts.mode || FILE_MODE, function _fileCreated(err2, fd) {
        if (err2)
          return cb(err2);
        if (opts.discardDescriptor) {
          return fs.close(fd, function _discardCallback(err3) {
            if (err3) {
              try {
                fs.unlinkSync(name);
              } catch (e) {
                if (!isENOENT(e)) {
                  err3 = e;
                }
              }
              return cb(err3);
            }
            cb(null, name, undefined, _prepareTmpFileRemoveCallback(name, -1, opts));
          });
        }
        if (opts.detachDescriptor) {
          return cb(null, name, fd, _prepareTmpFileRemoveCallback(name, -1, opts));
        }
        cb(null, name, fd, _prepareTmpFileRemoveCallback(name, fd, opts));
      });
    });
  }
  function fileSync(options) {
    var args = _parseArguments(options), opts = args[0];
    opts.postfix = opts.postfix || ".tmp";
    const discardOrDetachDescriptor = opts.discardDescriptor || opts.detachDescriptor;
    const name = tmpNameSync(opts);
    var fd = fs.openSync(name, CREATE_FLAGS, opts.mode || FILE_MODE);
    if (opts.discardDescriptor) {
      fs.closeSync(fd);
      fd = undefined;
    }
    return {
      name,
      fd,
      removeCallback: _prepareTmpFileRemoveCallback(name, discardOrDetachDescriptor ? -1 : fd, opts)
    };
  }
  function _rmdirRecursiveSync(root) {
    const dirs = [root];
    do {
      var dir2 = dirs.pop(), deferred = false, files = fs.readdirSync(dir2);
      for (var i = 0, length = files.length;i < length; i++) {
        var file2 = path.join(dir2, files[i]), stat = fs.lstatSync(file2);
        if (stat.isDirectory()) {
          if (!deferred) {
            deferred = true;
            dirs.push(dir2);
          }
          dirs.push(file2);
        } else {
          fs.unlinkSync(file2);
        }
      }
      if (!deferred) {
        fs.rmdirSync(dir2);
      }
    } while (dirs.length !== 0);
  }
  function dir(options, callback) {
    var args = _parseArguments(options, callback), opts = args[0], cb = args[1];
    tmpName(opts, function _tmpNameCreated(err, name) {
      if (err)
        return cb(err);
      fs.mkdir(name, opts.mode || DIR_MODE, function _dirCreated(err2) {
        if (err2)
          return cb(err2);
        cb(null, name, _prepareTmpDirRemoveCallback(name, opts));
      });
    });
  }
  function dirSync(options) {
    var args = _parseArguments(options), opts = args[0];
    const name = tmpNameSync(opts);
    fs.mkdirSync(name, opts.mode || DIR_MODE);
    return {
      name,
      removeCallback: _prepareTmpDirRemoveCallback(name, opts)
    };
  }
  function _prepareTmpFileRemoveCallback(name, fd, opts) {
    const removeCallback = _prepareRemoveCallback(function _removeCallback(fdPath) {
      try {
        if (0 <= fdPath[0]) {
          fs.closeSync(fdPath[0]);
        }
      } catch (e) {
        if (!isEBADF(e) && !isENOENT(e)) {
          throw e;
        }
      }
      try {
        fs.unlinkSync(fdPath[1]);
      } catch (e) {
        if (!isENOENT(e)) {
          throw e;
        }
      }
    }, [fd, name]);
    if (!opts.keep) {
      _removeObjects.unshift(removeCallback);
    }
    return removeCallback;
  }
  function _prepareTmpDirRemoveCallback(name, opts) {
    const removeFunction = opts.unsafeCleanup ? _rmdirRecursiveSync : fs.rmdirSync.bind(fs);
    const removeCallback = _prepareRemoveCallback(removeFunction, name);
    if (!opts.keep) {
      _removeObjects.unshift(removeCallback);
    }
    return removeCallback;
  }
  function _prepareRemoveCallback(removeFunction, arg) {
    var called = false;
    return function _cleanupCallback(next) {
      if (!called) {
        const index = _removeObjects.indexOf(_cleanupCallback);
        if (index >= 0) {
          _removeObjects.splice(index, 1);
        }
        called = true;
        removeFunction(arg);
      }
      if (next)
        next(null);
    };
  }
  function _garbageCollector() {
    if (_uncaughtException && !_gracefulCleanup) {
      return;
    }
    while (_removeObjects.length) {
      try {
        _removeObjects[0].call(null);
      } catch (e) {
      }
    }
  }
  function isEBADF(error) {
    return isExpectedError(error, -EBADF, "EBADF");
  }
  function isENOENT(error) {
    return isExpectedError(error, -ENOENT, "ENOENT");
  }
  function isExpectedError(error, code, errno) {
    return error.code == code || error.code == errno;
  }
  function setGracefulCleanup() {
    _gracefulCleanup = true;
  }
  var version = process.versions.node.split(".").map(function(value) {
    return parseInt(value, 10);
  });
  if (version[0] === 0 && (version[1] < 9 || version[1] === 9 && version[2] < 5)) {
    process.addListener("uncaughtException", function _uncaughtExceptionThrown(err) {
      _uncaughtException = true;
      _garbageCollector();
      throw err;
    });
  }
  process.addListener("exit", function _exit(code) {
    if (code)
      _uncaughtException = true;
    _garbageCollector();
  });
  exports.tmpdir = tmpDir;
  exports.dir = dir;
  exports.dirSync = dirSync;
  exports.file = file;
  exports.fileSync = fileSync;
  exports.tmpName = tmpName;
  exports.tmpNameSync = tmpNameSync;
  exports.setGracefulCleanup = setGracefulCleanup;
});

// node_modules/external-editor/main/errors/CreateFileError.js
var require_CreateFileError = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (b2.hasOwnProperty(p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  var CreateFileError = function(_super) {
    __extends(CreateFileError2, _super);
    function CreateFileError2(originalError) {
      var _newTarget = this.constructor;
      var _this = _super.call(this, "Failed to create temporary file for editor") || this;
      _this.originalError = originalError;
      var proto2 = _newTarget.prototype;
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(_this, proto2);
      } else {
        _this.__proto__ = _newTarget.prototype;
      }
      return _this;
    }
    return CreateFileError2;
  }(Error);
  exports.CreateFileError = CreateFileError;
});

// node_modules/external-editor/main/errors/LaunchEditorError.js
var require_LaunchEditorError = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (b2.hasOwnProperty(p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  var LaunchEditorError = function(_super) {
    __extends(LaunchEditorError2, _super);
    function LaunchEditorError2(originalError) {
      var _newTarget = this.constructor;
      var _this = _super.call(this, "Failed launch editor") || this;
      _this.originalError = originalError;
      var proto2 = _newTarget.prototype;
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(_this, proto2);
      } else {
        _this.__proto__ = _newTarget.prototype;
      }
      return _this;
    }
    return LaunchEditorError2;
  }(Error);
  exports.LaunchEditorError = LaunchEditorError;
});

// node_modules/external-editor/main/errors/ReadFileError.js
var require_ReadFileError = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (b2.hasOwnProperty(p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  var ReadFileError = function(_super) {
    __extends(ReadFileError2, _super);
    function ReadFileError2(originalError) {
      var _newTarget = this.constructor;
      var _this = _super.call(this, "Failed to read temporary file") || this;
      _this.originalError = originalError;
      var proto2 = _newTarget.prototype;
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(_this, proto2);
      } else {
        _this.__proto__ = _newTarget.prototype;
      }
      return _this;
    }
    return ReadFileError2;
  }(Error);
  exports.ReadFileError = ReadFileError;
});

// node_modules/external-editor/main/errors/RemoveFileError.js
var require_RemoveFileError = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (b2.hasOwnProperty(p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  var RemoveFileError = function(_super) {
    __extends(RemoveFileError2, _super);
    function RemoveFileError2(originalError) {
      var _newTarget = this.constructor;
      var _this = _super.call(this, "Failed to cleanup temporary file") || this;
      _this.originalError = originalError;
      var proto2 = _newTarget.prototype;
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(_this, proto2);
      } else {
        _this.__proto__ = _newTarget.prototype;
      }
      return _this;
    }
    return RemoveFileError2;
  }(Error);
  exports.RemoveFileError = RemoveFileError;
});

// node_modules/external-editor/main/index.js
var require_main = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var chardet_1 = require_chardet();
  var child_process_1 = __require("child_process");
  var fs_1 = __require("fs");
  var iconv_lite_1 = require_lib3();
  var tmp_1 = require_tmp();
  var CreateFileError_1 = require_CreateFileError();
  exports.CreateFileError = CreateFileError_1.CreateFileError;
  var LaunchEditorError_1 = require_LaunchEditorError();
  exports.LaunchEditorError = LaunchEditorError_1.LaunchEditorError;
  var ReadFileError_1 = require_ReadFileError();
  exports.ReadFileError = ReadFileError_1.ReadFileError;
  var RemoveFileError_1 = require_RemoveFileError();
  exports.RemoveFileError = RemoveFileError_1.RemoveFileError;
  function edit(text, fileOptions) {
    if (text === undefined) {
      text = "";
    }
    var editor = new ExternalEditor(text, fileOptions);
    editor.run();
    editor.cleanup();
    return editor.text;
  }
  exports.edit = edit;
  function editAsync(text, callback, fileOptions) {
    if (text === undefined) {
      text = "";
    }
    var editor = new ExternalEditor(text, fileOptions);
    editor.runAsync(function(err, result) {
      if (err) {
        setImmediate(callback, err, null);
      } else {
        try {
          editor.cleanup();
          setImmediate(callback, null, result);
        } catch (cleanupError) {
          setImmediate(callback, cleanupError, null);
        }
      }
    });
  }
  exports.editAsync = editAsync;
  var ExternalEditor = function() {
    function ExternalEditor2(text, fileOptions) {
      if (text === undefined) {
        text = "";
      }
      this.text = "";
      this.fileOptions = {};
      this.text = text;
      if (fileOptions) {
        this.fileOptions = fileOptions;
      }
      this.determineEditor();
      this.createTemporaryFile();
    }
    ExternalEditor2.splitStringBySpace = function(str) {
      var pieces = [];
      var currentString = "";
      for (var strIndex = 0;strIndex < str.length; strIndex++) {
        var currentLetter = str[strIndex];
        if (strIndex > 0 && currentLetter === " " && str[strIndex - 1] !== "\\" && currentString.length > 0) {
          pieces.push(currentString);
          currentString = "";
        } else {
          currentString += currentLetter;
        }
      }
      if (currentString.length > 0) {
        pieces.push(currentString);
      }
      return pieces;
    };
    Object.defineProperty(ExternalEditor2.prototype, "temp_file", {
      get: function() {
        console.log("DEPRECATED: temp_file. Use tempFile moving forward.");
        return this.tempFile;
      },
      enumerable: true,
      configurable: true
    });
    Object.defineProperty(ExternalEditor2.prototype, "last_exit_status", {
      get: function() {
        console.log("DEPRECATED: last_exit_status. Use lastExitStatus moving forward.");
        return this.lastExitStatus;
      },
      enumerable: true,
      configurable: true
    });
    ExternalEditor2.prototype.run = function() {
      this.launchEditor();
      this.readTemporaryFile();
      return this.text;
    };
    ExternalEditor2.prototype.runAsync = function(callback) {
      var _this = this;
      try {
        this.launchEditorAsync(function() {
          try {
            _this.readTemporaryFile();
            setImmediate(callback, null, _this.text);
          } catch (readError) {
            setImmediate(callback, readError, null);
          }
        });
      } catch (launchError) {
        setImmediate(callback, launchError, null);
      }
    };
    ExternalEditor2.prototype.cleanup = function() {
      this.removeTemporaryFile();
    };
    ExternalEditor2.prototype.determineEditor = function() {
      var editor = process.env.VISUAL ? process.env.VISUAL : process.env.EDITOR ? process.env.EDITOR : /^win/.test(process.platform) ? "notepad" : "vim";
      var editorOpts = ExternalEditor2.splitStringBySpace(editor).map(function(piece) {
        return piece.replace("\\ ", " ");
      });
      var bin = editorOpts.shift();
      this.editor = { args: editorOpts, bin };
    };
    ExternalEditor2.prototype.createTemporaryFile = function() {
      try {
        this.tempFile = tmp_1.tmpNameSync(this.fileOptions);
        var opt = { encoding: "utf8" };
        if (this.fileOptions.hasOwnProperty("mode")) {
          opt.mode = this.fileOptions.mode;
        }
        fs_1.writeFileSync(this.tempFile, this.text, opt);
      } catch (createFileError) {
        throw new CreateFileError_1.CreateFileError(createFileError);
      }
    };
    ExternalEditor2.prototype.readTemporaryFile = function() {
      try {
        var tempFileBuffer = fs_1.readFileSync(this.tempFile);
        if (tempFileBuffer.length === 0) {
          this.text = "";
        } else {
          var encoding = chardet_1.detect(tempFileBuffer).toString();
          if (!iconv_lite_1.encodingExists(encoding)) {
            encoding = "utf8";
          }
          this.text = iconv_lite_1.decode(tempFileBuffer, encoding);
        }
      } catch (readFileError) {
        throw new ReadFileError_1.ReadFileError(readFileError);
      }
    };
    ExternalEditor2.prototype.removeTemporaryFile = function() {
      try {
        fs_1.unlinkSync(this.tempFile);
      } catch (removeFileError) {
        throw new RemoveFileError_1.RemoveFileError(removeFileError);
      }
    };
    ExternalEditor2.prototype.launchEditor = function() {
      try {
        var editorProcess = child_process_1.spawnSync(this.editor.bin, this.editor.args.concat([this.tempFile]), { stdio: "inherit" });
        this.lastExitStatus = editorProcess.status;
      } catch (launchError) {
        throw new LaunchEditorError_1.LaunchEditorError(launchError);
      }
    };
    ExternalEditor2.prototype.launchEditorAsync = function(callback) {
      var _this = this;
      try {
        var editorProcess = child_process_1.spawn(this.editor.bin, this.editor.args.concat([this.tempFile]), { stdio: "inherit" });
        editorProcess.on("exit", function(code) {
          _this.lastExitStatus = code;
          setImmediate(callback);
        });
      } catch (launchError) {
        throw new LaunchEditorError_1.LaunchEditorError(launchError);
      }
    };
    return ExternalEditor2;
  }();
  exports.ExternalEditor = ExternalEditor;
});

// node_modules/rxjs/dist/cjs/internal/util/isFunction.js
var require_isFunction = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isFunction = undefined;
  function isFunction(value) {
    return typeof value === "function";
  }
  exports.isFunction = isFunction;
});

// node_modules/rxjs/dist/cjs/internal/util/createErrorClass.js
var require_createErrorClass = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createErrorClass = undefined;
  function createErrorClass(createImpl) {
    var _super = function(instance) {
      Error.call(instance);
      instance.stack = new Error().stack;
    };
    var ctorFunc = createImpl(_super);
    ctorFunc.prototype = Object.create(Error.prototype);
    ctorFunc.prototype.constructor = ctorFunc;
    return ctorFunc;
  }
  exports.createErrorClass = createErrorClass;
});

// node_modules/rxjs/dist/cjs/internal/util/UnsubscriptionError.js
var require_UnsubscriptionError = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.UnsubscriptionError = undefined;
  var createErrorClass_1 = require_createErrorClass();
  exports.UnsubscriptionError = createErrorClass_1.createErrorClass(function(_super) {
    return function UnsubscriptionErrorImpl(errors2) {
      _super(this);
      this.message = errors2 ? errors2.length + ` errors occurred during unsubscription:
` + errors2.map(function(err, i) {
        return i + 1 + ") " + err.toString();
      }).join(`
  `) : "";
      this.name = "UnsubscriptionError";
      this.errors = errors2;
    };
  });
});

// node_modules/rxjs/dist/cjs/internal/util/arrRemove.js
var require_arrRemove = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.arrRemove = undefined;
  function arrRemove(arr, item) {
    if (arr) {
      var index = arr.indexOf(item);
      0 <= index && arr.splice(index, 1);
    }
  }
  exports.arrRemove = arrRemove;
});

// node_modules/rxjs/dist/cjs/internal/Subscription.js
var require_Subscription = __commonJS((exports) => {
  var __values = exports && exports.__values || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m)
      return m.call(o);
    if (o && typeof o.length === "number")
      return {
        next: function() {
          if (o && i >= o.length)
            o = undefined;
          return { value: o && o[i++], done: !o };
        }
      };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isSubscription = exports.EMPTY_SUBSCRIPTION = exports.Subscription = undefined;
  var isFunction_1 = require_isFunction();
  var UnsubscriptionError_1 = require_UnsubscriptionError();
  var arrRemove_1 = require_arrRemove();
  var Subscription = function() {
    function Subscription2(initialTeardown) {
      this.initialTeardown = initialTeardown;
      this.closed = false;
      this._parentage = null;
      this._finalizers = null;
    }
    Subscription2.prototype.unsubscribe = function() {
      var e_1, _a, e_2, _b;
      var errors2;
      if (!this.closed) {
        this.closed = true;
        var _parentage = this._parentage;
        if (_parentage) {
          this._parentage = null;
          if (Array.isArray(_parentage)) {
            try {
              for (var _parentage_1 = __values(_parentage), _parentage_1_1 = _parentage_1.next();!_parentage_1_1.done; _parentage_1_1 = _parentage_1.next()) {
                var parent_1 = _parentage_1_1.value;
                parent_1.remove(this);
              }
            } catch (e_1_1) {
              e_1 = { error: e_1_1 };
            } finally {
              try {
                if (_parentage_1_1 && !_parentage_1_1.done && (_a = _parentage_1.return))
                  _a.call(_parentage_1);
              } finally {
                if (e_1)
                  throw e_1.error;
              }
            }
          } else {
            _parentage.remove(this);
          }
        }
        var initialFinalizer = this.initialTeardown;
        if (isFunction_1.isFunction(initialFinalizer)) {
          try {
            initialFinalizer();
          } catch (e) {
            errors2 = e instanceof UnsubscriptionError_1.UnsubscriptionError ? e.errors : [e];
          }
        }
        var _finalizers = this._finalizers;
        if (_finalizers) {
          this._finalizers = null;
          try {
            for (var _finalizers_1 = __values(_finalizers), _finalizers_1_1 = _finalizers_1.next();!_finalizers_1_1.done; _finalizers_1_1 = _finalizers_1.next()) {
              var finalizer = _finalizers_1_1.value;
              try {
                execFinalizer(finalizer);
              } catch (err) {
                errors2 = errors2 !== null && errors2 !== undefined ? errors2 : [];
                if (err instanceof UnsubscriptionError_1.UnsubscriptionError) {
                  errors2 = __spreadArray(__spreadArray([], __read(errors2)), __read(err.errors));
                } else {
                  errors2.push(err);
                }
              }
            }
          } catch (e_2_1) {
            e_2 = { error: e_2_1 };
          } finally {
            try {
              if (_finalizers_1_1 && !_finalizers_1_1.done && (_b = _finalizers_1.return))
                _b.call(_finalizers_1);
            } finally {
              if (e_2)
                throw e_2.error;
            }
          }
        }
        if (errors2) {
          throw new UnsubscriptionError_1.UnsubscriptionError(errors2);
        }
      }
    };
    Subscription2.prototype.add = function(teardown) {
      var _a;
      if (teardown && teardown !== this) {
        if (this.closed) {
          execFinalizer(teardown);
        } else {
          if (teardown instanceof Subscription2) {
            if (teardown.closed || teardown._hasParent(this)) {
              return;
            }
            teardown._addParent(this);
          }
          (this._finalizers = (_a = this._finalizers) !== null && _a !== undefined ? _a : []).push(teardown);
        }
      }
    };
    Subscription2.prototype._hasParent = function(parent) {
      var _parentage = this._parentage;
      return _parentage === parent || Array.isArray(_parentage) && _parentage.includes(parent);
    };
    Subscription2.prototype._addParent = function(parent) {
      var _parentage = this._parentage;
      this._parentage = Array.isArray(_parentage) ? (_parentage.push(parent), _parentage) : _parentage ? [_parentage, parent] : parent;
    };
    Subscription2.prototype._removeParent = function(parent) {
      var _parentage = this._parentage;
      if (_parentage === parent) {
        this._parentage = null;
      } else if (Array.isArray(_parentage)) {
        arrRemove_1.arrRemove(_parentage, parent);
      }
    };
    Subscription2.prototype.remove = function(teardown) {
      var _finalizers = this._finalizers;
      _finalizers && arrRemove_1.arrRemove(_finalizers, teardown);
      if (teardown instanceof Subscription2) {
        teardown._removeParent(this);
      }
    };
    Subscription2.EMPTY = function() {
      var empty = new Subscription2;
      empty.closed = true;
      return empty;
    }();
    return Subscription2;
  }();
  exports.Subscription = Subscription;
  exports.EMPTY_SUBSCRIPTION = Subscription.EMPTY;
  function isSubscription(value) {
    return value instanceof Subscription || value && "closed" in value && isFunction_1.isFunction(value.remove) && isFunction_1.isFunction(value.add) && isFunction_1.isFunction(value.unsubscribe);
  }
  exports.isSubscription = isSubscription;
  function execFinalizer(finalizer) {
    if (isFunction_1.isFunction(finalizer)) {
      finalizer();
    } else {
      finalizer.unsubscribe();
    }
  }
});

// node_modules/rxjs/dist/cjs/internal/config.js
var require_config = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.config = undefined;
  exports.config = {
    onUnhandledError: null,
    onStoppedNotification: null,
    Promise: undefined,
    useDeprecatedSynchronousErrorHandling: false,
    useDeprecatedNextContext: false
  };
});

// node_modules/rxjs/dist/cjs/internal/scheduler/timeoutProvider.js
var require_timeoutProvider = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.timeoutProvider = undefined;
  exports.timeoutProvider = {
    setTimeout: function(handler, timeout) {
      var args = [];
      for (var _i = 2;_i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
      }
      var delegate = exports.timeoutProvider.delegate;
      if (delegate === null || delegate === undefined ? undefined : delegate.setTimeout) {
        return delegate.setTimeout.apply(delegate, __spreadArray([handler, timeout], __read(args)));
      }
      return setTimeout.apply(undefined, __spreadArray([handler, timeout], __read(args)));
    },
    clearTimeout: function(handle) {
      var delegate = exports.timeoutProvider.delegate;
      return ((delegate === null || delegate === undefined ? undefined : delegate.clearTimeout) || clearTimeout)(handle);
    },
    delegate: undefined
  };
});

// node_modules/rxjs/dist/cjs/internal/util/reportUnhandledError.js
var require_reportUnhandledError = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.reportUnhandledError = undefined;
  var config_1 = require_config();
  var timeoutProvider_1 = require_timeoutProvider();
  function reportUnhandledError(err) {
    timeoutProvider_1.timeoutProvider.setTimeout(function() {
      var onUnhandledError = config_1.config.onUnhandledError;
      if (onUnhandledError) {
        onUnhandledError(err);
      } else {
        throw err;
      }
    });
  }
  exports.reportUnhandledError = reportUnhandledError;
});

// node_modules/rxjs/dist/cjs/internal/util/noop.js
var require_noop = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.noop = undefined;
  function noop() {
  }
  exports.noop = noop;
});

// node_modules/rxjs/dist/cjs/internal/NotificationFactories.js
var require_NotificationFactories = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createNotification = exports.nextNotification = exports.errorNotification = exports.COMPLETE_NOTIFICATION = undefined;
  exports.COMPLETE_NOTIFICATION = function() {
    return createNotification("C", undefined, undefined);
  }();
  function errorNotification(error) {
    return createNotification("E", undefined, error);
  }
  exports.errorNotification = errorNotification;
  function nextNotification(value) {
    return createNotification("N", value, undefined);
  }
  exports.nextNotification = nextNotification;
  function createNotification(kind, value, error) {
    return {
      kind,
      value,
      error
    };
  }
  exports.createNotification = createNotification;
});

// node_modules/rxjs/dist/cjs/internal/util/errorContext.js
var require_errorContext = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.captureError = exports.errorContext = undefined;
  var config_1 = require_config();
  var context = null;
  function errorContext(cb) {
    if (config_1.config.useDeprecatedSynchronousErrorHandling) {
      var isRoot = !context;
      if (isRoot) {
        context = { errorThrown: false, error: null };
      }
      cb();
      if (isRoot) {
        var _a = context, errorThrown = _a.errorThrown, error = _a.error;
        context = null;
        if (errorThrown) {
          throw error;
        }
      }
    } else {
      cb();
    }
  }
  exports.errorContext = errorContext;
  function captureError(err) {
    if (config_1.config.useDeprecatedSynchronousErrorHandling && context) {
      context.errorThrown = true;
      context.error = err;
    }
  }
  exports.captureError = captureError;
});

// node_modules/rxjs/dist/cjs/internal/Subscriber.js
var require_Subscriber = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EMPTY_OBSERVER = exports.SafeSubscriber = exports.Subscriber = undefined;
  var isFunction_1 = require_isFunction();
  var Subscription_1 = require_Subscription();
  var config_1 = require_config();
  var reportUnhandledError_1 = require_reportUnhandledError();
  var noop_1 = require_noop();
  var NotificationFactories_1 = require_NotificationFactories();
  var timeoutProvider_1 = require_timeoutProvider();
  var errorContext_1 = require_errorContext();
  var Subscriber = function(_super) {
    __extends(Subscriber2, _super);
    function Subscriber2(destination) {
      var _this = _super.call(this) || this;
      _this.isStopped = false;
      if (destination) {
        _this.destination = destination;
        if (Subscription_1.isSubscription(destination)) {
          destination.add(_this);
        }
      } else {
        _this.destination = exports.EMPTY_OBSERVER;
      }
      return _this;
    }
    Subscriber2.create = function(next, error, complete) {
      return new SafeSubscriber(next, error, complete);
    };
    Subscriber2.prototype.next = function(value) {
      if (this.isStopped) {
        handleStoppedNotification(NotificationFactories_1.nextNotification(value), this);
      } else {
        this._next(value);
      }
    };
    Subscriber2.prototype.error = function(err) {
      if (this.isStopped) {
        handleStoppedNotification(NotificationFactories_1.errorNotification(err), this);
      } else {
        this.isStopped = true;
        this._error(err);
      }
    };
    Subscriber2.prototype.complete = function() {
      if (this.isStopped) {
        handleStoppedNotification(NotificationFactories_1.COMPLETE_NOTIFICATION, this);
      } else {
        this.isStopped = true;
        this._complete();
      }
    };
    Subscriber2.prototype.unsubscribe = function() {
      if (!this.closed) {
        this.isStopped = true;
        _super.prototype.unsubscribe.call(this);
        this.destination = null;
      }
    };
    Subscriber2.prototype._next = function(value) {
      this.destination.next(value);
    };
    Subscriber2.prototype._error = function(err) {
      try {
        this.destination.error(err);
      } finally {
        this.unsubscribe();
      }
    };
    Subscriber2.prototype._complete = function() {
      try {
        this.destination.complete();
      } finally {
        this.unsubscribe();
      }
    };
    return Subscriber2;
  }(Subscription_1.Subscription);
  exports.Subscriber = Subscriber;
  var _bind = Function.prototype.bind;
  function bind(fn, thisArg) {
    return _bind.call(fn, thisArg);
  }
  var ConsumerObserver = function() {
    function ConsumerObserver2(partialObserver) {
      this.partialObserver = partialObserver;
    }
    ConsumerObserver2.prototype.next = function(value) {
      var partialObserver = this.partialObserver;
      if (partialObserver.next) {
        try {
          partialObserver.next(value);
        } catch (error) {
          handleUnhandledError(error);
        }
      }
    };
    ConsumerObserver2.prototype.error = function(err) {
      var partialObserver = this.partialObserver;
      if (partialObserver.error) {
        try {
          partialObserver.error(err);
        } catch (error) {
          handleUnhandledError(error);
        }
      } else {
        handleUnhandledError(err);
      }
    };
    ConsumerObserver2.prototype.complete = function() {
      var partialObserver = this.partialObserver;
      if (partialObserver.complete) {
        try {
          partialObserver.complete();
        } catch (error) {
          handleUnhandledError(error);
        }
      }
    };
    return ConsumerObserver2;
  }();
  var SafeSubscriber = function(_super) {
    __extends(SafeSubscriber2, _super);
    function SafeSubscriber2(observerOrNext, error, complete) {
      var _this = _super.call(this) || this;
      var partialObserver;
      if (isFunction_1.isFunction(observerOrNext) || !observerOrNext) {
        partialObserver = {
          next: observerOrNext !== null && observerOrNext !== undefined ? observerOrNext : undefined,
          error: error !== null && error !== undefined ? error : undefined,
          complete: complete !== null && complete !== undefined ? complete : undefined
        };
      } else {
        var context_1;
        if (_this && config_1.config.useDeprecatedNextContext) {
          context_1 = Object.create(observerOrNext);
          context_1.unsubscribe = function() {
            return _this.unsubscribe();
          };
          partialObserver = {
            next: observerOrNext.next && bind(observerOrNext.next, context_1),
            error: observerOrNext.error && bind(observerOrNext.error, context_1),
            complete: observerOrNext.complete && bind(observerOrNext.complete, context_1)
          };
        } else {
          partialObserver = observerOrNext;
        }
      }
      _this.destination = new ConsumerObserver(partialObserver);
      return _this;
    }
    return SafeSubscriber2;
  }(Subscriber);
  exports.SafeSubscriber = SafeSubscriber;
  function handleUnhandledError(error) {
    if (config_1.config.useDeprecatedSynchronousErrorHandling) {
      errorContext_1.captureError(error);
    } else {
      reportUnhandledError_1.reportUnhandledError(error);
    }
  }
  function defaultErrorHandler(err) {
    throw err;
  }
  function handleStoppedNotification(notification, subscriber) {
    var onStoppedNotification = config_1.config.onStoppedNotification;
    onStoppedNotification && timeoutProvider_1.timeoutProvider.setTimeout(function() {
      return onStoppedNotification(notification, subscriber);
    });
  }
  exports.EMPTY_OBSERVER = {
    closed: true,
    next: noop_1.noop,
    error: defaultErrorHandler,
    complete: noop_1.noop
  };
});

// node_modules/rxjs/dist/cjs/internal/symbol/observable.js
var require_observable = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.observable = undefined;
  exports.observable = function() {
    return typeof Symbol === "function" && Symbol.observable || "@@observable";
  }();
});

// node_modules/rxjs/dist/cjs/internal/util/identity.js
var require_identity = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.identity = undefined;
  function identity(x) {
    return x;
  }
  exports.identity = identity;
});

// node_modules/rxjs/dist/cjs/internal/util/pipe.js
var require_pipe = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.pipeFromArray = exports.pipe = undefined;
  var identity_1 = require_identity();
  function pipe() {
    var fns = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      fns[_i] = arguments[_i];
    }
    return pipeFromArray(fns);
  }
  exports.pipe = pipe;
  function pipeFromArray(fns) {
    if (fns.length === 0) {
      return identity_1.identity;
    }
    if (fns.length === 1) {
      return fns[0];
    }
    return function piped(input) {
      return fns.reduce(function(prev, fn) {
        return fn(prev);
      }, input);
    };
  }
  exports.pipeFromArray = pipeFromArray;
});

// node_modules/rxjs/dist/cjs/internal/Observable.js
var require_Observable = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Observable = undefined;
  var Subscriber_1 = require_Subscriber();
  var Subscription_1 = require_Subscription();
  var observable_1 = require_observable();
  var pipe_1 = require_pipe();
  var config_1 = require_config();
  var isFunction_1 = require_isFunction();
  var errorContext_1 = require_errorContext();
  var Observable = function() {
    function Observable2(subscribe) {
      if (subscribe) {
        this._subscribe = subscribe;
      }
    }
    Observable2.prototype.lift = function(operator) {
      var observable = new Observable2;
      observable.source = this;
      observable.operator = operator;
      return observable;
    };
    Observable2.prototype.subscribe = function(observerOrNext, error, complete) {
      var _this = this;
      var subscriber = isSubscriber(observerOrNext) ? observerOrNext : new Subscriber_1.SafeSubscriber(observerOrNext, error, complete);
      errorContext_1.errorContext(function() {
        var _a = _this, operator = _a.operator, source = _a.source;
        subscriber.add(operator ? operator.call(subscriber, source) : source ? _this._subscribe(subscriber) : _this._trySubscribe(subscriber));
      });
      return subscriber;
    };
    Observable2.prototype._trySubscribe = function(sink) {
      try {
        return this._subscribe(sink);
      } catch (err) {
        sink.error(err);
      }
    };
    Observable2.prototype.forEach = function(next, promiseCtor) {
      var _this = this;
      promiseCtor = getPromiseCtor(promiseCtor);
      return new promiseCtor(function(resolve, reject) {
        var subscriber = new Subscriber_1.SafeSubscriber({
          next: function(value) {
            try {
              next(value);
            } catch (err) {
              reject(err);
              subscriber.unsubscribe();
            }
          },
          error: reject,
          complete: resolve
        });
        _this.subscribe(subscriber);
      });
    };
    Observable2.prototype._subscribe = function(subscriber) {
      var _a;
      return (_a = this.source) === null || _a === undefined ? undefined : _a.subscribe(subscriber);
    };
    Observable2.prototype[observable_1.observable] = function() {
      return this;
    };
    Observable2.prototype.pipe = function() {
      var operations = [];
      for (var _i = 0;_i < arguments.length; _i++) {
        operations[_i] = arguments[_i];
      }
      return pipe_1.pipeFromArray(operations)(this);
    };
    Observable2.prototype.toPromise = function(promiseCtor) {
      var _this = this;
      promiseCtor = getPromiseCtor(promiseCtor);
      return new promiseCtor(function(resolve, reject) {
        var value;
        _this.subscribe(function(x) {
          return value = x;
        }, function(err) {
          return reject(err);
        }, function() {
          return resolve(value);
        });
      });
    };
    Observable2.create = function(subscribe) {
      return new Observable2(subscribe);
    };
    return Observable2;
  }();
  exports.Observable = Observable;
  function getPromiseCtor(promiseCtor) {
    var _a;
    return (_a = promiseCtor !== null && promiseCtor !== undefined ? promiseCtor : config_1.config.Promise) !== null && _a !== undefined ? _a : Promise;
  }
  function isObserver(value) {
    return value && isFunction_1.isFunction(value.next) && isFunction_1.isFunction(value.error) && isFunction_1.isFunction(value.complete);
  }
  function isSubscriber(value) {
    return value && value instanceof Subscriber_1.Subscriber || isObserver(value) && Subscription_1.isSubscription(value);
  }
});

// node_modules/rxjs/dist/cjs/internal/util/lift.js
var require_lift = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.operate = exports.hasLift = undefined;
  var isFunction_1 = require_isFunction();
  function hasLift(source) {
    return isFunction_1.isFunction(source === null || source === undefined ? undefined : source.lift);
  }
  exports.hasLift = hasLift;
  function operate(init) {
    return function(source) {
      if (hasLift(source)) {
        return source.lift(function(liftedSource) {
          try {
            return init(liftedSource, this);
          } catch (err) {
            this.error(err);
          }
        });
      }
      throw new TypeError("Unable to lift unknown Observable type");
    };
  }
  exports.operate = operate;
});

// node_modules/rxjs/dist/cjs/internal/operators/OperatorSubscriber.js
var require_OperatorSubscriber = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.OperatorSubscriber = exports.createOperatorSubscriber = undefined;
  var Subscriber_1 = require_Subscriber();
  function createOperatorSubscriber(destination, onNext, onComplete, onError, onFinalize) {
    return new OperatorSubscriber(destination, onNext, onComplete, onError, onFinalize);
  }
  exports.createOperatorSubscriber = createOperatorSubscriber;
  var OperatorSubscriber = function(_super) {
    __extends(OperatorSubscriber2, _super);
    function OperatorSubscriber2(destination, onNext, onComplete, onError, onFinalize, shouldUnsubscribe) {
      var _this = _super.call(this, destination) || this;
      _this.onFinalize = onFinalize;
      _this.shouldUnsubscribe = shouldUnsubscribe;
      _this._next = onNext ? function(value) {
        try {
          onNext(value);
        } catch (err) {
          destination.error(err);
        }
      } : _super.prototype._next;
      _this._error = onError ? function(err) {
        try {
          onError(err);
        } catch (err2) {
          destination.error(err2);
        } finally {
          this.unsubscribe();
        }
      } : _super.prototype._error;
      _this._complete = onComplete ? function() {
        try {
          onComplete();
        } catch (err) {
          destination.error(err);
        } finally {
          this.unsubscribe();
        }
      } : _super.prototype._complete;
      return _this;
    }
    OperatorSubscriber2.prototype.unsubscribe = function() {
      var _a;
      if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
        var closed_1 = this.closed;
        _super.prototype.unsubscribe.call(this);
        !closed_1 && ((_a = this.onFinalize) === null || _a === undefined || _a.call(this));
      }
    };
    return OperatorSubscriber2;
  }(Subscriber_1.Subscriber);
  exports.OperatorSubscriber = OperatorSubscriber;
});

// node_modules/rxjs/dist/cjs/internal/operators/refCount.js
var require_refCount = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.refCount = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function refCount() {
    return lift_1.operate(function(source, subscriber) {
      var connection = null;
      source._refCount++;
      var refCounter = OperatorSubscriber_1.createOperatorSubscriber(subscriber, undefined, undefined, undefined, function() {
        if (!source || source._refCount <= 0 || 0 < --source._refCount) {
          connection = null;
          return;
        }
        var sharedConnection = source._connection;
        var conn = connection;
        connection = null;
        if (sharedConnection && (!conn || sharedConnection === conn)) {
          sharedConnection.unsubscribe();
        }
        subscriber.unsubscribe();
      });
      source.subscribe(refCounter);
      if (!refCounter.closed) {
        connection = source.connect();
      }
    });
  }
  exports.refCount = refCount;
});

// node_modules/rxjs/dist/cjs/internal/observable/ConnectableObservable.js
var require_ConnectableObservable = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ConnectableObservable = undefined;
  var Observable_1 = require_Observable();
  var Subscription_1 = require_Subscription();
  var refCount_1 = require_refCount();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var lift_1 = require_lift();
  var ConnectableObservable = function(_super) {
    __extends(ConnectableObservable2, _super);
    function ConnectableObservable2(source, subjectFactory) {
      var _this = _super.call(this) || this;
      _this.source = source;
      _this.subjectFactory = subjectFactory;
      _this._subject = null;
      _this._refCount = 0;
      _this._connection = null;
      if (lift_1.hasLift(source)) {
        _this.lift = source.lift;
      }
      return _this;
    }
    ConnectableObservable2.prototype._subscribe = function(subscriber) {
      return this.getSubject().subscribe(subscriber);
    };
    ConnectableObservable2.prototype.getSubject = function() {
      var subject = this._subject;
      if (!subject || subject.isStopped) {
        this._subject = this.subjectFactory();
      }
      return this._subject;
    };
    ConnectableObservable2.prototype._teardown = function() {
      this._refCount = 0;
      var _connection = this._connection;
      this._subject = this._connection = null;
      _connection === null || _connection === undefined || _connection.unsubscribe();
    };
    ConnectableObservable2.prototype.connect = function() {
      var _this = this;
      var connection = this._connection;
      if (!connection) {
        connection = this._connection = new Subscription_1.Subscription;
        var subject_1 = this.getSubject();
        connection.add(this.source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subject_1, undefined, function() {
          _this._teardown();
          subject_1.complete();
        }, function(err) {
          _this._teardown();
          subject_1.error(err);
        }, function() {
          return _this._teardown();
        })));
        if (connection.closed) {
          this._connection = null;
          connection = Subscription_1.Subscription.EMPTY;
        }
      }
      return connection;
    };
    ConnectableObservable2.prototype.refCount = function() {
      return refCount_1.refCount()(this);
    };
    return ConnectableObservable2;
  }(Observable_1.Observable);
  exports.ConnectableObservable = ConnectableObservable;
});

// node_modules/rxjs/dist/cjs/internal/scheduler/performanceTimestampProvider.js
var require_performanceTimestampProvider = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.performanceTimestampProvider = undefined;
  exports.performanceTimestampProvider = {
    now: function() {
      return (exports.performanceTimestampProvider.delegate || performance).now();
    },
    delegate: undefined
  };
});

// node_modules/rxjs/dist/cjs/internal/scheduler/animationFrameProvider.js
var require_animationFrameProvider = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.animationFrameProvider = undefined;
  var Subscription_1 = require_Subscription();
  exports.animationFrameProvider = {
    schedule: function(callback) {
      var request = requestAnimationFrame;
      var cancel = cancelAnimationFrame;
      var delegate = exports.animationFrameProvider.delegate;
      if (delegate) {
        request = delegate.requestAnimationFrame;
        cancel = delegate.cancelAnimationFrame;
      }
      var handle = request(function(timestamp) {
        cancel = undefined;
        callback(timestamp);
      });
      return new Subscription_1.Subscription(function() {
        return cancel === null || cancel === undefined ? undefined : cancel(handle);
      });
    },
    requestAnimationFrame: function() {
      var args = [];
      for (var _i = 0;_i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var delegate = exports.animationFrameProvider.delegate;
      return ((delegate === null || delegate === undefined ? undefined : delegate.requestAnimationFrame) || requestAnimationFrame).apply(undefined, __spreadArray([], __read(args)));
    },
    cancelAnimationFrame: function() {
      var args = [];
      for (var _i = 0;_i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var delegate = exports.animationFrameProvider.delegate;
      return ((delegate === null || delegate === undefined ? undefined : delegate.cancelAnimationFrame) || cancelAnimationFrame).apply(undefined, __spreadArray([], __read(args)));
    },
    delegate: undefined
  };
});

// node_modules/rxjs/dist/cjs/internal/observable/dom/animationFrames.js
var require_animationFrames = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.animationFrames = undefined;
  var Observable_1 = require_Observable();
  var performanceTimestampProvider_1 = require_performanceTimestampProvider();
  var animationFrameProvider_1 = require_animationFrameProvider();
  function animationFrames(timestampProvider) {
    return timestampProvider ? animationFramesFactory(timestampProvider) : DEFAULT_ANIMATION_FRAMES;
  }
  exports.animationFrames = animationFrames;
  function animationFramesFactory(timestampProvider) {
    return new Observable_1.Observable(function(subscriber) {
      var provider = timestampProvider || performanceTimestampProvider_1.performanceTimestampProvider;
      var start = provider.now();
      var id = 0;
      var run = function() {
        if (!subscriber.closed) {
          id = animationFrameProvider_1.animationFrameProvider.requestAnimationFrame(function(timestamp) {
            id = 0;
            var now = provider.now();
            subscriber.next({
              timestamp: timestampProvider ? now : timestamp,
              elapsed: now - start
            });
            run();
          });
        }
      };
      run();
      return function() {
        if (id) {
          animationFrameProvider_1.animationFrameProvider.cancelAnimationFrame(id);
        }
      };
    });
  }
  var DEFAULT_ANIMATION_FRAMES = animationFramesFactory();
});

// node_modules/rxjs/dist/cjs/internal/util/ObjectUnsubscribedError.js
var require_ObjectUnsubscribedError = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ObjectUnsubscribedError = undefined;
  var createErrorClass_1 = require_createErrorClass();
  exports.ObjectUnsubscribedError = createErrorClass_1.createErrorClass(function(_super) {
    return function ObjectUnsubscribedErrorImpl() {
      _super(this);
      this.name = "ObjectUnsubscribedError";
      this.message = "object unsubscribed";
    };
  });
});

// node_modules/rxjs/dist/cjs/internal/Subject.js
var require_Subject = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  var __values = exports && exports.__values || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m)
      return m.call(o);
    if (o && typeof o.length === "number")
      return {
        next: function() {
          if (o && i >= o.length)
            o = undefined;
          return { value: o && o[i++], done: !o };
        }
      };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AnonymousSubject = exports.Subject = undefined;
  var Observable_1 = require_Observable();
  var Subscription_1 = require_Subscription();
  var ObjectUnsubscribedError_1 = require_ObjectUnsubscribedError();
  var arrRemove_1 = require_arrRemove();
  var errorContext_1 = require_errorContext();
  var Subject = function(_super) {
    __extends(Subject2, _super);
    function Subject2() {
      var _this = _super.call(this) || this;
      _this.closed = false;
      _this.currentObservers = null;
      _this.observers = [];
      _this.isStopped = false;
      _this.hasError = false;
      _this.thrownError = null;
      return _this;
    }
    Subject2.prototype.lift = function(operator) {
      var subject = new AnonymousSubject(this, this);
      subject.operator = operator;
      return subject;
    };
    Subject2.prototype._throwIfClosed = function() {
      if (this.closed) {
        throw new ObjectUnsubscribedError_1.ObjectUnsubscribedError;
      }
    };
    Subject2.prototype.next = function(value) {
      var _this = this;
      errorContext_1.errorContext(function() {
        var e_1, _a;
        _this._throwIfClosed();
        if (!_this.isStopped) {
          if (!_this.currentObservers) {
            _this.currentObservers = Array.from(_this.observers);
          }
          try {
            for (var _b = __values(_this.currentObservers), _c = _b.next();!_c.done; _c = _b.next()) {
              var observer = _c.value;
              observer.next(value);
            }
          } catch (e_1_1) {
            e_1 = { error: e_1_1 };
          } finally {
            try {
              if (_c && !_c.done && (_a = _b.return))
                _a.call(_b);
            } finally {
              if (e_1)
                throw e_1.error;
            }
          }
        }
      });
    };
    Subject2.prototype.error = function(err) {
      var _this = this;
      errorContext_1.errorContext(function() {
        _this._throwIfClosed();
        if (!_this.isStopped) {
          _this.hasError = _this.isStopped = true;
          _this.thrownError = err;
          var observers = _this.observers;
          while (observers.length) {
            observers.shift().error(err);
          }
        }
      });
    };
    Subject2.prototype.complete = function() {
      var _this = this;
      errorContext_1.errorContext(function() {
        _this._throwIfClosed();
        if (!_this.isStopped) {
          _this.isStopped = true;
          var observers = _this.observers;
          while (observers.length) {
            observers.shift().complete();
          }
        }
      });
    };
    Subject2.prototype.unsubscribe = function() {
      this.isStopped = this.closed = true;
      this.observers = this.currentObservers = null;
    };
    Object.defineProperty(Subject2.prototype, "observed", {
      get: function() {
        var _a;
        return ((_a = this.observers) === null || _a === undefined ? undefined : _a.length) > 0;
      },
      enumerable: false,
      configurable: true
    });
    Subject2.prototype._trySubscribe = function(subscriber) {
      this._throwIfClosed();
      return _super.prototype._trySubscribe.call(this, subscriber);
    };
    Subject2.prototype._subscribe = function(subscriber) {
      this._throwIfClosed();
      this._checkFinalizedStatuses(subscriber);
      return this._innerSubscribe(subscriber);
    };
    Subject2.prototype._innerSubscribe = function(subscriber) {
      var _this = this;
      var _a = this, hasError = _a.hasError, isStopped = _a.isStopped, observers = _a.observers;
      if (hasError || isStopped) {
        return Subscription_1.EMPTY_SUBSCRIPTION;
      }
      this.currentObservers = null;
      observers.push(subscriber);
      return new Subscription_1.Subscription(function() {
        _this.currentObservers = null;
        arrRemove_1.arrRemove(observers, subscriber);
      });
    };
    Subject2.prototype._checkFinalizedStatuses = function(subscriber) {
      var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, isStopped = _a.isStopped;
      if (hasError) {
        subscriber.error(thrownError);
      } else if (isStopped) {
        subscriber.complete();
      }
    };
    Subject2.prototype.asObservable = function() {
      var observable = new Observable_1.Observable;
      observable.source = this;
      return observable;
    };
    Subject2.create = function(destination, source) {
      return new AnonymousSubject(destination, source);
    };
    return Subject2;
  }(Observable_1.Observable);
  exports.Subject = Subject;
  var AnonymousSubject = function(_super) {
    __extends(AnonymousSubject2, _super);
    function AnonymousSubject2(destination, source) {
      var _this = _super.call(this) || this;
      _this.destination = destination;
      _this.source = source;
      return _this;
    }
    AnonymousSubject2.prototype.next = function(value) {
      var _a, _b;
      (_b = (_a = this.destination) === null || _a === undefined ? undefined : _a.next) === null || _b === undefined || _b.call(_a, value);
    };
    AnonymousSubject2.prototype.error = function(err) {
      var _a, _b;
      (_b = (_a = this.destination) === null || _a === undefined ? undefined : _a.error) === null || _b === undefined || _b.call(_a, err);
    };
    AnonymousSubject2.prototype.complete = function() {
      var _a, _b;
      (_b = (_a = this.destination) === null || _a === undefined ? undefined : _a.complete) === null || _b === undefined || _b.call(_a);
    };
    AnonymousSubject2.prototype._subscribe = function(subscriber) {
      var _a, _b;
      return (_b = (_a = this.source) === null || _a === undefined ? undefined : _a.subscribe(subscriber)) !== null && _b !== undefined ? _b : Subscription_1.EMPTY_SUBSCRIPTION;
    };
    return AnonymousSubject2;
  }(Subject);
  exports.AnonymousSubject = AnonymousSubject;
});

// node_modules/rxjs/dist/cjs/internal/BehaviorSubject.js
var require_BehaviorSubject = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.BehaviorSubject = undefined;
  var Subject_1 = require_Subject();
  var BehaviorSubject = function(_super) {
    __extends(BehaviorSubject2, _super);
    function BehaviorSubject2(_value) {
      var _this = _super.call(this) || this;
      _this._value = _value;
      return _this;
    }
    Object.defineProperty(BehaviorSubject2.prototype, "value", {
      get: function() {
        return this.getValue();
      },
      enumerable: false,
      configurable: true
    });
    BehaviorSubject2.prototype._subscribe = function(subscriber) {
      var subscription = _super.prototype._subscribe.call(this, subscriber);
      !subscription.closed && subscriber.next(this._value);
      return subscription;
    };
    BehaviorSubject2.prototype.getValue = function() {
      var _a = this, hasError = _a.hasError, thrownError = _a.thrownError, _value = _a._value;
      if (hasError) {
        throw thrownError;
      }
      this._throwIfClosed();
      return _value;
    };
    BehaviorSubject2.prototype.next = function(value) {
      _super.prototype.next.call(this, this._value = value);
    };
    return BehaviorSubject2;
  }(Subject_1.Subject);
  exports.BehaviorSubject = BehaviorSubject;
});

// node_modules/rxjs/dist/cjs/internal/scheduler/dateTimestampProvider.js
var require_dateTimestampProvider = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.dateTimestampProvider = undefined;
  exports.dateTimestampProvider = {
    now: function() {
      return (exports.dateTimestampProvider.delegate || Date).now();
    },
    delegate: undefined
  };
});

// node_modules/rxjs/dist/cjs/internal/ReplaySubject.js
var require_ReplaySubject = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ReplaySubject = undefined;
  var Subject_1 = require_Subject();
  var dateTimestampProvider_1 = require_dateTimestampProvider();
  var ReplaySubject = function(_super) {
    __extends(ReplaySubject2, _super);
    function ReplaySubject2(_bufferSize, _windowTime, _timestampProvider) {
      if (_bufferSize === undefined) {
        _bufferSize = Infinity;
      }
      if (_windowTime === undefined) {
        _windowTime = Infinity;
      }
      if (_timestampProvider === undefined) {
        _timestampProvider = dateTimestampProvider_1.dateTimestampProvider;
      }
      var _this = _super.call(this) || this;
      _this._bufferSize = _bufferSize;
      _this._windowTime = _windowTime;
      _this._timestampProvider = _timestampProvider;
      _this._buffer = [];
      _this._infiniteTimeWindow = true;
      _this._infiniteTimeWindow = _windowTime === Infinity;
      _this._bufferSize = Math.max(1, _bufferSize);
      _this._windowTime = Math.max(1, _windowTime);
      return _this;
    }
    ReplaySubject2.prototype.next = function(value) {
      var _a = this, isStopped = _a.isStopped, _buffer = _a._buffer, _infiniteTimeWindow = _a._infiniteTimeWindow, _timestampProvider = _a._timestampProvider, _windowTime = _a._windowTime;
      if (!isStopped) {
        _buffer.push(value);
        !_infiniteTimeWindow && _buffer.push(_timestampProvider.now() + _windowTime);
      }
      this._trimBuffer();
      _super.prototype.next.call(this, value);
    };
    ReplaySubject2.prototype._subscribe = function(subscriber) {
      this._throwIfClosed();
      this._trimBuffer();
      var subscription = this._innerSubscribe(subscriber);
      var _a = this, _infiniteTimeWindow = _a._infiniteTimeWindow, _buffer = _a._buffer;
      var copy = _buffer.slice();
      for (var i = 0;i < copy.length && !subscriber.closed; i += _infiniteTimeWindow ? 1 : 2) {
        subscriber.next(copy[i]);
      }
      this._checkFinalizedStatuses(subscriber);
      return subscription;
    };
    ReplaySubject2.prototype._trimBuffer = function() {
      var _a = this, _bufferSize = _a._bufferSize, _timestampProvider = _a._timestampProvider, _buffer = _a._buffer, _infiniteTimeWindow = _a._infiniteTimeWindow;
      var adjustedBufferSize = (_infiniteTimeWindow ? 1 : 2) * _bufferSize;
      _bufferSize < Infinity && adjustedBufferSize < _buffer.length && _buffer.splice(0, _buffer.length - adjustedBufferSize);
      if (!_infiniteTimeWindow) {
        var now = _timestampProvider.now();
        var last = 0;
        for (var i = 1;i < _buffer.length && _buffer[i] <= now; i += 2) {
          last = i;
        }
        last && _buffer.splice(0, last + 1);
      }
    };
    return ReplaySubject2;
  }(Subject_1.Subject);
  exports.ReplaySubject = ReplaySubject;
});

// node_modules/rxjs/dist/cjs/internal/AsyncSubject.js
var require_AsyncSubject = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AsyncSubject = undefined;
  var Subject_1 = require_Subject();
  var AsyncSubject = function(_super) {
    __extends(AsyncSubject2, _super);
    function AsyncSubject2() {
      var _this = _super !== null && _super.apply(this, arguments) || this;
      _this._value = null;
      _this._hasValue = false;
      _this._isComplete = false;
      return _this;
    }
    AsyncSubject2.prototype._checkFinalizedStatuses = function(subscriber) {
      var _a = this, hasError = _a.hasError, _hasValue = _a._hasValue, _value = _a._value, thrownError = _a.thrownError, isStopped = _a.isStopped, _isComplete = _a._isComplete;
      if (hasError) {
        subscriber.error(thrownError);
      } else if (isStopped || _isComplete) {
        _hasValue && subscriber.next(_value);
        subscriber.complete();
      }
    };
    AsyncSubject2.prototype.next = function(value) {
      if (!this.isStopped) {
        this._value = value;
        this._hasValue = true;
      }
    };
    AsyncSubject2.prototype.complete = function() {
      var _a = this, _hasValue = _a._hasValue, _value = _a._value, _isComplete = _a._isComplete;
      if (!_isComplete) {
        this._isComplete = true;
        _hasValue && _super.prototype.next.call(this, _value);
        _super.prototype.complete.call(this);
      }
    };
    return AsyncSubject2;
  }(Subject_1.Subject);
  exports.AsyncSubject = AsyncSubject;
});

// node_modules/rxjs/dist/cjs/internal/scheduler/Action.js
var require_Action = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Action = undefined;
  var Subscription_1 = require_Subscription();
  var Action = function(_super) {
    __extends(Action2, _super);
    function Action2(scheduler, work) {
      return _super.call(this) || this;
    }
    Action2.prototype.schedule = function(state, delay) {
      if (delay === undefined) {
        delay = 0;
      }
      return this;
    };
    return Action2;
  }(Subscription_1.Subscription);
  exports.Action = Action;
});

// node_modules/rxjs/dist/cjs/internal/scheduler/intervalProvider.js
var require_intervalProvider = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.intervalProvider = undefined;
  exports.intervalProvider = {
    setInterval: function(handler, timeout) {
      var args = [];
      for (var _i = 2;_i < arguments.length; _i++) {
        args[_i - 2] = arguments[_i];
      }
      var delegate = exports.intervalProvider.delegate;
      if (delegate === null || delegate === undefined ? undefined : delegate.setInterval) {
        return delegate.setInterval.apply(delegate, __spreadArray([handler, timeout], __read(args)));
      }
      return setInterval.apply(undefined, __spreadArray([handler, timeout], __read(args)));
    },
    clearInterval: function(handle) {
      var delegate = exports.intervalProvider.delegate;
      return ((delegate === null || delegate === undefined ? undefined : delegate.clearInterval) || clearInterval)(handle);
    },
    delegate: undefined
  };
});

// node_modules/rxjs/dist/cjs/internal/scheduler/AsyncAction.js
var require_AsyncAction = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AsyncAction = undefined;
  var Action_1 = require_Action();
  var intervalProvider_1 = require_intervalProvider();
  var arrRemove_1 = require_arrRemove();
  var AsyncAction = function(_super) {
    __extends(AsyncAction2, _super);
    function AsyncAction2(scheduler, work) {
      var _this = _super.call(this, scheduler, work) || this;
      _this.scheduler = scheduler;
      _this.work = work;
      _this.pending = false;
      return _this;
    }
    AsyncAction2.prototype.schedule = function(state, delay) {
      var _a;
      if (delay === undefined) {
        delay = 0;
      }
      if (this.closed) {
        return this;
      }
      this.state = state;
      var id = this.id;
      var scheduler = this.scheduler;
      if (id != null) {
        this.id = this.recycleAsyncId(scheduler, id, delay);
      }
      this.pending = true;
      this.delay = delay;
      this.id = (_a = this.id) !== null && _a !== undefined ? _a : this.requestAsyncId(scheduler, this.id, delay);
      return this;
    };
    AsyncAction2.prototype.requestAsyncId = function(scheduler, _id, delay) {
      if (delay === undefined) {
        delay = 0;
      }
      return intervalProvider_1.intervalProvider.setInterval(scheduler.flush.bind(scheduler, this), delay);
    };
    AsyncAction2.prototype.recycleAsyncId = function(_scheduler, id, delay) {
      if (delay === undefined) {
        delay = 0;
      }
      if (delay != null && this.delay === delay && this.pending === false) {
        return id;
      }
      if (id != null) {
        intervalProvider_1.intervalProvider.clearInterval(id);
      }
      return;
    };
    AsyncAction2.prototype.execute = function(state, delay) {
      if (this.closed) {
        return new Error("executing a cancelled action");
      }
      this.pending = false;
      var error = this._execute(state, delay);
      if (error) {
        return error;
      } else if (this.pending === false && this.id != null) {
        this.id = this.recycleAsyncId(this.scheduler, this.id, null);
      }
    };
    AsyncAction2.prototype._execute = function(state, _delay) {
      var errored = false;
      var errorValue;
      try {
        this.work(state);
      } catch (e) {
        errored = true;
        errorValue = e ? e : new Error("Scheduled action threw falsy error");
      }
      if (errored) {
        this.unsubscribe();
        return errorValue;
      }
    };
    AsyncAction2.prototype.unsubscribe = function() {
      if (!this.closed) {
        var _a = this, id = _a.id, scheduler = _a.scheduler;
        var actions = scheduler.actions;
        this.work = this.state = this.scheduler = null;
        this.pending = false;
        arrRemove_1.arrRemove(actions, this);
        if (id != null) {
          this.id = this.recycleAsyncId(scheduler, id, null);
        }
        this.delay = null;
        _super.prototype.unsubscribe.call(this);
      }
    };
    return AsyncAction2;
  }(Action_1.Action);
  exports.AsyncAction = AsyncAction;
});

// node_modules/rxjs/dist/cjs/internal/util/Immediate.js
var require_Immediate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TestTools = exports.Immediate = undefined;
  var nextHandle = 1;
  var resolved;
  var activeHandles = {};
  function findAndClearHandle(handle) {
    if (handle in activeHandles) {
      delete activeHandles[handle];
      return true;
    }
    return false;
  }
  exports.Immediate = {
    setImmediate: function(cb) {
      var handle = nextHandle++;
      activeHandles[handle] = true;
      if (!resolved) {
        resolved = Promise.resolve();
      }
      resolved.then(function() {
        return findAndClearHandle(handle) && cb();
      });
      return handle;
    },
    clearImmediate: function(handle) {
      findAndClearHandle(handle);
    }
  };
  exports.TestTools = {
    pending: function() {
      return Object.keys(activeHandles).length;
    }
  };
});

// node_modules/rxjs/dist/cjs/internal/scheduler/immediateProvider.js
var require_immediateProvider = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.immediateProvider = undefined;
  var Immediate_1 = require_Immediate();
  var setImmediate2 = Immediate_1.Immediate.setImmediate;
  var clearImmediate = Immediate_1.Immediate.clearImmediate;
  exports.immediateProvider = {
    setImmediate: function() {
      var args = [];
      for (var _i = 0;_i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var delegate = exports.immediateProvider.delegate;
      return ((delegate === null || delegate === undefined ? undefined : delegate.setImmediate) || setImmediate2).apply(undefined, __spreadArray([], __read(args)));
    },
    clearImmediate: function(handle) {
      var delegate = exports.immediateProvider.delegate;
      return ((delegate === null || delegate === undefined ? undefined : delegate.clearImmediate) || clearImmediate)(handle);
    },
    delegate: undefined
  };
});

// node_modules/rxjs/dist/cjs/internal/scheduler/AsapAction.js
var require_AsapAction = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AsapAction = undefined;
  var AsyncAction_1 = require_AsyncAction();
  var immediateProvider_1 = require_immediateProvider();
  var AsapAction = function(_super) {
    __extends(AsapAction2, _super);
    function AsapAction2(scheduler, work) {
      var _this = _super.call(this, scheduler, work) || this;
      _this.scheduler = scheduler;
      _this.work = work;
      return _this;
    }
    AsapAction2.prototype.requestAsyncId = function(scheduler, id, delay) {
      if (delay === undefined) {
        delay = 0;
      }
      if (delay !== null && delay > 0) {
        return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
      }
      scheduler.actions.push(this);
      return scheduler._scheduled || (scheduler._scheduled = immediateProvider_1.immediateProvider.setImmediate(scheduler.flush.bind(scheduler, undefined)));
    };
    AsapAction2.prototype.recycleAsyncId = function(scheduler, id, delay) {
      var _a;
      if (delay === undefined) {
        delay = 0;
      }
      if (delay != null ? delay > 0 : this.delay > 0) {
        return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
      }
      var actions = scheduler.actions;
      if (id != null && ((_a = actions[actions.length - 1]) === null || _a === undefined ? undefined : _a.id) !== id) {
        immediateProvider_1.immediateProvider.clearImmediate(id);
        if (scheduler._scheduled === id) {
          scheduler._scheduled = undefined;
        }
      }
      return;
    };
    return AsapAction2;
  }(AsyncAction_1.AsyncAction);
  exports.AsapAction = AsapAction;
});

// node_modules/rxjs/dist/cjs/internal/Scheduler.js
var require_Scheduler = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Scheduler = undefined;
  var dateTimestampProvider_1 = require_dateTimestampProvider();
  var Scheduler = function() {
    function Scheduler2(schedulerActionCtor, now) {
      if (now === undefined) {
        now = Scheduler2.now;
      }
      this.schedulerActionCtor = schedulerActionCtor;
      this.now = now;
    }
    Scheduler2.prototype.schedule = function(work, delay, state) {
      if (delay === undefined) {
        delay = 0;
      }
      return new this.schedulerActionCtor(this, work).schedule(state, delay);
    };
    Scheduler2.now = dateTimestampProvider_1.dateTimestampProvider.now;
    return Scheduler2;
  }();
  exports.Scheduler = Scheduler;
});

// node_modules/rxjs/dist/cjs/internal/scheduler/AsyncScheduler.js
var require_AsyncScheduler = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AsyncScheduler = undefined;
  var Scheduler_1 = require_Scheduler();
  var AsyncScheduler = function(_super) {
    __extends(AsyncScheduler2, _super);
    function AsyncScheduler2(SchedulerAction, now) {
      if (now === undefined) {
        now = Scheduler_1.Scheduler.now;
      }
      var _this = _super.call(this, SchedulerAction, now) || this;
      _this.actions = [];
      _this._active = false;
      return _this;
    }
    AsyncScheduler2.prototype.flush = function(action) {
      var actions = this.actions;
      if (this._active) {
        actions.push(action);
        return;
      }
      var error;
      this._active = true;
      do {
        if (error = action.execute(action.state, action.delay)) {
          break;
        }
      } while (action = actions.shift());
      this._active = false;
      if (error) {
        while (action = actions.shift()) {
          action.unsubscribe();
        }
        throw error;
      }
    };
    return AsyncScheduler2;
  }(Scheduler_1.Scheduler);
  exports.AsyncScheduler = AsyncScheduler;
});

// node_modules/rxjs/dist/cjs/internal/scheduler/AsapScheduler.js
var require_AsapScheduler = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AsapScheduler = undefined;
  var AsyncScheduler_1 = require_AsyncScheduler();
  var AsapScheduler = function(_super) {
    __extends(AsapScheduler2, _super);
    function AsapScheduler2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    AsapScheduler2.prototype.flush = function(action) {
      this._active = true;
      var flushId = this._scheduled;
      this._scheduled = undefined;
      var actions = this.actions;
      var error;
      action = action || actions.shift();
      do {
        if (error = action.execute(action.state, action.delay)) {
          break;
        }
      } while ((action = actions[0]) && action.id === flushId && actions.shift());
      this._active = false;
      if (error) {
        while ((action = actions[0]) && action.id === flushId && actions.shift()) {
          action.unsubscribe();
        }
        throw error;
      }
    };
    return AsapScheduler2;
  }(AsyncScheduler_1.AsyncScheduler);
  exports.AsapScheduler = AsapScheduler;
});

// node_modules/rxjs/dist/cjs/internal/scheduler/asap.js
var require_asap = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.asap = exports.asapScheduler = undefined;
  var AsapAction_1 = require_AsapAction();
  var AsapScheduler_1 = require_AsapScheduler();
  exports.asapScheduler = new AsapScheduler_1.AsapScheduler(AsapAction_1.AsapAction);
  exports.asap = exports.asapScheduler;
});

// node_modules/rxjs/dist/cjs/internal/scheduler/async.js
var require_async = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.async = exports.asyncScheduler = undefined;
  var AsyncAction_1 = require_AsyncAction();
  var AsyncScheduler_1 = require_AsyncScheduler();
  exports.asyncScheduler = new AsyncScheduler_1.AsyncScheduler(AsyncAction_1.AsyncAction);
  exports.async = exports.asyncScheduler;
});

// node_modules/rxjs/dist/cjs/internal/scheduler/QueueAction.js
var require_QueueAction = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.QueueAction = undefined;
  var AsyncAction_1 = require_AsyncAction();
  var QueueAction = function(_super) {
    __extends(QueueAction2, _super);
    function QueueAction2(scheduler, work) {
      var _this = _super.call(this, scheduler, work) || this;
      _this.scheduler = scheduler;
      _this.work = work;
      return _this;
    }
    QueueAction2.prototype.schedule = function(state, delay) {
      if (delay === undefined) {
        delay = 0;
      }
      if (delay > 0) {
        return _super.prototype.schedule.call(this, state, delay);
      }
      this.delay = delay;
      this.state = state;
      this.scheduler.flush(this);
      return this;
    };
    QueueAction2.prototype.execute = function(state, delay) {
      return delay > 0 || this.closed ? _super.prototype.execute.call(this, state, delay) : this._execute(state, delay);
    };
    QueueAction2.prototype.requestAsyncId = function(scheduler, id, delay) {
      if (delay === undefined) {
        delay = 0;
      }
      if (delay != null && delay > 0 || delay == null && this.delay > 0) {
        return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
      }
      scheduler.flush(this);
      return 0;
    };
    return QueueAction2;
  }(AsyncAction_1.AsyncAction);
  exports.QueueAction = QueueAction;
});

// node_modules/rxjs/dist/cjs/internal/scheduler/QueueScheduler.js
var require_QueueScheduler = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.QueueScheduler = undefined;
  var AsyncScheduler_1 = require_AsyncScheduler();
  var QueueScheduler = function(_super) {
    __extends(QueueScheduler2, _super);
    function QueueScheduler2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    return QueueScheduler2;
  }(AsyncScheduler_1.AsyncScheduler);
  exports.QueueScheduler = QueueScheduler;
});

// node_modules/rxjs/dist/cjs/internal/scheduler/queue.js
var require_queue = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.queue = exports.queueScheduler = undefined;
  var QueueAction_1 = require_QueueAction();
  var QueueScheduler_1 = require_QueueScheduler();
  exports.queueScheduler = new QueueScheduler_1.QueueScheduler(QueueAction_1.QueueAction);
  exports.queue = exports.queueScheduler;
});

// node_modules/rxjs/dist/cjs/internal/scheduler/AnimationFrameAction.js
var require_AnimationFrameAction = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AnimationFrameAction = undefined;
  var AsyncAction_1 = require_AsyncAction();
  var animationFrameProvider_1 = require_animationFrameProvider();
  var AnimationFrameAction = function(_super) {
    __extends(AnimationFrameAction2, _super);
    function AnimationFrameAction2(scheduler, work) {
      var _this = _super.call(this, scheduler, work) || this;
      _this.scheduler = scheduler;
      _this.work = work;
      return _this;
    }
    AnimationFrameAction2.prototype.requestAsyncId = function(scheduler, id, delay) {
      if (delay === undefined) {
        delay = 0;
      }
      if (delay !== null && delay > 0) {
        return _super.prototype.requestAsyncId.call(this, scheduler, id, delay);
      }
      scheduler.actions.push(this);
      return scheduler._scheduled || (scheduler._scheduled = animationFrameProvider_1.animationFrameProvider.requestAnimationFrame(function() {
        return scheduler.flush(undefined);
      }));
    };
    AnimationFrameAction2.prototype.recycleAsyncId = function(scheduler, id, delay) {
      var _a;
      if (delay === undefined) {
        delay = 0;
      }
      if (delay != null ? delay > 0 : this.delay > 0) {
        return _super.prototype.recycleAsyncId.call(this, scheduler, id, delay);
      }
      var actions = scheduler.actions;
      if (id != null && ((_a = actions[actions.length - 1]) === null || _a === undefined ? undefined : _a.id) !== id) {
        animationFrameProvider_1.animationFrameProvider.cancelAnimationFrame(id);
        scheduler._scheduled = undefined;
      }
      return;
    };
    return AnimationFrameAction2;
  }(AsyncAction_1.AsyncAction);
  exports.AnimationFrameAction = AnimationFrameAction;
});

// node_modules/rxjs/dist/cjs/internal/scheduler/AnimationFrameScheduler.js
var require_AnimationFrameScheduler = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AnimationFrameScheduler = undefined;
  var AsyncScheduler_1 = require_AsyncScheduler();
  var AnimationFrameScheduler = function(_super) {
    __extends(AnimationFrameScheduler2, _super);
    function AnimationFrameScheduler2() {
      return _super !== null && _super.apply(this, arguments) || this;
    }
    AnimationFrameScheduler2.prototype.flush = function(action) {
      this._active = true;
      var flushId = this._scheduled;
      this._scheduled = undefined;
      var actions = this.actions;
      var error;
      action = action || actions.shift();
      do {
        if (error = action.execute(action.state, action.delay)) {
          break;
        }
      } while ((action = actions[0]) && action.id === flushId && actions.shift());
      this._active = false;
      if (error) {
        while ((action = actions[0]) && action.id === flushId && actions.shift()) {
          action.unsubscribe();
        }
        throw error;
      }
    };
    return AnimationFrameScheduler2;
  }(AsyncScheduler_1.AsyncScheduler);
  exports.AnimationFrameScheduler = AnimationFrameScheduler;
});

// node_modules/rxjs/dist/cjs/internal/scheduler/animationFrame.js
var require_animationFrame = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.animationFrame = exports.animationFrameScheduler = undefined;
  var AnimationFrameAction_1 = require_AnimationFrameAction();
  var AnimationFrameScheduler_1 = require_AnimationFrameScheduler();
  exports.animationFrameScheduler = new AnimationFrameScheduler_1.AnimationFrameScheduler(AnimationFrameAction_1.AnimationFrameAction);
  exports.animationFrame = exports.animationFrameScheduler;
});

// node_modules/rxjs/dist/cjs/internal/scheduler/VirtualTimeScheduler.js
var require_VirtualTimeScheduler = __commonJS((exports) => {
  var __extends = exports && exports.__extends || function() {
    var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
        d2.__proto__ = b2;
      } || function(d2, b2) {
        for (var p in b2)
          if (Object.prototype.hasOwnProperty.call(b2, p))
            d2[p] = b2[p];
      };
      return extendStatics(d, b);
    };
    return function(d, b) {
      if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
      extendStatics(d, b);
      function __() {
        this.constructor = d;
      }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __);
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.VirtualAction = exports.VirtualTimeScheduler = undefined;
  var AsyncAction_1 = require_AsyncAction();
  var Subscription_1 = require_Subscription();
  var AsyncScheduler_1 = require_AsyncScheduler();
  var VirtualTimeScheduler = function(_super) {
    __extends(VirtualTimeScheduler2, _super);
    function VirtualTimeScheduler2(schedulerActionCtor, maxFrames) {
      if (schedulerActionCtor === undefined) {
        schedulerActionCtor = VirtualAction;
      }
      if (maxFrames === undefined) {
        maxFrames = Infinity;
      }
      var _this = _super.call(this, schedulerActionCtor, function() {
        return _this.frame;
      }) || this;
      _this.maxFrames = maxFrames;
      _this.frame = 0;
      _this.index = -1;
      return _this;
    }
    VirtualTimeScheduler2.prototype.flush = function() {
      var _a = this, actions = _a.actions, maxFrames = _a.maxFrames;
      var error;
      var action;
      while ((action = actions[0]) && action.delay <= maxFrames) {
        actions.shift();
        this.frame = action.delay;
        if (error = action.execute(action.state, action.delay)) {
          break;
        }
      }
      if (error) {
        while (action = actions.shift()) {
          action.unsubscribe();
        }
        throw error;
      }
    };
    VirtualTimeScheduler2.frameTimeFactor = 10;
    return VirtualTimeScheduler2;
  }(AsyncScheduler_1.AsyncScheduler);
  exports.VirtualTimeScheduler = VirtualTimeScheduler;
  var VirtualAction = function(_super) {
    __extends(VirtualAction2, _super);
    function VirtualAction2(scheduler, work, index) {
      if (index === undefined) {
        index = scheduler.index += 1;
      }
      var _this = _super.call(this, scheduler, work) || this;
      _this.scheduler = scheduler;
      _this.work = work;
      _this.index = index;
      _this.active = true;
      _this.index = scheduler.index = index;
      return _this;
    }
    VirtualAction2.prototype.schedule = function(state, delay) {
      if (delay === undefined) {
        delay = 0;
      }
      if (Number.isFinite(delay)) {
        if (!this.id) {
          return _super.prototype.schedule.call(this, state, delay);
        }
        this.active = false;
        var action = new VirtualAction2(this.scheduler, this.work);
        this.add(action);
        return action.schedule(state, delay);
      } else {
        return Subscription_1.Subscription.EMPTY;
      }
    };
    VirtualAction2.prototype.requestAsyncId = function(scheduler, id, delay) {
      if (delay === undefined) {
        delay = 0;
      }
      this.delay = scheduler.frame + delay;
      var actions = scheduler.actions;
      actions.push(this);
      actions.sort(VirtualAction2.sortActions);
      return 1;
    };
    VirtualAction2.prototype.recycleAsyncId = function(scheduler, id, delay) {
      if (delay === undefined) {
        delay = 0;
      }
      return;
    };
    VirtualAction2.prototype._execute = function(state, delay) {
      if (this.active === true) {
        return _super.prototype._execute.call(this, state, delay);
      }
    };
    VirtualAction2.sortActions = function(a, b) {
      if (a.delay === b.delay) {
        if (a.index === b.index) {
          return 0;
        } else if (a.index > b.index) {
          return 1;
        } else {
          return -1;
        }
      } else if (a.delay > b.delay) {
        return 1;
      } else {
        return -1;
      }
    };
    return VirtualAction2;
  }(AsyncAction_1.AsyncAction);
  exports.VirtualAction = VirtualAction;
});

// node_modules/rxjs/dist/cjs/internal/observable/empty.js
var require_empty2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.empty = exports.EMPTY = undefined;
  var Observable_1 = require_Observable();
  exports.EMPTY = new Observable_1.Observable(function(subscriber) {
    return subscriber.complete();
  });
  function empty(scheduler) {
    return scheduler ? emptyScheduled(scheduler) : exports.EMPTY;
  }
  exports.empty = empty;
  function emptyScheduled(scheduler) {
    return new Observable_1.Observable(function(subscriber) {
      return scheduler.schedule(function() {
        return subscriber.complete();
      });
    });
  }
});

// node_modules/rxjs/dist/cjs/internal/util/isScheduler.js
var require_isScheduler = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isScheduler = undefined;
  var isFunction_1 = require_isFunction();
  function isScheduler(value) {
    return value && isFunction_1.isFunction(value.schedule);
  }
  exports.isScheduler = isScheduler;
});

// node_modules/rxjs/dist/cjs/internal/util/args.js
var require_args = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.popNumber = exports.popScheduler = exports.popResultSelector = undefined;
  var isFunction_1 = require_isFunction();
  var isScheduler_1 = require_isScheduler();
  function last(arr) {
    return arr[arr.length - 1];
  }
  function popResultSelector(args) {
    return isFunction_1.isFunction(last(args)) ? args.pop() : undefined;
  }
  exports.popResultSelector = popResultSelector;
  function popScheduler(args) {
    return isScheduler_1.isScheduler(last(args)) ? args.pop() : undefined;
  }
  exports.popScheduler = popScheduler;
  function popNumber(args, defaultValue) {
    return typeof last(args) === "number" ? args.pop() : defaultValue;
  }
  exports.popNumber = popNumber;
});

// node_modules/rxjs/dist/cjs/internal/util/isArrayLike.js
var require_isArrayLike = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isArrayLike = undefined;
  exports.isArrayLike = function(x) {
    return x && typeof x.length === "number" && typeof x !== "function";
  };
});

// node_modules/rxjs/dist/cjs/internal/util/isPromise.js
var require_isPromise = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isPromise = undefined;
  var isFunction_1 = require_isFunction();
  function isPromise(value) {
    return isFunction_1.isFunction(value === null || value === undefined ? undefined : value.then);
  }
  exports.isPromise = isPromise;
});

// node_modules/rxjs/dist/cjs/internal/util/isInteropObservable.js
var require_isInteropObservable = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isInteropObservable = undefined;
  var observable_1 = require_observable();
  var isFunction_1 = require_isFunction();
  function isInteropObservable(input) {
    return isFunction_1.isFunction(input[observable_1.observable]);
  }
  exports.isInteropObservable = isInteropObservable;
});

// node_modules/rxjs/dist/cjs/internal/util/isAsyncIterable.js
var require_isAsyncIterable = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isAsyncIterable = undefined;
  var isFunction_1 = require_isFunction();
  function isAsyncIterable(obj) {
    return Symbol.asyncIterator && isFunction_1.isFunction(obj === null || obj === undefined ? undefined : obj[Symbol.asyncIterator]);
  }
  exports.isAsyncIterable = isAsyncIterable;
});

// node_modules/rxjs/dist/cjs/internal/util/throwUnobservableError.js
var require_throwUnobservableError = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createInvalidObservableTypeError = undefined;
  function createInvalidObservableTypeError(input) {
    return new TypeError("You provided " + (input !== null && typeof input === "object" ? "an invalid object" : "'" + input + "'") + " where a stream was expected. You can provide an Observable, Promise, ReadableStream, Array, AsyncIterable, or Iterable.");
  }
  exports.createInvalidObservableTypeError = createInvalidObservableTypeError;
});

// node_modules/rxjs/dist/cjs/internal/symbol/iterator.js
var require_iterator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.iterator = exports.getSymbolIterator = undefined;
  function getSymbolIterator() {
    if (typeof Symbol !== "function" || !Symbol.iterator) {
      return "@@iterator";
    }
    return Symbol.iterator;
  }
  exports.getSymbolIterator = getSymbolIterator;
  exports.iterator = getSymbolIterator();
});

// node_modules/rxjs/dist/cjs/internal/util/isIterable.js
var require_isIterable = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isIterable = undefined;
  var iterator_1 = require_iterator();
  var isFunction_1 = require_isFunction();
  function isIterable(input) {
    return isFunction_1.isFunction(input === null || input === undefined ? undefined : input[iterator_1.iterator]);
  }
  exports.isIterable = isIterable;
});

// node_modules/rxjs/dist/cjs/internal/util/isReadableStreamLike.js
var require_isReadableStreamLike = __commonJS((exports) => {
  var __generator = exports && exports.__generator || function(thisArg, body) {
    var _ = { label: 0, sent: function() {
      if (t[0] & 1)
        throw t[1];
      return t[1];
    }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), throw: verb(1), return: verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
      return this;
    }), g;
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f)
        throw new TypeError("Generator is already executing.");
      while (_)
        try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
            return t;
          if (y = 0, t)
            op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2])
                _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5)
        throw op[1];
      return { value: op[0] ? op[1] : undefined, done: true };
    }
  };
  var __await = exports && exports.__await || function(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
  };
  var __asyncGenerator = exports && exports.__asyncGenerator || function(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator)
      throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
      return this;
    }, i;
    function verb(n) {
      if (g[n])
        i[n] = function(v) {
          return new Promise(function(a, b) {
            q.push([n, v, a, b]) > 1 || resume(n, v);
          });
        };
    }
    function resume(n, v) {
      try {
        step(g[n](v));
      } catch (e) {
        settle(q[0][3], e);
      }
    }
    function step(r) {
      r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
    }
    function fulfill(value) {
      resume("next", value);
    }
    function reject(value) {
      resume("throw", value);
    }
    function settle(f, v) {
      if (f(v), q.shift(), q.length)
        resume(q[0][0], q[0][1]);
    }
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isReadableStreamLike = exports.readableStreamLikeToAsyncGenerator = undefined;
  var isFunction_1 = require_isFunction();
  function readableStreamLikeToAsyncGenerator(readableStream) {
    return __asyncGenerator(this, arguments, function readableStreamLikeToAsyncGenerator_1() {
      var reader, _a, value, done;
      return __generator(this, function(_b) {
        switch (_b.label) {
          case 0:
            reader = readableStream.getReader();
            _b.label = 1;
          case 1:
            _b.trys.push([1, , 9, 10]);
            _b.label = 2;
          case 2:
            if (false)
              ;
            return [4, __await(reader.read())];
          case 3:
            _a = _b.sent(), value = _a.value, done = _a.done;
            if (!done)
              return [3, 5];
            return [4, __await(undefined)];
          case 4:
            return [2, _b.sent()];
          case 5:
            return [4, __await(value)];
          case 6:
            return [4, _b.sent()];
          case 7:
            _b.sent();
            return [3, 2];
          case 8:
            return [3, 10];
          case 9:
            reader.releaseLock();
            return [7];
          case 10:
            return [2];
        }
      });
    });
  }
  exports.readableStreamLikeToAsyncGenerator = readableStreamLikeToAsyncGenerator;
  function isReadableStreamLike(obj) {
    return isFunction_1.isFunction(obj === null || obj === undefined ? undefined : obj.getReader);
  }
  exports.isReadableStreamLike = isReadableStreamLike;
});

// node_modules/rxjs/dist/cjs/internal/observable/innerFrom.js
var require_innerFrom = __commonJS((exports) => {
  var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  var __generator = exports && exports.__generator || function(thisArg, body) {
    var _ = { label: 0, sent: function() {
      if (t[0] & 1)
        throw t[1];
      return t[1];
    }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), throw: verb(1), return: verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
      return this;
    }), g;
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f)
        throw new TypeError("Generator is already executing.");
      while (_)
        try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
            return t;
          if (y = 0, t)
            op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2])
                _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5)
        throw op[1];
      return { value: op[0] ? op[1] : undefined, done: true };
    }
  };
  var __asyncValues = exports && exports.__asyncValues || function(o) {
    if (!Symbol.asyncIterator)
      throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function() {
      return this;
    }, i);
    function verb(n) {
      i[n] = o[n] && function(v) {
        return new Promise(function(resolve, reject) {
          v = o[n](v), settle(resolve, reject, v.done, v.value);
        });
      };
    }
    function settle(resolve, reject, d, v) {
      Promise.resolve(v).then(function(v2) {
        resolve({ value: v2, done: d });
      }, reject);
    }
  };
  var __values = exports && exports.__values || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m)
      return m.call(o);
    if (o && typeof o.length === "number")
      return {
        next: function() {
          if (o && i >= o.length)
            o = undefined;
          return { value: o && o[i++], done: !o };
        }
      };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.fromReadableStreamLike = exports.fromAsyncIterable = exports.fromIterable = exports.fromPromise = exports.fromArrayLike = exports.fromInteropObservable = exports.innerFrom = undefined;
  var isArrayLike_1 = require_isArrayLike();
  var isPromise_1 = require_isPromise();
  var Observable_1 = require_Observable();
  var isInteropObservable_1 = require_isInteropObservable();
  var isAsyncIterable_1 = require_isAsyncIterable();
  var throwUnobservableError_1 = require_throwUnobservableError();
  var isIterable_1 = require_isIterable();
  var isReadableStreamLike_1 = require_isReadableStreamLike();
  var isFunction_1 = require_isFunction();
  var reportUnhandledError_1 = require_reportUnhandledError();
  var observable_1 = require_observable();
  function innerFrom(input) {
    if (input instanceof Observable_1.Observable) {
      return input;
    }
    if (input != null) {
      if (isInteropObservable_1.isInteropObservable(input)) {
        return fromInteropObservable(input);
      }
      if (isArrayLike_1.isArrayLike(input)) {
        return fromArrayLike(input);
      }
      if (isPromise_1.isPromise(input)) {
        return fromPromise(input);
      }
      if (isAsyncIterable_1.isAsyncIterable(input)) {
        return fromAsyncIterable(input);
      }
      if (isIterable_1.isIterable(input)) {
        return fromIterable(input);
      }
      if (isReadableStreamLike_1.isReadableStreamLike(input)) {
        return fromReadableStreamLike(input);
      }
    }
    throw throwUnobservableError_1.createInvalidObservableTypeError(input);
  }
  exports.innerFrom = innerFrom;
  function fromInteropObservable(obj) {
    return new Observable_1.Observable(function(subscriber) {
      var obs = obj[observable_1.observable]();
      if (isFunction_1.isFunction(obs.subscribe)) {
        return obs.subscribe(subscriber);
      }
      throw new TypeError("Provided object does not correctly implement Symbol.observable");
    });
  }
  exports.fromInteropObservable = fromInteropObservable;
  function fromArrayLike(array) {
    return new Observable_1.Observable(function(subscriber) {
      for (var i = 0;i < array.length && !subscriber.closed; i++) {
        subscriber.next(array[i]);
      }
      subscriber.complete();
    });
  }
  exports.fromArrayLike = fromArrayLike;
  function fromPromise(promise) {
    return new Observable_1.Observable(function(subscriber) {
      promise.then(function(value) {
        if (!subscriber.closed) {
          subscriber.next(value);
          subscriber.complete();
        }
      }, function(err) {
        return subscriber.error(err);
      }).then(null, reportUnhandledError_1.reportUnhandledError);
    });
  }
  exports.fromPromise = fromPromise;
  function fromIterable(iterable) {
    return new Observable_1.Observable(function(subscriber) {
      var e_1, _a;
      try {
        for (var iterable_1 = __values(iterable), iterable_1_1 = iterable_1.next();!iterable_1_1.done; iterable_1_1 = iterable_1.next()) {
          var value = iterable_1_1.value;
          subscriber.next(value);
          if (subscriber.closed) {
            return;
          }
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (iterable_1_1 && !iterable_1_1.done && (_a = iterable_1.return))
            _a.call(iterable_1);
        } finally {
          if (e_1)
            throw e_1.error;
        }
      }
      subscriber.complete();
    });
  }
  exports.fromIterable = fromIterable;
  function fromAsyncIterable(asyncIterable) {
    return new Observable_1.Observable(function(subscriber) {
      process11(asyncIterable, subscriber).catch(function(err) {
        return subscriber.error(err);
      });
    });
  }
  exports.fromAsyncIterable = fromAsyncIterable;
  function fromReadableStreamLike(readableStream) {
    return fromAsyncIterable(isReadableStreamLike_1.readableStreamLikeToAsyncGenerator(readableStream));
  }
  exports.fromReadableStreamLike = fromReadableStreamLike;
  function process11(asyncIterable, subscriber) {
    var asyncIterable_1, asyncIterable_1_1;
    var e_2, _a;
    return __awaiter(this, undefined, undefined, function() {
      var value, e_2_1;
      return __generator(this, function(_b) {
        switch (_b.label) {
          case 0:
            _b.trys.push([0, 5, 6, 11]);
            asyncIterable_1 = __asyncValues(asyncIterable);
            _b.label = 1;
          case 1:
            return [4, asyncIterable_1.next()];
          case 2:
            if (!(asyncIterable_1_1 = _b.sent(), !asyncIterable_1_1.done))
              return [3, 4];
            value = asyncIterable_1_1.value;
            subscriber.next(value);
            if (subscriber.closed) {
              return [2];
            }
            _b.label = 3;
          case 3:
            return [3, 1];
          case 4:
            return [3, 11];
          case 5:
            e_2_1 = _b.sent();
            e_2 = { error: e_2_1 };
            return [3, 11];
          case 6:
            _b.trys.push([6, , 9, 10]);
            if (!(asyncIterable_1_1 && !asyncIterable_1_1.done && (_a = asyncIterable_1.return)))
              return [3, 8];
            return [4, _a.call(asyncIterable_1)];
          case 7:
            _b.sent();
            _b.label = 8;
          case 8:
            return [3, 10];
          case 9:
            if (e_2)
              throw e_2.error;
            return [7];
          case 10:
            return [7];
          case 11:
            subscriber.complete();
            return [2];
        }
      });
    });
  }
});

// node_modules/rxjs/dist/cjs/internal/util/executeSchedule.js
var require_executeSchedule = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.executeSchedule = undefined;
  function executeSchedule(parentSubscription, scheduler, work, delay, repeat) {
    if (delay === undefined) {
      delay = 0;
    }
    if (repeat === undefined) {
      repeat = false;
    }
    var scheduleSubscription = scheduler.schedule(function() {
      work();
      if (repeat) {
        parentSubscription.add(this.schedule(null, delay));
      } else {
        this.unsubscribe();
      }
    }, delay);
    parentSubscription.add(scheduleSubscription);
    if (!repeat) {
      return scheduleSubscription;
    }
  }
  exports.executeSchedule = executeSchedule;
});

// node_modules/rxjs/dist/cjs/internal/operators/observeOn.js
var require_observeOn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.observeOn = undefined;
  var executeSchedule_1 = require_executeSchedule();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function observeOn(scheduler, delay) {
    if (delay === undefined) {
      delay = 0;
    }
    return lift_1.operate(function(source, subscriber) {
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        return executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
          return subscriber.next(value);
        }, delay);
      }, function() {
        return executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
          return subscriber.complete();
        }, delay);
      }, function(err) {
        return executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
          return subscriber.error(err);
        }, delay);
      }));
    });
  }
  exports.observeOn = observeOn;
});

// node_modules/rxjs/dist/cjs/internal/operators/subscribeOn.js
var require_subscribeOn = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.subscribeOn = undefined;
  var lift_1 = require_lift();
  function subscribeOn(scheduler, delay) {
    if (delay === undefined) {
      delay = 0;
    }
    return lift_1.operate(function(source, subscriber) {
      subscriber.add(scheduler.schedule(function() {
        return source.subscribe(subscriber);
      }, delay));
    });
  }
  exports.subscribeOn = subscribeOn;
});

// node_modules/rxjs/dist/cjs/internal/scheduled/scheduleObservable.js
var require_scheduleObservable = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.scheduleObservable = undefined;
  var innerFrom_1 = require_innerFrom();
  var observeOn_1 = require_observeOn();
  var subscribeOn_1 = require_subscribeOn();
  function scheduleObservable(input, scheduler) {
    return innerFrom_1.innerFrom(input).pipe(subscribeOn_1.subscribeOn(scheduler), observeOn_1.observeOn(scheduler));
  }
  exports.scheduleObservable = scheduleObservable;
});

// node_modules/rxjs/dist/cjs/internal/scheduled/schedulePromise.js
var require_schedulePromise = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.schedulePromise = undefined;
  var innerFrom_1 = require_innerFrom();
  var observeOn_1 = require_observeOn();
  var subscribeOn_1 = require_subscribeOn();
  function schedulePromise(input, scheduler) {
    return innerFrom_1.innerFrom(input).pipe(subscribeOn_1.subscribeOn(scheduler), observeOn_1.observeOn(scheduler));
  }
  exports.schedulePromise = schedulePromise;
});

// node_modules/rxjs/dist/cjs/internal/scheduled/scheduleArray.js
var require_scheduleArray = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.scheduleArray = undefined;
  var Observable_1 = require_Observable();
  function scheduleArray(input, scheduler) {
    return new Observable_1.Observable(function(subscriber) {
      var i = 0;
      return scheduler.schedule(function() {
        if (i === input.length) {
          subscriber.complete();
        } else {
          subscriber.next(input[i++]);
          if (!subscriber.closed) {
            this.schedule();
          }
        }
      });
    });
  }
  exports.scheduleArray = scheduleArray;
});

// node_modules/rxjs/dist/cjs/internal/scheduled/scheduleIterable.js
var require_scheduleIterable = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.scheduleIterable = undefined;
  var Observable_1 = require_Observable();
  var iterator_1 = require_iterator();
  var isFunction_1 = require_isFunction();
  var executeSchedule_1 = require_executeSchedule();
  function scheduleIterable(input, scheduler) {
    return new Observable_1.Observable(function(subscriber) {
      var iterator;
      executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
        iterator = input[iterator_1.iterator]();
        executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
          var _a;
          var value;
          var done;
          try {
            _a = iterator.next(), value = _a.value, done = _a.done;
          } catch (err) {
            subscriber.error(err);
            return;
          }
          if (done) {
            subscriber.complete();
          } else {
            subscriber.next(value);
          }
        }, 0, true);
      });
      return function() {
        return isFunction_1.isFunction(iterator === null || iterator === undefined ? undefined : iterator.return) && iterator.return();
      };
    });
  }
  exports.scheduleIterable = scheduleIterable;
});

// node_modules/rxjs/dist/cjs/internal/scheduled/scheduleAsyncIterable.js
var require_scheduleAsyncIterable = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.scheduleAsyncIterable = undefined;
  var Observable_1 = require_Observable();
  var executeSchedule_1 = require_executeSchedule();
  function scheduleAsyncIterable(input, scheduler) {
    if (!input) {
      throw new Error("Iterable cannot be null");
    }
    return new Observable_1.Observable(function(subscriber) {
      executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
        var iterator = input[Symbol.asyncIterator]();
        executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
          iterator.next().then(function(result) {
            if (result.done) {
              subscriber.complete();
            } else {
              subscriber.next(result.value);
            }
          });
        }, 0, true);
      });
    });
  }
  exports.scheduleAsyncIterable = scheduleAsyncIterable;
});

// node_modules/rxjs/dist/cjs/internal/scheduled/scheduleReadableStreamLike.js
var require_scheduleReadableStreamLike = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.scheduleReadableStreamLike = undefined;
  var scheduleAsyncIterable_1 = require_scheduleAsyncIterable();
  var isReadableStreamLike_1 = require_isReadableStreamLike();
  function scheduleReadableStreamLike(input, scheduler) {
    return scheduleAsyncIterable_1.scheduleAsyncIterable(isReadableStreamLike_1.readableStreamLikeToAsyncGenerator(input), scheduler);
  }
  exports.scheduleReadableStreamLike = scheduleReadableStreamLike;
});

// node_modules/rxjs/dist/cjs/internal/scheduled/scheduled.js
var require_scheduled = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.scheduled = undefined;
  var scheduleObservable_1 = require_scheduleObservable();
  var schedulePromise_1 = require_schedulePromise();
  var scheduleArray_1 = require_scheduleArray();
  var scheduleIterable_1 = require_scheduleIterable();
  var scheduleAsyncIterable_1 = require_scheduleAsyncIterable();
  var isInteropObservable_1 = require_isInteropObservable();
  var isPromise_1 = require_isPromise();
  var isArrayLike_1 = require_isArrayLike();
  var isIterable_1 = require_isIterable();
  var isAsyncIterable_1 = require_isAsyncIterable();
  var throwUnobservableError_1 = require_throwUnobservableError();
  var isReadableStreamLike_1 = require_isReadableStreamLike();
  var scheduleReadableStreamLike_1 = require_scheduleReadableStreamLike();
  function scheduled(input, scheduler) {
    if (input != null) {
      if (isInteropObservable_1.isInteropObservable(input)) {
        return scheduleObservable_1.scheduleObservable(input, scheduler);
      }
      if (isArrayLike_1.isArrayLike(input)) {
        return scheduleArray_1.scheduleArray(input, scheduler);
      }
      if (isPromise_1.isPromise(input)) {
        return schedulePromise_1.schedulePromise(input, scheduler);
      }
      if (isAsyncIterable_1.isAsyncIterable(input)) {
        return scheduleAsyncIterable_1.scheduleAsyncIterable(input, scheduler);
      }
      if (isIterable_1.isIterable(input)) {
        return scheduleIterable_1.scheduleIterable(input, scheduler);
      }
      if (isReadableStreamLike_1.isReadableStreamLike(input)) {
        return scheduleReadableStreamLike_1.scheduleReadableStreamLike(input, scheduler);
      }
    }
    throw throwUnobservableError_1.createInvalidObservableTypeError(input);
  }
  exports.scheduled = scheduled;
});

// node_modules/rxjs/dist/cjs/internal/observable/from.js
var require_from = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.from = undefined;
  var scheduled_1 = require_scheduled();
  var innerFrom_1 = require_innerFrom();
  function from(input, scheduler) {
    return scheduler ? scheduled_1.scheduled(input, scheduler) : innerFrom_1.innerFrom(input);
  }
  exports.from = from;
});

// node_modules/rxjs/dist/cjs/internal/observable/of.js
var require_of = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.of = undefined;
  var args_1 = require_args();
  var from_1 = require_from();
  function of() {
    var args = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var scheduler = args_1.popScheduler(args);
    return from_1.from(args, scheduler);
  }
  exports.of = of;
});

// node_modules/rxjs/dist/cjs/internal/observable/throwError.js
var require_throwError = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.throwError = undefined;
  var Observable_1 = require_Observable();
  var isFunction_1 = require_isFunction();
  function throwError(errorOrErrorFactory, scheduler) {
    var errorFactory = isFunction_1.isFunction(errorOrErrorFactory) ? errorOrErrorFactory : function() {
      return errorOrErrorFactory;
    };
    var init = function(subscriber) {
      return subscriber.error(errorFactory());
    };
    return new Observable_1.Observable(scheduler ? function(subscriber) {
      return scheduler.schedule(init, 0, subscriber);
    } : init);
  }
  exports.throwError = throwError;
});

// node_modules/rxjs/dist/cjs/internal/Notification.js
var require_Notification = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.observeNotification = exports.Notification = exports.NotificationKind = undefined;
  var empty_1 = require_empty2();
  var of_1 = require_of();
  var throwError_1 = require_throwError();
  var isFunction_1 = require_isFunction();
  var NotificationKind;
  (function(NotificationKind2) {
    NotificationKind2["NEXT"] = "N";
    NotificationKind2["ERROR"] = "E";
    NotificationKind2["COMPLETE"] = "C";
  })(NotificationKind = exports.NotificationKind || (exports.NotificationKind = {}));
  var Notification = function() {
    function Notification2(kind, value, error) {
      this.kind = kind;
      this.value = value;
      this.error = error;
      this.hasValue = kind === "N";
    }
    Notification2.prototype.observe = function(observer) {
      return observeNotification(this, observer);
    };
    Notification2.prototype.do = function(nextHandler, errorHandler, completeHandler) {
      var _a = this, kind = _a.kind, value = _a.value, error = _a.error;
      return kind === "N" ? nextHandler === null || nextHandler === undefined ? undefined : nextHandler(value) : kind === "E" ? errorHandler === null || errorHandler === undefined ? undefined : errorHandler(error) : completeHandler === null || completeHandler === undefined ? undefined : completeHandler();
    };
    Notification2.prototype.accept = function(nextOrObserver, error, complete) {
      var _a;
      return isFunction_1.isFunction((_a = nextOrObserver) === null || _a === undefined ? undefined : _a.next) ? this.observe(nextOrObserver) : this.do(nextOrObserver, error, complete);
    };
    Notification2.prototype.toObservable = function() {
      var _a = this, kind = _a.kind, value = _a.value, error = _a.error;
      var result = kind === "N" ? of_1.of(value) : kind === "E" ? throwError_1.throwError(function() {
        return error;
      }) : kind === "C" ? empty_1.EMPTY : 0;
      if (!result) {
        throw new TypeError("Unexpected notification kind " + kind);
      }
      return result;
    };
    Notification2.createNext = function(value) {
      return new Notification2("N", value);
    };
    Notification2.createError = function(err) {
      return new Notification2("E", undefined, err);
    };
    Notification2.createComplete = function() {
      return Notification2.completeNotification;
    };
    Notification2.completeNotification = new Notification2("C");
    return Notification2;
  }();
  exports.Notification = Notification;
  function observeNotification(notification, observer) {
    var _a, _b, _c;
    var _d = notification, kind = _d.kind, value = _d.value, error = _d.error;
    if (typeof kind !== "string") {
      throw new TypeError('Invalid notification, missing "kind"');
    }
    kind === "N" ? (_a = observer.next) === null || _a === undefined || _a.call(observer, value) : kind === "E" ? (_b = observer.error) === null || _b === undefined || _b.call(observer, error) : (_c = observer.complete) === null || _c === undefined || _c.call(observer);
  }
  exports.observeNotification = observeNotification;
});

// node_modules/rxjs/dist/cjs/internal/util/isObservable.js
var require_isObservable = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isObservable = undefined;
  var Observable_1 = require_Observable();
  var isFunction_1 = require_isFunction();
  function isObservable(obj) {
    return !!obj && (obj instanceof Observable_1.Observable || isFunction_1.isFunction(obj.lift) && isFunction_1.isFunction(obj.subscribe));
  }
  exports.isObservable = isObservable;
});

// node_modules/rxjs/dist/cjs/internal/util/EmptyError.js
var require_EmptyError = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EmptyError = undefined;
  var createErrorClass_1 = require_createErrorClass();
  exports.EmptyError = createErrorClass_1.createErrorClass(function(_super) {
    return function EmptyErrorImpl() {
      _super(this);
      this.name = "EmptyError";
      this.message = "no elements in sequence";
    };
  });
});

// node_modules/rxjs/dist/cjs/internal/lastValueFrom.js
var require_lastValueFrom = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.lastValueFrom = undefined;
  var EmptyError_1 = require_EmptyError();
  function lastValueFrom(source, config) {
    var hasConfig = typeof config === "object";
    return new Promise(function(resolve, reject) {
      var _hasValue = false;
      var _value;
      source.subscribe({
        next: function(value) {
          _value = value;
          _hasValue = true;
        },
        error: reject,
        complete: function() {
          if (_hasValue) {
            resolve(_value);
          } else if (hasConfig) {
            resolve(config.defaultValue);
          } else {
            reject(new EmptyError_1.EmptyError);
          }
        }
      });
    });
  }
  exports.lastValueFrom = lastValueFrom;
});

// node_modules/rxjs/dist/cjs/internal/firstValueFrom.js
var require_firstValueFrom = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.firstValueFrom = undefined;
  var EmptyError_1 = require_EmptyError();
  var Subscriber_1 = require_Subscriber();
  function firstValueFrom(source, config) {
    var hasConfig = typeof config === "object";
    return new Promise(function(resolve, reject) {
      var subscriber = new Subscriber_1.SafeSubscriber({
        next: function(value) {
          resolve(value);
          subscriber.unsubscribe();
        },
        error: reject,
        complete: function() {
          if (hasConfig) {
            resolve(config.defaultValue);
          } else {
            reject(new EmptyError_1.EmptyError);
          }
        }
      });
      source.subscribe(subscriber);
    });
  }
  exports.firstValueFrom = firstValueFrom;
});

// node_modules/rxjs/dist/cjs/internal/util/ArgumentOutOfRangeError.js
var require_ArgumentOutOfRangeError = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ArgumentOutOfRangeError = undefined;
  var createErrorClass_1 = require_createErrorClass();
  exports.ArgumentOutOfRangeError = createErrorClass_1.createErrorClass(function(_super) {
    return function ArgumentOutOfRangeErrorImpl() {
      _super(this);
      this.name = "ArgumentOutOfRangeError";
      this.message = "argument out of range";
    };
  });
});

// node_modules/rxjs/dist/cjs/internal/util/NotFoundError.js
var require_NotFoundError = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.NotFoundError = undefined;
  var createErrorClass_1 = require_createErrorClass();
  exports.NotFoundError = createErrorClass_1.createErrorClass(function(_super) {
    return function NotFoundErrorImpl(message) {
      _super(this);
      this.name = "NotFoundError";
      this.message = message;
    };
  });
});

// node_modules/rxjs/dist/cjs/internal/util/SequenceError.js
var require_SequenceError = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SequenceError = undefined;
  var createErrorClass_1 = require_createErrorClass();
  exports.SequenceError = createErrorClass_1.createErrorClass(function(_super) {
    return function SequenceErrorImpl(message) {
      _super(this);
      this.name = "SequenceError";
      this.message = message;
    };
  });
});

// node_modules/rxjs/dist/cjs/internal/util/isDate.js
var require_isDate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isValidDate = undefined;
  function isValidDate(value) {
    return value instanceof Date && !isNaN(value);
  }
  exports.isValidDate = isValidDate;
});

// node_modules/rxjs/dist/cjs/internal/operators/timeout.js
var require_timeout = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.timeout = exports.TimeoutError = undefined;
  var async_1 = require_async();
  var isDate_1 = require_isDate();
  var lift_1 = require_lift();
  var innerFrom_1 = require_innerFrom();
  var createErrorClass_1 = require_createErrorClass();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var executeSchedule_1 = require_executeSchedule();
  exports.TimeoutError = createErrorClass_1.createErrorClass(function(_super) {
    return function TimeoutErrorImpl(info) {
      if (info === undefined) {
        info = null;
      }
      _super(this);
      this.message = "Timeout has occurred";
      this.name = "TimeoutError";
      this.info = info;
    };
  });
  function timeout(config, schedulerArg) {
    var _a = isDate_1.isValidDate(config) ? { first: config } : typeof config === "number" ? { each: config } : config, first = _a.first, each = _a.each, _b = _a.with, _with = _b === undefined ? timeoutErrorFactory : _b, _c = _a.scheduler, scheduler = _c === undefined ? schedulerArg !== null && schedulerArg !== undefined ? schedulerArg : async_1.asyncScheduler : _c, _d = _a.meta, meta = _d === undefined ? null : _d;
    if (first == null && each == null) {
      throw new TypeError("No timeout provided.");
    }
    return lift_1.operate(function(source, subscriber) {
      var originalSourceSubscription;
      var timerSubscription;
      var lastValue = null;
      var seen = 0;
      var startTimer = function(delay) {
        timerSubscription = executeSchedule_1.executeSchedule(subscriber, scheduler, function() {
          try {
            originalSourceSubscription.unsubscribe();
            innerFrom_1.innerFrom(_with({
              meta,
              lastValue,
              seen
            })).subscribe(subscriber);
          } catch (err) {
            subscriber.error(err);
          }
        }, delay);
      };
      originalSourceSubscription = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        timerSubscription === null || timerSubscription === undefined || timerSubscription.unsubscribe();
        seen++;
        subscriber.next(lastValue = value);
        each > 0 && startTimer(each);
      }, undefined, undefined, function() {
        if (!(timerSubscription === null || timerSubscription === undefined ? undefined : timerSubscription.closed)) {
          timerSubscription === null || timerSubscription === undefined || timerSubscription.unsubscribe();
        }
        lastValue = null;
      }));
      !seen && startTimer(first != null ? typeof first === "number" ? first : +first - scheduler.now() : each);
    });
  }
  exports.timeout = timeout;
  function timeoutErrorFactory(info) {
    throw new exports.TimeoutError(info);
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/map.js
var require_map = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.map = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function map(project, thisArg) {
    return lift_1.operate(function(source, subscriber) {
      var index = 0;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        subscriber.next(project.call(thisArg, value, index++));
      }));
    });
  }
  exports.map = map;
});

// node_modules/rxjs/dist/cjs/internal/util/mapOneOrManyArgs.js
var require_mapOneOrManyArgs = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.mapOneOrManyArgs = undefined;
  var map_1 = require_map();
  var isArray = Array.isArray;
  function callOrApply(fn, args) {
    return isArray(args) ? fn.apply(undefined, __spreadArray([], __read(args))) : fn(args);
  }
  function mapOneOrManyArgs(fn) {
    return map_1.map(function(args) {
      return callOrApply(fn, args);
    });
  }
  exports.mapOneOrManyArgs = mapOneOrManyArgs;
});

// node_modules/rxjs/dist/cjs/internal/observable/bindCallbackInternals.js
var require_bindCallbackInternals = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.bindCallbackInternals = undefined;
  var isScheduler_1 = require_isScheduler();
  var Observable_1 = require_Observable();
  var subscribeOn_1 = require_subscribeOn();
  var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
  var observeOn_1 = require_observeOn();
  var AsyncSubject_1 = require_AsyncSubject();
  function bindCallbackInternals(isNodeStyle, callbackFunc, resultSelector, scheduler) {
    if (resultSelector) {
      if (isScheduler_1.isScheduler(resultSelector)) {
        scheduler = resultSelector;
      } else {
        return function() {
          var args = [];
          for (var _i = 0;_i < arguments.length; _i++) {
            args[_i] = arguments[_i];
          }
          return bindCallbackInternals(isNodeStyle, callbackFunc, scheduler).apply(this, args).pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector));
        };
      }
    }
    if (scheduler) {
      return function() {
        var args = [];
        for (var _i = 0;_i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        return bindCallbackInternals(isNodeStyle, callbackFunc).apply(this, args).pipe(subscribeOn_1.subscribeOn(scheduler), observeOn_1.observeOn(scheduler));
      };
    }
    return function() {
      var _this = this;
      var args = [];
      for (var _i = 0;_i < arguments.length; _i++) {
        args[_i] = arguments[_i];
      }
      var subject = new AsyncSubject_1.AsyncSubject;
      var uninitialized = true;
      return new Observable_1.Observable(function(subscriber) {
        var subs = subject.subscribe(subscriber);
        if (uninitialized) {
          uninitialized = false;
          var isAsync_1 = false;
          var isComplete_1 = false;
          callbackFunc.apply(_this, __spreadArray(__spreadArray([], __read(args)), [
            function() {
              var results = [];
              for (var _i2 = 0;_i2 < arguments.length; _i2++) {
                results[_i2] = arguments[_i2];
              }
              if (isNodeStyle) {
                var err = results.shift();
                if (err != null) {
                  subject.error(err);
                  return;
                }
              }
              subject.next(1 < results.length ? results : results[0]);
              isComplete_1 = true;
              if (isAsync_1) {
                subject.complete();
              }
            }
          ]));
          if (isComplete_1) {
            subject.complete();
          }
          isAsync_1 = true;
        }
        return subs;
      });
    };
  }
  exports.bindCallbackInternals = bindCallbackInternals;
});

// node_modules/rxjs/dist/cjs/internal/observable/bindCallback.js
var require_bindCallback = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.bindCallback = undefined;
  var bindCallbackInternals_1 = require_bindCallbackInternals();
  function bindCallback(callbackFunc, resultSelector, scheduler) {
    return bindCallbackInternals_1.bindCallbackInternals(false, callbackFunc, resultSelector, scheduler);
  }
  exports.bindCallback = bindCallback;
});

// node_modules/rxjs/dist/cjs/internal/observable/bindNodeCallback.js
var require_bindNodeCallback = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.bindNodeCallback = undefined;
  var bindCallbackInternals_1 = require_bindCallbackInternals();
  function bindNodeCallback(callbackFunc, resultSelector, scheduler) {
    return bindCallbackInternals_1.bindCallbackInternals(true, callbackFunc, resultSelector, scheduler);
  }
  exports.bindNodeCallback = bindNodeCallback;
});

// node_modules/rxjs/dist/cjs/internal/util/argsArgArrayOrObject.js
var require_argsArgArrayOrObject = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.argsArgArrayOrObject = undefined;
  var isArray = Array.isArray;
  var getPrototypeOf = Object.getPrototypeOf;
  var objectProto = Object.prototype;
  var getKeys = Object.keys;
  function argsArgArrayOrObject(args) {
    if (args.length === 1) {
      var first_1 = args[0];
      if (isArray(first_1)) {
        return { args: first_1, keys: null };
      }
      if (isPOJO(first_1)) {
        var keys = getKeys(first_1);
        return {
          args: keys.map(function(key2) {
            return first_1[key2];
          }),
          keys
        };
      }
    }
    return { args, keys: null };
  }
  exports.argsArgArrayOrObject = argsArgArrayOrObject;
  function isPOJO(obj) {
    return obj && typeof obj === "object" && getPrototypeOf(obj) === objectProto;
  }
});

// node_modules/rxjs/dist/cjs/internal/util/createObject.js
var require_createObject = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createObject = undefined;
  function createObject(keys, values) {
    return keys.reduce(function(result, key2, i) {
      return result[key2] = values[i], result;
    }, {});
  }
  exports.createObject = createObject;
});

// node_modules/rxjs/dist/cjs/internal/observable/combineLatest.js
var require_combineLatest = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.combineLatestInit = exports.combineLatest = undefined;
  var Observable_1 = require_Observable();
  var argsArgArrayOrObject_1 = require_argsArgArrayOrObject();
  var from_1 = require_from();
  var identity_1 = require_identity();
  var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
  var args_1 = require_args();
  var createObject_1 = require_createObject();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var executeSchedule_1 = require_executeSchedule();
  function combineLatest() {
    var args = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var scheduler = args_1.popScheduler(args);
    var resultSelector = args_1.popResultSelector(args);
    var _a = argsArgArrayOrObject_1.argsArgArrayOrObject(args), observables = _a.args, keys = _a.keys;
    if (observables.length === 0) {
      return from_1.from([], scheduler);
    }
    var result = new Observable_1.Observable(combineLatestInit(observables, scheduler, keys ? function(values) {
      return createObject_1.createObject(keys, values);
    } : identity_1.identity));
    return resultSelector ? result.pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector)) : result;
  }
  exports.combineLatest = combineLatest;
  function combineLatestInit(observables, scheduler, valueTransform) {
    if (valueTransform === undefined) {
      valueTransform = identity_1.identity;
    }
    return function(subscriber) {
      maybeSchedule(scheduler, function() {
        var length = observables.length;
        var values = new Array(length);
        var active = length;
        var remainingFirstValues = length;
        var _loop_1 = function(i2) {
          maybeSchedule(scheduler, function() {
            var source = from_1.from(observables[i2], scheduler);
            var hasFirstValue = false;
            source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
              values[i2] = value;
              if (!hasFirstValue) {
                hasFirstValue = true;
                remainingFirstValues--;
              }
              if (!remainingFirstValues) {
                subscriber.next(valueTransform(values.slice()));
              }
            }, function() {
              if (!--active) {
                subscriber.complete();
              }
            }));
          }, subscriber);
        };
        for (var i = 0;i < length; i++) {
          _loop_1(i);
        }
      }, subscriber);
    };
  }
  exports.combineLatestInit = combineLatestInit;
  function maybeSchedule(scheduler, execute, subscription) {
    if (scheduler) {
      executeSchedule_1.executeSchedule(subscription, scheduler, execute);
    } else {
      execute();
    }
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/mergeInternals.js
var require_mergeInternals = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.mergeInternals = undefined;
  var innerFrom_1 = require_innerFrom();
  var executeSchedule_1 = require_executeSchedule();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function mergeInternals(source, subscriber, project, concurrent, onBeforeNext, expand, innerSubScheduler, additionalFinalizer) {
    var buffer = [];
    var active = 0;
    var index = 0;
    var isComplete = false;
    var checkComplete = function() {
      if (isComplete && !buffer.length && !active) {
        subscriber.complete();
      }
    };
    var outerNext = function(value) {
      return active < concurrent ? doInnerSub(value) : buffer.push(value);
    };
    var doInnerSub = function(value) {
      expand && subscriber.next(value);
      active++;
      var innerComplete = false;
      innerFrom_1.innerFrom(project(value, index++)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(innerValue) {
        onBeforeNext === null || onBeforeNext === undefined || onBeforeNext(innerValue);
        if (expand) {
          outerNext(innerValue);
        } else {
          subscriber.next(innerValue);
        }
      }, function() {
        innerComplete = true;
      }, undefined, function() {
        if (innerComplete) {
          try {
            active--;
            var _loop_1 = function() {
              var bufferedValue = buffer.shift();
              if (innerSubScheduler) {
                executeSchedule_1.executeSchedule(subscriber, innerSubScheduler, function() {
                  return doInnerSub(bufferedValue);
                });
              } else {
                doInnerSub(bufferedValue);
              }
            };
            while (buffer.length && active < concurrent) {
              _loop_1();
            }
            checkComplete();
          } catch (err) {
            subscriber.error(err);
          }
        }
      }));
    };
    source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, outerNext, function() {
      isComplete = true;
      checkComplete();
    }));
    return function() {
      additionalFinalizer === null || additionalFinalizer === undefined || additionalFinalizer();
    };
  }
  exports.mergeInternals = mergeInternals;
});

// node_modules/rxjs/dist/cjs/internal/operators/mergeMap.js
var require_mergeMap = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.mergeMap = undefined;
  var map_1 = require_map();
  var innerFrom_1 = require_innerFrom();
  var lift_1 = require_lift();
  var mergeInternals_1 = require_mergeInternals();
  var isFunction_1 = require_isFunction();
  function mergeMap(project, resultSelector, concurrent) {
    if (concurrent === undefined) {
      concurrent = Infinity;
    }
    if (isFunction_1.isFunction(resultSelector)) {
      return mergeMap(function(a, i) {
        return map_1.map(function(b, ii) {
          return resultSelector(a, b, i, ii);
        })(innerFrom_1.innerFrom(project(a, i)));
      }, concurrent);
    } else if (typeof resultSelector === "number") {
      concurrent = resultSelector;
    }
    return lift_1.operate(function(source, subscriber) {
      return mergeInternals_1.mergeInternals(source, subscriber, project, concurrent);
    });
  }
  exports.mergeMap = mergeMap;
});

// node_modules/rxjs/dist/cjs/internal/operators/mergeAll.js
var require_mergeAll = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.mergeAll = undefined;
  var mergeMap_1 = require_mergeMap();
  var identity_1 = require_identity();
  function mergeAll(concurrent) {
    if (concurrent === undefined) {
      concurrent = Infinity;
    }
    return mergeMap_1.mergeMap(identity_1.identity, concurrent);
  }
  exports.mergeAll = mergeAll;
});

// node_modules/rxjs/dist/cjs/internal/operators/concatAll.js
var require_concatAll = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.concatAll = undefined;
  var mergeAll_1 = require_mergeAll();
  function concatAll() {
    return mergeAll_1.mergeAll(1);
  }
  exports.concatAll = concatAll;
});

// node_modules/rxjs/dist/cjs/internal/observable/concat.js
var require_concat = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.concat = undefined;
  var concatAll_1 = require_concatAll();
  var args_1 = require_args();
  var from_1 = require_from();
  function concat() {
    var args = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    return concatAll_1.concatAll()(from_1.from(args, args_1.popScheduler(args)));
  }
  exports.concat = concat;
});

// node_modules/rxjs/dist/cjs/internal/observable/defer.js
var require_defer = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.defer = undefined;
  var Observable_1 = require_Observable();
  var innerFrom_1 = require_innerFrom();
  function defer(observableFactory) {
    return new Observable_1.Observable(function(subscriber) {
      innerFrom_1.innerFrom(observableFactory()).subscribe(subscriber);
    });
  }
  exports.defer = defer;
});

// node_modules/rxjs/dist/cjs/internal/observable/connectable.js
var require_connectable = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.connectable = undefined;
  var Subject_1 = require_Subject();
  var Observable_1 = require_Observable();
  var defer_1 = require_defer();
  var DEFAULT_CONFIG = {
    connector: function() {
      return new Subject_1.Subject;
    },
    resetOnDisconnect: true
  };
  function connectable(source, config) {
    if (config === undefined) {
      config = DEFAULT_CONFIG;
    }
    var connection = null;
    var { connector, resetOnDisconnect: _a } = config, resetOnDisconnect = _a === undefined ? true : _a;
    var subject = connector();
    var result = new Observable_1.Observable(function(subscriber) {
      return subject.subscribe(subscriber);
    });
    result.connect = function() {
      if (!connection || connection.closed) {
        connection = defer_1.defer(function() {
          return source;
        }).subscribe(subject);
        if (resetOnDisconnect) {
          connection.add(function() {
            return subject = connector();
          });
        }
      }
      return connection;
    };
    return result;
  }
  exports.connectable = connectable;
});

// node_modules/rxjs/dist/cjs/internal/observable/forkJoin.js
var require_forkJoin = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.forkJoin = undefined;
  var Observable_1 = require_Observable();
  var argsArgArrayOrObject_1 = require_argsArgArrayOrObject();
  var innerFrom_1 = require_innerFrom();
  var args_1 = require_args();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
  var createObject_1 = require_createObject();
  function forkJoin() {
    var args = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var resultSelector = args_1.popResultSelector(args);
    var _a = argsArgArrayOrObject_1.argsArgArrayOrObject(args), sources = _a.args, keys = _a.keys;
    var result = new Observable_1.Observable(function(subscriber) {
      var length = sources.length;
      if (!length) {
        subscriber.complete();
        return;
      }
      var values = new Array(length);
      var remainingCompletions = length;
      var remainingEmissions = length;
      var _loop_1 = function(sourceIndex2) {
        var hasValue = false;
        innerFrom_1.innerFrom(sources[sourceIndex2]).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          if (!hasValue) {
            hasValue = true;
            remainingEmissions--;
          }
          values[sourceIndex2] = value;
        }, function() {
          return remainingCompletions--;
        }, undefined, function() {
          if (!remainingCompletions || !hasValue) {
            if (!remainingEmissions) {
              subscriber.next(keys ? createObject_1.createObject(keys, values) : values);
            }
            subscriber.complete();
          }
        }));
      };
      for (var sourceIndex = 0;sourceIndex < length; sourceIndex++) {
        _loop_1(sourceIndex);
      }
    });
    return resultSelector ? result.pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector)) : result;
  }
  exports.forkJoin = forkJoin;
});

// node_modules/rxjs/dist/cjs/internal/observable/fromEvent.js
var require_fromEvent = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.fromEvent = undefined;
  var innerFrom_1 = require_innerFrom();
  var Observable_1 = require_Observable();
  var mergeMap_1 = require_mergeMap();
  var isArrayLike_1 = require_isArrayLike();
  var isFunction_1 = require_isFunction();
  var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
  var nodeEventEmitterMethods = ["addListener", "removeListener"];
  var eventTargetMethods = ["addEventListener", "removeEventListener"];
  var jqueryMethods = ["on", "off"];
  function fromEvent(target, eventName, options, resultSelector) {
    if (isFunction_1.isFunction(options)) {
      resultSelector = options;
      options = undefined;
    }
    if (resultSelector) {
      return fromEvent(target, eventName, options).pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector));
    }
    var _a = __read(isEventTarget(target) ? eventTargetMethods.map(function(methodName) {
      return function(handler) {
        return target[methodName](eventName, handler, options);
      };
    }) : isNodeStyleEventEmitter(target) ? nodeEventEmitterMethods.map(toCommonHandlerRegistry(target, eventName)) : isJQueryStyleEventEmitter(target) ? jqueryMethods.map(toCommonHandlerRegistry(target, eventName)) : [], 2), add = _a[0], remove = _a[1];
    if (!add) {
      if (isArrayLike_1.isArrayLike(target)) {
        return mergeMap_1.mergeMap(function(subTarget) {
          return fromEvent(subTarget, eventName, options);
        })(innerFrom_1.innerFrom(target));
      }
    }
    if (!add) {
      throw new TypeError("Invalid event target");
    }
    return new Observable_1.Observable(function(subscriber) {
      var handler = function() {
        var args = [];
        for (var _i = 0;_i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        return subscriber.next(1 < args.length ? args : args[0]);
      };
      add(handler);
      return function() {
        return remove(handler);
      };
    });
  }
  exports.fromEvent = fromEvent;
  function toCommonHandlerRegistry(target, eventName) {
    return function(methodName) {
      return function(handler) {
        return target[methodName](eventName, handler);
      };
    };
  }
  function isNodeStyleEventEmitter(target) {
    return isFunction_1.isFunction(target.addListener) && isFunction_1.isFunction(target.removeListener);
  }
  function isJQueryStyleEventEmitter(target) {
    return isFunction_1.isFunction(target.on) && isFunction_1.isFunction(target.off);
  }
  function isEventTarget(target) {
    return isFunction_1.isFunction(target.addEventListener) && isFunction_1.isFunction(target.removeEventListener);
  }
});

// node_modules/rxjs/dist/cjs/internal/observable/fromEventPattern.js
var require_fromEventPattern = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.fromEventPattern = undefined;
  var Observable_1 = require_Observable();
  var isFunction_1 = require_isFunction();
  var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
  function fromEventPattern(addHandler, removeHandler, resultSelector) {
    if (resultSelector) {
      return fromEventPattern(addHandler, removeHandler).pipe(mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector));
    }
    return new Observable_1.Observable(function(subscriber) {
      var handler = function() {
        var e = [];
        for (var _i = 0;_i < arguments.length; _i++) {
          e[_i] = arguments[_i];
        }
        return subscriber.next(e.length === 1 ? e[0] : e);
      };
      var retValue = addHandler(handler);
      return isFunction_1.isFunction(removeHandler) ? function() {
        return removeHandler(handler, retValue);
      } : undefined;
    });
  }
  exports.fromEventPattern = fromEventPattern;
});

// node_modules/rxjs/dist/cjs/internal/observable/generate.js
var require_generate = __commonJS((exports) => {
  var __generator = exports && exports.__generator || function(thisArg, body) {
    var _ = { label: 0, sent: function() {
      if (t[0] & 1)
        throw t[1];
      return t[1];
    }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), throw: verb(1), return: verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
      return this;
    }), g;
    function verb(n) {
      return function(v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f)
        throw new TypeError("Generator is already executing.");
      while (_)
        try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done)
            return t;
          if (y = 0, t)
            op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2])
                _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5)
        throw op[1];
      return { value: op[0] ? op[1] : undefined, done: true };
    }
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.generate = undefined;
  var identity_1 = require_identity();
  var isScheduler_1 = require_isScheduler();
  var defer_1 = require_defer();
  var scheduleIterable_1 = require_scheduleIterable();
  function generate(initialStateOrOptions, condition, iterate, resultSelectorOrScheduler, scheduler) {
    var _a, _b;
    var resultSelector;
    var initialState;
    if (arguments.length === 1) {
      _a = initialStateOrOptions, initialState = _a.initialState, condition = _a.condition, iterate = _a.iterate, _b = _a.resultSelector, resultSelector = _b === undefined ? identity_1.identity : _b, scheduler = _a.scheduler;
    } else {
      initialState = initialStateOrOptions;
      if (!resultSelectorOrScheduler || isScheduler_1.isScheduler(resultSelectorOrScheduler)) {
        resultSelector = identity_1.identity;
        scheduler = resultSelectorOrScheduler;
      } else {
        resultSelector = resultSelectorOrScheduler;
      }
    }
    function gen() {
      var state;
      return __generator(this, function(_a2) {
        switch (_a2.label) {
          case 0:
            state = initialState;
            _a2.label = 1;
          case 1:
            if (!(!condition || condition(state)))
              return [3, 4];
            return [4, resultSelector(state)];
          case 2:
            _a2.sent();
            _a2.label = 3;
          case 3:
            state = iterate(state);
            return [3, 1];
          case 4:
            return [2];
        }
      });
    }
    return defer_1.defer(scheduler ? function() {
      return scheduleIterable_1.scheduleIterable(gen(), scheduler);
    } : gen);
  }
  exports.generate = generate;
});

// node_modules/rxjs/dist/cjs/internal/observable/iif.js
var require_iif = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.iif = undefined;
  var defer_1 = require_defer();
  function iif(condition, trueResult, falseResult) {
    return defer_1.defer(function() {
      return condition() ? trueResult : falseResult;
    });
  }
  exports.iif = iif;
});

// node_modules/rxjs/dist/cjs/internal/observable/timer.js
var require_timer = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.timer = undefined;
  var Observable_1 = require_Observable();
  var async_1 = require_async();
  var isScheduler_1 = require_isScheduler();
  var isDate_1 = require_isDate();
  function timer(dueTime, intervalOrScheduler, scheduler) {
    if (dueTime === undefined) {
      dueTime = 0;
    }
    if (scheduler === undefined) {
      scheduler = async_1.async;
    }
    var intervalDuration = -1;
    if (intervalOrScheduler != null) {
      if (isScheduler_1.isScheduler(intervalOrScheduler)) {
        scheduler = intervalOrScheduler;
      } else {
        intervalDuration = intervalOrScheduler;
      }
    }
    return new Observable_1.Observable(function(subscriber) {
      var due = isDate_1.isValidDate(dueTime) ? +dueTime - scheduler.now() : dueTime;
      if (due < 0) {
        due = 0;
      }
      var n = 0;
      return scheduler.schedule(function() {
        if (!subscriber.closed) {
          subscriber.next(n++);
          if (0 <= intervalDuration) {
            this.schedule(undefined, intervalDuration);
          } else {
            subscriber.complete();
          }
        }
      }, due);
    });
  }
  exports.timer = timer;
});

// node_modules/rxjs/dist/cjs/internal/observable/interval.js
var require_interval = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.interval = undefined;
  var async_1 = require_async();
  var timer_1 = require_timer();
  function interval(period, scheduler) {
    if (period === undefined) {
      period = 0;
    }
    if (scheduler === undefined) {
      scheduler = async_1.asyncScheduler;
    }
    if (period < 0) {
      period = 0;
    }
    return timer_1.timer(period, period, scheduler);
  }
  exports.interval = interval;
});

// node_modules/rxjs/dist/cjs/internal/observable/merge.js
var require_merge = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.merge = undefined;
  var mergeAll_1 = require_mergeAll();
  var innerFrom_1 = require_innerFrom();
  var empty_1 = require_empty2();
  var args_1 = require_args();
  var from_1 = require_from();
  function merge() {
    var args = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var scheduler = args_1.popScheduler(args);
    var concurrent = args_1.popNumber(args, Infinity);
    var sources = args;
    return !sources.length ? empty_1.EMPTY : sources.length === 1 ? innerFrom_1.innerFrom(sources[0]) : mergeAll_1.mergeAll(concurrent)(from_1.from(sources, scheduler));
  }
  exports.merge = merge;
});

// node_modules/rxjs/dist/cjs/internal/observable/never.js
var require_never = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.never = exports.NEVER = undefined;
  var Observable_1 = require_Observable();
  var noop_1 = require_noop();
  exports.NEVER = new Observable_1.Observable(noop_1.noop);
  function never() {
    return exports.NEVER;
  }
  exports.never = never;
});

// node_modules/rxjs/dist/cjs/internal/util/argsOrArgArray.js
var require_argsOrArgArray = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.argsOrArgArray = undefined;
  var isArray = Array.isArray;
  function argsOrArgArray(args) {
    return args.length === 1 && isArray(args[0]) ? args[0] : args;
  }
  exports.argsOrArgArray = argsOrArgArray;
});

// node_modules/rxjs/dist/cjs/internal/observable/onErrorResumeNext.js
var require_onErrorResumeNext = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.onErrorResumeNext = undefined;
  var Observable_1 = require_Observable();
  var argsOrArgArray_1 = require_argsOrArgArray();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var noop_1 = require_noop();
  var innerFrom_1 = require_innerFrom();
  function onErrorResumeNext() {
    var sources = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      sources[_i] = arguments[_i];
    }
    var nextSources = argsOrArgArray_1.argsOrArgArray(sources);
    return new Observable_1.Observable(function(subscriber) {
      var sourceIndex = 0;
      var subscribeNext = function() {
        if (sourceIndex < nextSources.length) {
          var nextSource = undefined;
          try {
            nextSource = innerFrom_1.innerFrom(nextSources[sourceIndex++]);
          } catch (err) {
            subscribeNext();
            return;
          }
          var innerSubscriber = new OperatorSubscriber_1.OperatorSubscriber(subscriber, undefined, noop_1.noop, noop_1.noop);
          nextSource.subscribe(innerSubscriber);
          innerSubscriber.add(subscribeNext);
        } else {
          subscriber.complete();
        }
      };
      subscribeNext();
    });
  }
  exports.onErrorResumeNext = onErrorResumeNext;
});

// node_modules/rxjs/dist/cjs/internal/observable/pairs.js
var require_pairs = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.pairs = undefined;
  var from_1 = require_from();
  function pairs(obj, scheduler) {
    return from_1.from(Object.entries(obj), scheduler);
  }
  exports.pairs = pairs;
});

// node_modules/rxjs/dist/cjs/internal/util/not.js
var require_not = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.not = undefined;
  function not(pred, thisArg) {
    return function(value, index) {
      return !pred.call(thisArg, value, index);
    };
  }
  exports.not = not;
});

// node_modules/rxjs/dist/cjs/internal/operators/filter.js
var require_filter = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.filter = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function filter(predicate, thisArg) {
    return lift_1.operate(function(source, subscriber) {
      var index = 0;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        return predicate.call(thisArg, value, index++) && subscriber.next(value);
      }));
    });
  }
  exports.filter = filter;
});

// node_modules/rxjs/dist/cjs/internal/observable/partition.js
var require_partition = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.partition = undefined;
  var not_1 = require_not();
  var filter_1 = require_filter();
  var innerFrom_1 = require_innerFrom();
  function partition(source, predicate, thisArg) {
    return [filter_1.filter(predicate, thisArg)(innerFrom_1.innerFrom(source)), filter_1.filter(not_1.not(predicate, thisArg))(innerFrom_1.innerFrom(source))];
  }
  exports.partition = partition;
});

// node_modules/rxjs/dist/cjs/internal/observable/race.js
var require_race = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.raceInit = exports.race = undefined;
  var Observable_1 = require_Observable();
  var innerFrom_1 = require_innerFrom();
  var argsOrArgArray_1 = require_argsOrArgArray();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function race() {
    var sources = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      sources[_i] = arguments[_i];
    }
    sources = argsOrArgArray_1.argsOrArgArray(sources);
    return sources.length === 1 ? innerFrom_1.innerFrom(sources[0]) : new Observable_1.Observable(raceInit(sources));
  }
  exports.race = race;
  function raceInit(sources) {
    return function(subscriber) {
      var subscriptions = [];
      var _loop_1 = function(i2) {
        subscriptions.push(innerFrom_1.innerFrom(sources[i2]).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          if (subscriptions) {
            for (var s = 0;s < subscriptions.length; s++) {
              s !== i2 && subscriptions[s].unsubscribe();
            }
            subscriptions = null;
          }
          subscriber.next(value);
        })));
      };
      for (var i = 0;subscriptions && !subscriber.closed && i < sources.length; i++) {
        _loop_1(i);
      }
    };
  }
  exports.raceInit = raceInit;
});

// node_modules/rxjs/dist/cjs/internal/observable/range.js
var require_range = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.range = undefined;
  var Observable_1 = require_Observable();
  var empty_1 = require_empty2();
  function range(start, count, scheduler) {
    if (count == null) {
      count = start;
      start = 0;
    }
    if (count <= 0) {
      return empty_1.EMPTY;
    }
    var end = count + start;
    return new Observable_1.Observable(scheduler ? function(subscriber) {
      var n = start;
      return scheduler.schedule(function() {
        if (n < end) {
          subscriber.next(n++);
          this.schedule();
        } else {
          subscriber.complete();
        }
      });
    } : function(subscriber) {
      var n = start;
      while (n < end && !subscriber.closed) {
        subscriber.next(n++);
      }
      subscriber.complete();
    });
  }
  exports.range = range;
});

// node_modules/rxjs/dist/cjs/internal/observable/using.js
var require_using = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.using = undefined;
  var Observable_1 = require_Observable();
  var innerFrom_1 = require_innerFrom();
  var empty_1 = require_empty2();
  function using(resourceFactory, observableFactory) {
    return new Observable_1.Observable(function(subscriber) {
      var resource = resourceFactory();
      var result = observableFactory(resource);
      var source = result ? innerFrom_1.innerFrom(result) : empty_1.EMPTY;
      source.subscribe(subscriber);
      return function() {
        if (resource) {
          resource.unsubscribe();
        }
      };
    });
  }
  exports.using = using;
});

// node_modules/rxjs/dist/cjs/internal/observable/zip.js
var require_zip = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.zip = undefined;
  var Observable_1 = require_Observable();
  var innerFrom_1 = require_innerFrom();
  var argsOrArgArray_1 = require_argsOrArgArray();
  var empty_1 = require_empty2();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var args_1 = require_args();
  function zip() {
    var args = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var resultSelector = args_1.popResultSelector(args);
    var sources = argsOrArgArray_1.argsOrArgArray(args);
    return sources.length ? new Observable_1.Observable(function(subscriber) {
      var buffers = sources.map(function() {
        return [];
      });
      var completed = sources.map(function() {
        return false;
      });
      subscriber.add(function() {
        buffers = completed = null;
      });
      var _loop_1 = function(sourceIndex2) {
        innerFrom_1.innerFrom(sources[sourceIndex2]).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          buffers[sourceIndex2].push(value);
          if (buffers.every(function(buffer) {
            return buffer.length;
          })) {
            var result = buffers.map(function(buffer) {
              return buffer.shift();
            });
            subscriber.next(resultSelector ? resultSelector.apply(undefined, __spreadArray([], __read(result))) : result);
            if (buffers.some(function(buffer, i) {
              return !buffer.length && completed[i];
            })) {
              subscriber.complete();
            }
          }
        }, function() {
          completed[sourceIndex2] = true;
          !buffers[sourceIndex2].length && subscriber.complete();
        }));
      };
      for (var sourceIndex = 0;!subscriber.closed && sourceIndex < sources.length; sourceIndex++) {
        _loop_1(sourceIndex);
      }
      return function() {
        buffers = completed = null;
      };
    }) : empty_1.EMPTY;
  }
  exports.zip = zip;
});

// node_modules/rxjs/dist/cjs/internal/types.js
var require_types = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
});

// node_modules/rxjs/dist/cjs/internal/operators/audit.js
var require_audit = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.audit = undefined;
  var lift_1 = require_lift();
  var innerFrom_1 = require_innerFrom();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function audit(durationSelector) {
    return lift_1.operate(function(source, subscriber) {
      var hasValue = false;
      var lastValue = null;
      var durationSubscriber = null;
      var isComplete = false;
      var endDuration = function() {
        durationSubscriber === null || durationSubscriber === undefined || durationSubscriber.unsubscribe();
        durationSubscriber = null;
        if (hasValue) {
          hasValue = false;
          var value = lastValue;
          lastValue = null;
          subscriber.next(value);
        }
        isComplete && subscriber.complete();
      };
      var cleanupDuration = function() {
        durationSubscriber = null;
        isComplete && subscriber.complete();
      };
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        hasValue = true;
        lastValue = value;
        if (!durationSubscriber) {
          innerFrom_1.innerFrom(durationSelector(value)).subscribe(durationSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, endDuration, cleanupDuration));
        }
      }, function() {
        isComplete = true;
        (!hasValue || !durationSubscriber || durationSubscriber.closed) && subscriber.complete();
      }));
    });
  }
  exports.audit = audit;
});

// node_modules/rxjs/dist/cjs/internal/operators/auditTime.js
var require_auditTime = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.auditTime = undefined;
  var async_1 = require_async();
  var audit_1 = require_audit();
  var timer_1 = require_timer();
  function auditTime(duration, scheduler) {
    if (scheduler === undefined) {
      scheduler = async_1.asyncScheduler;
    }
    return audit_1.audit(function() {
      return timer_1.timer(duration, scheduler);
    });
  }
  exports.auditTime = auditTime;
});

// node_modules/rxjs/dist/cjs/internal/operators/buffer.js
var require_buffer = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.buffer = undefined;
  var lift_1 = require_lift();
  var noop_1 = require_noop();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var innerFrom_1 = require_innerFrom();
  function buffer(closingNotifier) {
    return lift_1.operate(function(source, subscriber) {
      var currentBuffer = [];
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        return currentBuffer.push(value);
      }, function() {
        subscriber.next(currentBuffer);
        subscriber.complete();
      }));
      innerFrom_1.innerFrom(closingNotifier).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
        var b = currentBuffer;
        currentBuffer = [];
        subscriber.next(b);
      }, noop_1.noop));
      return function() {
        currentBuffer = null;
      };
    });
  }
  exports.buffer = buffer;
});

// node_modules/rxjs/dist/cjs/internal/operators/bufferCount.js
var require_bufferCount = __commonJS((exports) => {
  var __values = exports && exports.__values || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m)
      return m.call(o);
    if (o && typeof o.length === "number")
      return {
        next: function() {
          if (o && i >= o.length)
            o = undefined;
          return { value: o && o[i++], done: !o };
        }
      };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.bufferCount = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var arrRemove_1 = require_arrRemove();
  function bufferCount(bufferSize, startBufferEvery) {
    if (startBufferEvery === undefined) {
      startBufferEvery = null;
    }
    startBufferEvery = startBufferEvery !== null && startBufferEvery !== undefined ? startBufferEvery : bufferSize;
    return lift_1.operate(function(source, subscriber) {
      var buffers = [];
      var count = 0;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        var e_1, _a, e_2, _b;
        var toEmit = null;
        if (count++ % startBufferEvery === 0) {
          buffers.push([]);
        }
        try {
          for (var buffers_1 = __values(buffers), buffers_1_1 = buffers_1.next();!buffers_1_1.done; buffers_1_1 = buffers_1.next()) {
            var buffer = buffers_1_1.value;
            buffer.push(value);
            if (bufferSize <= buffer.length) {
              toEmit = toEmit !== null && toEmit !== undefined ? toEmit : [];
              toEmit.push(buffer);
            }
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (buffers_1_1 && !buffers_1_1.done && (_a = buffers_1.return))
              _a.call(buffers_1);
          } finally {
            if (e_1)
              throw e_1.error;
          }
        }
        if (toEmit) {
          try {
            for (var toEmit_1 = __values(toEmit), toEmit_1_1 = toEmit_1.next();!toEmit_1_1.done; toEmit_1_1 = toEmit_1.next()) {
              var buffer = toEmit_1_1.value;
              arrRemove_1.arrRemove(buffers, buffer);
              subscriber.next(buffer);
            }
          } catch (e_2_1) {
            e_2 = { error: e_2_1 };
          } finally {
            try {
              if (toEmit_1_1 && !toEmit_1_1.done && (_b = toEmit_1.return))
                _b.call(toEmit_1);
            } finally {
              if (e_2)
                throw e_2.error;
            }
          }
        }
      }, function() {
        var e_3, _a;
        try {
          for (var buffers_2 = __values(buffers), buffers_2_1 = buffers_2.next();!buffers_2_1.done; buffers_2_1 = buffers_2.next()) {
            var buffer = buffers_2_1.value;
            subscriber.next(buffer);
          }
        } catch (e_3_1) {
          e_3 = { error: e_3_1 };
        } finally {
          try {
            if (buffers_2_1 && !buffers_2_1.done && (_a = buffers_2.return))
              _a.call(buffers_2);
          } finally {
            if (e_3)
              throw e_3.error;
          }
        }
        subscriber.complete();
      }, undefined, function() {
        buffers = null;
      }));
    });
  }
  exports.bufferCount = bufferCount;
});

// node_modules/rxjs/dist/cjs/internal/operators/bufferTime.js
var require_bufferTime = __commonJS((exports) => {
  var __values = exports && exports.__values || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m)
      return m.call(o);
    if (o && typeof o.length === "number")
      return {
        next: function() {
          if (o && i >= o.length)
            o = undefined;
          return { value: o && o[i++], done: !o };
        }
      };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.bufferTime = undefined;
  var Subscription_1 = require_Subscription();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var arrRemove_1 = require_arrRemove();
  var async_1 = require_async();
  var args_1 = require_args();
  var executeSchedule_1 = require_executeSchedule();
  function bufferTime(bufferTimeSpan) {
    var _a, _b;
    var otherArgs = [];
    for (var _i = 1;_i < arguments.length; _i++) {
      otherArgs[_i - 1] = arguments[_i];
    }
    var scheduler = (_a = args_1.popScheduler(otherArgs)) !== null && _a !== undefined ? _a : async_1.asyncScheduler;
    var bufferCreationInterval = (_b = otherArgs[0]) !== null && _b !== undefined ? _b : null;
    var maxBufferSize = otherArgs[1] || Infinity;
    return lift_1.operate(function(source, subscriber) {
      var bufferRecords = [];
      var restartOnEmit = false;
      var emit = function(record) {
        var { buffer, subs } = record;
        subs.unsubscribe();
        arrRemove_1.arrRemove(bufferRecords, record);
        subscriber.next(buffer);
        restartOnEmit && startBuffer();
      };
      var startBuffer = function() {
        if (bufferRecords) {
          var subs = new Subscription_1.Subscription;
          subscriber.add(subs);
          var buffer = [];
          var record_1 = {
            buffer,
            subs
          };
          bufferRecords.push(record_1);
          executeSchedule_1.executeSchedule(subs, scheduler, function() {
            return emit(record_1);
          }, bufferTimeSpan);
        }
      };
      if (bufferCreationInterval !== null && bufferCreationInterval >= 0) {
        executeSchedule_1.executeSchedule(subscriber, scheduler, startBuffer, bufferCreationInterval, true);
      } else {
        restartOnEmit = true;
      }
      startBuffer();
      var bufferTimeSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        var e_1, _a2;
        var recordsCopy = bufferRecords.slice();
        try {
          for (var recordsCopy_1 = __values(recordsCopy), recordsCopy_1_1 = recordsCopy_1.next();!recordsCopy_1_1.done; recordsCopy_1_1 = recordsCopy_1.next()) {
            var record = recordsCopy_1_1.value;
            var buffer = record.buffer;
            buffer.push(value);
            maxBufferSize <= buffer.length && emit(record);
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (recordsCopy_1_1 && !recordsCopy_1_1.done && (_a2 = recordsCopy_1.return))
              _a2.call(recordsCopy_1);
          } finally {
            if (e_1)
              throw e_1.error;
          }
        }
      }, function() {
        while (bufferRecords === null || bufferRecords === undefined ? undefined : bufferRecords.length) {
          subscriber.next(bufferRecords.shift().buffer);
        }
        bufferTimeSubscriber === null || bufferTimeSubscriber === undefined || bufferTimeSubscriber.unsubscribe();
        subscriber.complete();
        subscriber.unsubscribe();
      }, undefined, function() {
        return bufferRecords = null;
      });
      source.subscribe(bufferTimeSubscriber);
    });
  }
  exports.bufferTime = bufferTime;
});

// node_modules/rxjs/dist/cjs/internal/operators/bufferToggle.js
var require_bufferToggle = __commonJS((exports) => {
  var __values = exports && exports.__values || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m)
      return m.call(o);
    if (o && typeof o.length === "number")
      return {
        next: function() {
          if (o && i >= o.length)
            o = undefined;
          return { value: o && o[i++], done: !o };
        }
      };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.bufferToggle = undefined;
  var Subscription_1 = require_Subscription();
  var lift_1 = require_lift();
  var innerFrom_1 = require_innerFrom();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var noop_1 = require_noop();
  var arrRemove_1 = require_arrRemove();
  function bufferToggle(openings, closingSelector) {
    return lift_1.operate(function(source, subscriber) {
      var buffers = [];
      innerFrom_1.innerFrom(openings).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(openValue) {
        var buffer = [];
        buffers.push(buffer);
        var closingSubscription = new Subscription_1.Subscription;
        var emitBuffer = function() {
          arrRemove_1.arrRemove(buffers, buffer);
          subscriber.next(buffer);
          closingSubscription.unsubscribe();
        };
        closingSubscription.add(innerFrom_1.innerFrom(closingSelector(openValue)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, emitBuffer, noop_1.noop)));
      }, noop_1.noop));
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        var e_1, _a;
        try {
          for (var buffers_1 = __values(buffers), buffers_1_1 = buffers_1.next();!buffers_1_1.done; buffers_1_1 = buffers_1.next()) {
            var buffer = buffers_1_1.value;
            buffer.push(value);
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (buffers_1_1 && !buffers_1_1.done && (_a = buffers_1.return))
              _a.call(buffers_1);
          } finally {
            if (e_1)
              throw e_1.error;
          }
        }
      }, function() {
        while (buffers.length > 0) {
          subscriber.next(buffers.shift());
        }
        subscriber.complete();
      }));
    });
  }
  exports.bufferToggle = bufferToggle;
});

// node_modules/rxjs/dist/cjs/internal/operators/bufferWhen.js
var require_bufferWhen = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.bufferWhen = undefined;
  var lift_1 = require_lift();
  var noop_1 = require_noop();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var innerFrom_1 = require_innerFrom();
  function bufferWhen(closingSelector) {
    return lift_1.operate(function(source, subscriber) {
      var buffer = null;
      var closingSubscriber = null;
      var openBuffer = function() {
        closingSubscriber === null || closingSubscriber === undefined || closingSubscriber.unsubscribe();
        var b = buffer;
        buffer = [];
        b && subscriber.next(b);
        innerFrom_1.innerFrom(closingSelector()).subscribe(closingSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, openBuffer, noop_1.noop));
      };
      openBuffer();
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        return buffer === null || buffer === undefined ? undefined : buffer.push(value);
      }, function() {
        buffer && subscriber.next(buffer);
        subscriber.complete();
      }, undefined, function() {
        return buffer = closingSubscriber = null;
      }));
    });
  }
  exports.bufferWhen = bufferWhen;
});

// node_modules/rxjs/dist/cjs/internal/operators/catchError.js
var require_catchError = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.catchError = undefined;
  var innerFrom_1 = require_innerFrom();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var lift_1 = require_lift();
  function catchError(selector) {
    return lift_1.operate(function(source, subscriber) {
      var innerSub = null;
      var syncUnsub = false;
      var handledResult;
      innerSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, undefined, undefined, function(err) {
        handledResult = innerFrom_1.innerFrom(selector(err, catchError(selector)(source)));
        if (innerSub) {
          innerSub.unsubscribe();
          innerSub = null;
          handledResult.subscribe(subscriber);
        } else {
          syncUnsub = true;
        }
      }));
      if (syncUnsub) {
        innerSub.unsubscribe();
        innerSub = null;
        handledResult.subscribe(subscriber);
      }
    });
  }
  exports.catchError = catchError;
});

// node_modules/rxjs/dist/cjs/internal/operators/scanInternals.js
var require_scanInternals = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.scanInternals = undefined;
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function scanInternals(accumulator, seed, hasSeed, emitOnNext, emitBeforeComplete) {
    return function(source, subscriber) {
      var hasState = hasSeed;
      var state = seed;
      var index = 0;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        var i = index++;
        state = hasState ? accumulator(state, value, i) : (hasState = true, value);
        emitOnNext && subscriber.next(state);
      }, emitBeforeComplete && function() {
        hasState && subscriber.next(state);
        subscriber.complete();
      }));
    };
  }
  exports.scanInternals = scanInternals;
});

// node_modules/rxjs/dist/cjs/internal/operators/reduce.js
var require_reduce = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.reduce = undefined;
  var scanInternals_1 = require_scanInternals();
  var lift_1 = require_lift();
  function reduce(accumulator, seed) {
    return lift_1.operate(scanInternals_1.scanInternals(accumulator, seed, arguments.length >= 2, false, true));
  }
  exports.reduce = reduce;
});

// node_modules/rxjs/dist/cjs/internal/operators/toArray.js
var require_toArray = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.toArray = undefined;
  var reduce_1 = require_reduce();
  var lift_1 = require_lift();
  var arrReducer = function(arr, value) {
    return arr.push(value), arr;
  };
  function toArray() {
    return lift_1.operate(function(source, subscriber) {
      reduce_1.reduce(arrReducer, [])(source).subscribe(subscriber);
    });
  }
  exports.toArray = toArray;
});

// node_modules/rxjs/dist/cjs/internal/operators/joinAllInternals.js
var require_joinAllInternals = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.joinAllInternals = undefined;
  var identity_1 = require_identity();
  var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
  var pipe_1 = require_pipe();
  var mergeMap_1 = require_mergeMap();
  var toArray_1 = require_toArray();
  function joinAllInternals(joinFn, project) {
    return pipe_1.pipe(toArray_1.toArray(), mergeMap_1.mergeMap(function(sources) {
      return joinFn(sources);
    }), project ? mapOneOrManyArgs_1.mapOneOrManyArgs(project) : identity_1.identity);
  }
  exports.joinAllInternals = joinAllInternals;
});

// node_modules/rxjs/dist/cjs/internal/operators/combineLatestAll.js
var require_combineLatestAll = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.combineLatestAll = undefined;
  var combineLatest_1 = require_combineLatest();
  var joinAllInternals_1 = require_joinAllInternals();
  function combineLatestAll(project) {
    return joinAllInternals_1.joinAllInternals(combineLatest_1.combineLatest, project);
  }
  exports.combineLatestAll = combineLatestAll;
});

// node_modules/rxjs/dist/cjs/internal/operators/combineAll.js
var require_combineAll = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.combineAll = undefined;
  var combineLatestAll_1 = require_combineLatestAll();
  exports.combineAll = combineLatestAll_1.combineLatestAll;
});

// node_modules/rxjs/dist/cjs/internal/operators/combineLatest.js
var require_combineLatest2 = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.combineLatest = undefined;
  var combineLatest_1 = require_combineLatest();
  var lift_1 = require_lift();
  var argsOrArgArray_1 = require_argsOrArgArray();
  var mapOneOrManyArgs_1 = require_mapOneOrManyArgs();
  var pipe_1 = require_pipe();
  var args_1 = require_args();
  function combineLatest() {
    var args = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var resultSelector = args_1.popResultSelector(args);
    return resultSelector ? pipe_1.pipe(combineLatest.apply(undefined, __spreadArray([], __read(args))), mapOneOrManyArgs_1.mapOneOrManyArgs(resultSelector)) : lift_1.operate(function(source, subscriber) {
      combineLatest_1.combineLatestInit(__spreadArray([source], __read(argsOrArgArray_1.argsOrArgArray(args))))(subscriber);
    });
  }
  exports.combineLatest = combineLatest;
});

// node_modules/rxjs/dist/cjs/internal/operators/combineLatestWith.js
var require_combineLatestWith = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.combineLatestWith = undefined;
  var combineLatest_1 = require_combineLatest2();
  function combineLatestWith() {
    var otherSources = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      otherSources[_i] = arguments[_i];
    }
    return combineLatest_1.combineLatest.apply(undefined, __spreadArray([], __read(otherSources)));
  }
  exports.combineLatestWith = combineLatestWith;
});

// node_modules/rxjs/dist/cjs/internal/operators/concatMap.js
var require_concatMap = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.concatMap = undefined;
  var mergeMap_1 = require_mergeMap();
  var isFunction_1 = require_isFunction();
  function concatMap(project, resultSelector) {
    return isFunction_1.isFunction(resultSelector) ? mergeMap_1.mergeMap(project, resultSelector, 1) : mergeMap_1.mergeMap(project, 1);
  }
  exports.concatMap = concatMap;
});

// node_modules/rxjs/dist/cjs/internal/operators/concatMapTo.js
var require_concatMapTo = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.concatMapTo = undefined;
  var concatMap_1 = require_concatMap();
  var isFunction_1 = require_isFunction();
  function concatMapTo(innerObservable, resultSelector) {
    return isFunction_1.isFunction(resultSelector) ? concatMap_1.concatMap(function() {
      return innerObservable;
    }, resultSelector) : concatMap_1.concatMap(function() {
      return innerObservable;
    });
  }
  exports.concatMapTo = concatMapTo;
});

// node_modules/rxjs/dist/cjs/internal/operators/concat.js
var require_concat2 = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.concat = undefined;
  var lift_1 = require_lift();
  var concatAll_1 = require_concatAll();
  var args_1 = require_args();
  var from_1 = require_from();
  function concat() {
    var args = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var scheduler = args_1.popScheduler(args);
    return lift_1.operate(function(source, subscriber) {
      concatAll_1.concatAll()(from_1.from(__spreadArray([source], __read(args)), scheduler)).subscribe(subscriber);
    });
  }
  exports.concat = concat;
});

// node_modules/rxjs/dist/cjs/internal/operators/concatWith.js
var require_concatWith = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.concatWith = undefined;
  var concat_1 = require_concat2();
  function concatWith() {
    var otherSources = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      otherSources[_i] = arguments[_i];
    }
    return concat_1.concat.apply(undefined, __spreadArray([], __read(otherSources)));
  }
  exports.concatWith = concatWith;
});

// node_modules/rxjs/dist/cjs/internal/observable/fromSubscribable.js
var require_fromSubscribable = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.fromSubscribable = undefined;
  var Observable_1 = require_Observable();
  function fromSubscribable(subscribable) {
    return new Observable_1.Observable(function(subscriber) {
      return subscribable.subscribe(subscriber);
    });
  }
  exports.fromSubscribable = fromSubscribable;
});

// node_modules/rxjs/dist/cjs/internal/operators/connect.js
var require_connect = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.connect = undefined;
  var Subject_1 = require_Subject();
  var innerFrom_1 = require_innerFrom();
  var lift_1 = require_lift();
  var fromSubscribable_1 = require_fromSubscribable();
  var DEFAULT_CONFIG = {
    connector: function() {
      return new Subject_1.Subject;
    }
  };
  function connect(selector, config) {
    if (config === undefined) {
      config = DEFAULT_CONFIG;
    }
    var connector = config.connector;
    return lift_1.operate(function(source, subscriber) {
      var subject = connector();
      innerFrom_1.innerFrom(selector(fromSubscribable_1.fromSubscribable(subject))).subscribe(subscriber);
      subscriber.add(source.subscribe(subject));
    });
  }
  exports.connect = connect;
});

// node_modules/rxjs/dist/cjs/internal/operators/count.js
var require_count = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.count = undefined;
  var reduce_1 = require_reduce();
  function count(predicate) {
    return reduce_1.reduce(function(total, value, i) {
      return !predicate || predicate(value, i) ? total + 1 : total;
    }, 0);
  }
  exports.count = count;
});

// node_modules/rxjs/dist/cjs/internal/operators/debounce.js
var require_debounce = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.debounce = undefined;
  var lift_1 = require_lift();
  var noop_1 = require_noop();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var innerFrom_1 = require_innerFrom();
  function debounce(durationSelector) {
    return lift_1.operate(function(source, subscriber) {
      var hasValue = false;
      var lastValue = null;
      var durationSubscriber = null;
      var emit = function() {
        durationSubscriber === null || durationSubscriber === undefined || durationSubscriber.unsubscribe();
        durationSubscriber = null;
        if (hasValue) {
          hasValue = false;
          var value = lastValue;
          lastValue = null;
          subscriber.next(value);
        }
      };
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        durationSubscriber === null || durationSubscriber === undefined || durationSubscriber.unsubscribe();
        hasValue = true;
        lastValue = value;
        durationSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, emit, noop_1.noop);
        innerFrom_1.innerFrom(durationSelector(value)).subscribe(durationSubscriber);
      }, function() {
        emit();
        subscriber.complete();
      }, undefined, function() {
        lastValue = durationSubscriber = null;
      }));
    });
  }
  exports.debounce = debounce;
});

// node_modules/rxjs/dist/cjs/internal/operators/debounceTime.js
var require_debounceTime = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.debounceTime = undefined;
  var async_1 = require_async();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function debounceTime(dueTime, scheduler) {
    if (scheduler === undefined) {
      scheduler = async_1.asyncScheduler;
    }
    return lift_1.operate(function(source, subscriber) {
      var activeTask = null;
      var lastValue = null;
      var lastTime = null;
      var emit = function() {
        if (activeTask) {
          activeTask.unsubscribe();
          activeTask = null;
          var value = lastValue;
          lastValue = null;
          subscriber.next(value);
        }
      };
      function emitWhenIdle() {
        var targetTime = lastTime + dueTime;
        var now = scheduler.now();
        if (now < targetTime) {
          activeTask = this.schedule(undefined, targetTime - now);
          subscriber.add(activeTask);
          return;
        }
        emit();
      }
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        lastValue = value;
        lastTime = scheduler.now();
        if (!activeTask) {
          activeTask = scheduler.schedule(emitWhenIdle, dueTime);
          subscriber.add(activeTask);
        }
      }, function() {
        emit();
        subscriber.complete();
      }, undefined, function() {
        lastValue = activeTask = null;
      }));
    });
  }
  exports.debounceTime = debounceTime;
});

// node_modules/rxjs/dist/cjs/internal/operators/defaultIfEmpty.js
var require_defaultIfEmpty = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.defaultIfEmpty = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function defaultIfEmpty(defaultValue) {
    return lift_1.operate(function(source, subscriber) {
      var hasValue = false;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        hasValue = true;
        subscriber.next(value);
      }, function() {
        if (!hasValue) {
          subscriber.next(defaultValue);
        }
        subscriber.complete();
      }));
    });
  }
  exports.defaultIfEmpty = defaultIfEmpty;
});

// node_modules/rxjs/dist/cjs/internal/operators/take.js
var require_take = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.take = undefined;
  var empty_1 = require_empty2();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function take(count) {
    return count <= 0 ? function() {
      return empty_1.EMPTY;
    } : lift_1.operate(function(source, subscriber) {
      var seen = 0;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        if (++seen <= count) {
          subscriber.next(value);
          if (count <= seen) {
            subscriber.complete();
          }
        }
      }));
    });
  }
  exports.take = take;
});

// node_modules/rxjs/dist/cjs/internal/operators/ignoreElements.js
var require_ignoreElements = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ignoreElements = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var noop_1 = require_noop();
  function ignoreElements() {
    return lift_1.operate(function(source, subscriber) {
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, noop_1.noop));
    });
  }
  exports.ignoreElements = ignoreElements;
});

// node_modules/rxjs/dist/cjs/internal/operators/mapTo.js
var require_mapTo = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.mapTo = undefined;
  var map_1 = require_map();
  function mapTo(value) {
    return map_1.map(function() {
      return value;
    });
  }
  exports.mapTo = mapTo;
});

// node_modules/rxjs/dist/cjs/internal/operators/delayWhen.js
var require_delayWhen = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.delayWhen = undefined;
  var concat_1 = require_concat();
  var take_1 = require_take();
  var ignoreElements_1 = require_ignoreElements();
  var mapTo_1 = require_mapTo();
  var mergeMap_1 = require_mergeMap();
  var innerFrom_1 = require_innerFrom();
  function delayWhen(delayDurationSelector, subscriptionDelay) {
    if (subscriptionDelay) {
      return function(source) {
        return concat_1.concat(subscriptionDelay.pipe(take_1.take(1), ignoreElements_1.ignoreElements()), source.pipe(delayWhen(delayDurationSelector)));
      };
    }
    return mergeMap_1.mergeMap(function(value, index) {
      return innerFrom_1.innerFrom(delayDurationSelector(value, index)).pipe(take_1.take(1), mapTo_1.mapTo(value));
    });
  }
  exports.delayWhen = delayWhen;
});

// node_modules/rxjs/dist/cjs/internal/operators/delay.js
var require_delay = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.delay = undefined;
  var async_1 = require_async();
  var delayWhen_1 = require_delayWhen();
  var timer_1 = require_timer();
  function delay(due, scheduler) {
    if (scheduler === undefined) {
      scheduler = async_1.asyncScheduler;
    }
    var duration = timer_1.timer(due, scheduler);
    return delayWhen_1.delayWhen(function() {
      return duration;
    });
  }
  exports.delay = delay;
});

// node_modules/rxjs/dist/cjs/internal/operators/dematerialize.js
var require_dematerialize = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.dematerialize = undefined;
  var Notification_1 = require_Notification();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function dematerialize() {
    return lift_1.operate(function(source, subscriber) {
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(notification) {
        return Notification_1.observeNotification(notification, subscriber);
      }));
    });
  }
  exports.dematerialize = dematerialize;
});

// node_modules/rxjs/dist/cjs/internal/operators/distinct.js
var require_distinct = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.distinct = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var noop_1 = require_noop();
  var innerFrom_1 = require_innerFrom();
  function distinct(keySelector, flushes) {
    return lift_1.operate(function(source, subscriber) {
      var distinctKeys = new Set;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        var key2 = keySelector ? keySelector(value) : value;
        if (!distinctKeys.has(key2)) {
          distinctKeys.add(key2);
          subscriber.next(value);
        }
      }));
      flushes && innerFrom_1.innerFrom(flushes).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
        return distinctKeys.clear();
      }, noop_1.noop));
    });
  }
  exports.distinct = distinct;
});

// node_modules/rxjs/dist/cjs/internal/operators/distinctUntilChanged.js
var require_distinctUntilChanged = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.distinctUntilChanged = undefined;
  var identity_1 = require_identity();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function distinctUntilChanged(comparator, keySelector) {
    if (keySelector === undefined) {
      keySelector = identity_1.identity;
    }
    comparator = comparator !== null && comparator !== undefined ? comparator : defaultCompare;
    return lift_1.operate(function(source, subscriber) {
      var previousKey;
      var first = true;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        var currentKey = keySelector(value);
        if (first || !comparator(previousKey, currentKey)) {
          first = false;
          previousKey = currentKey;
          subscriber.next(value);
        }
      }));
    });
  }
  exports.distinctUntilChanged = distinctUntilChanged;
  function defaultCompare(a, b) {
    return a === b;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/distinctUntilKeyChanged.js
var require_distinctUntilKeyChanged = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.distinctUntilKeyChanged = undefined;
  var distinctUntilChanged_1 = require_distinctUntilChanged();
  function distinctUntilKeyChanged(key2, compare) {
    return distinctUntilChanged_1.distinctUntilChanged(function(x, y) {
      return compare ? compare(x[key2], y[key2]) : x[key2] === y[key2];
    });
  }
  exports.distinctUntilKeyChanged = distinctUntilKeyChanged;
});

// node_modules/rxjs/dist/cjs/internal/operators/throwIfEmpty.js
var require_throwIfEmpty = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.throwIfEmpty = undefined;
  var EmptyError_1 = require_EmptyError();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function throwIfEmpty(errorFactory) {
    if (errorFactory === undefined) {
      errorFactory = defaultErrorFactory;
    }
    return lift_1.operate(function(source, subscriber) {
      var hasValue = false;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        hasValue = true;
        subscriber.next(value);
      }, function() {
        return hasValue ? subscriber.complete() : subscriber.error(errorFactory());
      }));
    });
  }
  exports.throwIfEmpty = throwIfEmpty;
  function defaultErrorFactory() {
    return new EmptyError_1.EmptyError;
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/elementAt.js
var require_elementAt = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.elementAt = undefined;
  var ArgumentOutOfRangeError_1 = require_ArgumentOutOfRangeError();
  var filter_1 = require_filter();
  var throwIfEmpty_1 = require_throwIfEmpty();
  var defaultIfEmpty_1 = require_defaultIfEmpty();
  var take_1 = require_take();
  function elementAt(index, defaultValue) {
    if (index < 0) {
      throw new ArgumentOutOfRangeError_1.ArgumentOutOfRangeError;
    }
    var hasDefaultValue = arguments.length >= 2;
    return function(source) {
      return source.pipe(filter_1.filter(function(v, i) {
        return i === index;
      }), take_1.take(1), hasDefaultValue ? defaultIfEmpty_1.defaultIfEmpty(defaultValue) : throwIfEmpty_1.throwIfEmpty(function() {
        return new ArgumentOutOfRangeError_1.ArgumentOutOfRangeError;
      }));
    };
  }
  exports.elementAt = elementAt;
});

// node_modules/rxjs/dist/cjs/internal/operators/endWith.js
var require_endWith = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.endWith = undefined;
  var concat_1 = require_concat();
  var of_1 = require_of();
  function endWith() {
    var values = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      values[_i] = arguments[_i];
    }
    return function(source) {
      return concat_1.concat(source, of_1.of.apply(undefined, __spreadArray([], __read(values))));
    };
  }
  exports.endWith = endWith;
});

// node_modules/rxjs/dist/cjs/internal/operators/every.js
var require_every = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.every = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function every(predicate, thisArg) {
    return lift_1.operate(function(source, subscriber) {
      var index = 0;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        if (!predicate.call(thisArg, value, index++, source)) {
          subscriber.next(false);
          subscriber.complete();
        }
      }, function() {
        subscriber.next(true);
        subscriber.complete();
      }));
    });
  }
  exports.every = every;
});

// node_modules/rxjs/dist/cjs/internal/operators/exhaustMap.js
var require_exhaustMap = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.exhaustMap = undefined;
  var map_1 = require_map();
  var innerFrom_1 = require_innerFrom();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function exhaustMap(project, resultSelector) {
    if (resultSelector) {
      return function(source) {
        return source.pipe(exhaustMap(function(a, i) {
          return innerFrom_1.innerFrom(project(a, i)).pipe(map_1.map(function(b, ii) {
            return resultSelector(a, b, i, ii);
          }));
        }));
      };
    }
    return lift_1.operate(function(source, subscriber) {
      var index = 0;
      var innerSub = null;
      var isComplete = false;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(outerValue) {
        if (!innerSub) {
          innerSub = OperatorSubscriber_1.createOperatorSubscriber(subscriber, undefined, function() {
            innerSub = null;
            isComplete && subscriber.complete();
          });
          innerFrom_1.innerFrom(project(outerValue, index++)).subscribe(innerSub);
        }
      }, function() {
        isComplete = true;
        !innerSub && subscriber.complete();
      }));
    });
  }
  exports.exhaustMap = exhaustMap;
});

// node_modules/rxjs/dist/cjs/internal/operators/exhaustAll.js
var require_exhaustAll = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.exhaustAll = undefined;
  var exhaustMap_1 = require_exhaustMap();
  var identity_1 = require_identity();
  function exhaustAll() {
    return exhaustMap_1.exhaustMap(identity_1.identity);
  }
  exports.exhaustAll = exhaustAll;
});

// node_modules/rxjs/dist/cjs/internal/operators/exhaust.js
var require_exhaust = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.exhaust = undefined;
  var exhaustAll_1 = require_exhaustAll();
  exports.exhaust = exhaustAll_1.exhaustAll;
});

// node_modules/rxjs/dist/cjs/internal/operators/expand.js
var require_expand = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.expand = undefined;
  var lift_1 = require_lift();
  var mergeInternals_1 = require_mergeInternals();
  function expand(project, concurrent, scheduler) {
    if (concurrent === undefined) {
      concurrent = Infinity;
    }
    concurrent = (concurrent || 0) < 1 ? Infinity : concurrent;
    return lift_1.operate(function(source, subscriber) {
      return mergeInternals_1.mergeInternals(source, subscriber, project, concurrent, undefined, true, scheduler);
    });
  }
  exports.expand = expand;
});

// node_modules/rxjs/dist/cjs/internal/operators/finalize.js
var require_finalize = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.finalize = undefined;
  var lift_1 = require_lift();
  function finalize(callback) {
    return lift_1.operate(function(source, subscriber) {
      try {
        source.subscribe(subscriber);
      } finally {
        subscriber.add(callback);
      }
    });
  }
  exports.finalize = finalize;
});

// node_modules/rxjs/dist/cjs/internal/operators/find.js
var require_find = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createFind = exports.find = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function find(predicate, thisArg) {
    return lift_1.operate(createFind(predicate, thisArg, "value"));
  }
  exports.find = find;
  function createFind(predicate, thisArg, emit) {
    var findIndex = emit === "index";
    return function(source, subscriber) {
      var index = 0;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        var i = index++;
        if (predicate.call(thisArg, value, i, source)) {
          subscriber.next(findIndex ? i : value);
          subscriber.complete();
        }
      }, function() {
        subscriber.next(findIndex ? -1 : undefined);
        subscriber.complete();
      }));
    };
  }
  exports.createFind = createFind;
});

// node_modules/rxjs/dist/cjs/internal/operators/findIndex.js
var require_findIndex = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.findIndex = undefined;
  var lift_1 = require_lift();
  var find_1 = require_find();
  function findIndex(predicate, thisArg) {
    return lift_1.operate(find_1.createFind(predicate, thisArg, "index"));
  }
  exports.findIndex = findIndex;
});

// node_modules/rxjs/dist/cjs/internal/operators/first.js
var require_first = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.first = undefined;
  var EmptyError_1 = require_EmptyError();
  var filter_1 = require_filter();
  var take_1 = require_take();
  var defaultIfEmpty_1 = require_defaultIfEmpty();
  var throwIfEmpty_1 = require_throwIfEmpty();
  var identity_1 = require_identity();
  function first(predicate, defaultValue) {
    var hasDefaultValue = arguments.length >= 2;
    return function(source) {
      return source.pipe(predicate ? filter_1.filter(function(v, i) {
        return predicate(v, i, source);
      }) : identity_1.identity, take_1.take(1), hasDefaultValue ? defaultIfEmpty_1.defaultIfEmpty(defaultValue) : throwIfEmpty_1.throwIfEmpty(function() {
        return new EmptyError_1.EmptyError;
      }));
    };
  }
  exports.first = first;
});

// node_modules/rxjs/dist/cjs/internal/operators/groupBy.js
var require_groupBy = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.groupBy = undefined;
  var Observable_1 = require_Observable();
  var innerFrom_1 = require_innerFrom();
  var Subject_1 = require_Subject();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function groupBy(keySelector, elementOrOptions, duration, connector) {
    return lift_1.operate(function(source, subscriber) {
      var element;
      if (!elementOrOptions || typeof elementOrOptions === "function") {
        element = elementOrOptions;
      } else {
        duration = elementOrOptions.duration, element = elementOrOptions.element, connector = elementOrOptions.connector;
      }
      var groups = new Map;
      var notify = function(cb) {
        groups.forEach(cb);
        cb(subscriber);
      };
      var handleError = function(err) {
        return notify(function(consumer) {
          return consumer.error(err);
        });
      };
      var activeGroups = 0;
      var teardownAttempted = false;
      var groupBySourceSubscriber = new OperatorSubscriber_1.OperatorSubscriber(subscriber, function(value) {
        try {
          var key_1 = keySelector(value);
          var group_1 = groups.get(key_1);
          if (!group_1) {
            groups.set(key_1, group_1 = connector ? connector() : new Subject_1.Subject);
            var grouped = createGroupedObservable(key_1, group_1);
            subscriber.next(grouped);
            if (duration) {
              var durationSubscriber_1 = OperatorSubscriber_1.createOperatorSubscriber(group_1, function() {
                group_1.complete();
                durationSubscriber_1 === null || durationSubscriber_1 === undefined || durationSubscriber_1.unsubscribe();
              }, undefined, undefined, function() {
                return groups.delete(key_1);
              });
              groupBySourceSubscriber.add(innerFrom_1.innerFrom(duration(grouped)).subscribe(durationSubscriber_1));
            }
          }
          group_1.next(element ? element(value) : value);
        } catch (err) {
          handleError(err);
        }
      }, function() {
        return notify(function(consumer) {
          return consumer.complete();
        });
      }, handleError, function() {
        return groups.clear();
      }, function() {
        teardownAttempted = true;
        return activeGroups === 0;
      });
      source.subscribe(groupBySourceSubscriber);
      function createGroupedObservable(key2, groupSubject) {
        var result = new Observable_1.Observable(function(groupSubscriber) {
          activeGroups++;
          var innerSub = groupSubject.subscribe(groupSubscriber);
          return function() {
            innerSub.unsubscribe();
            --activeGroups === 0 && teardownAttempted && groupBySourceSubscriber.unsubscribe();
          };
        });
        result.key = key2;
        return result;
      }
    });
  }
  exports.groupBy = groupBy;
});

// node_modules/rxjs/dist/cjs/internal/operators/isEmpty.js
var require_isEmpty = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isEmpty = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function isEmpty() {
    return lift_1.operate(function(source, subscriber) {
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
        subscriber.next(false);
        subscriber.complete();
      }, function() {
        subscriber.next(true);
        subscriber.complete();
      }));
    });
  }
  exports.isEmpty = isEmpty;
});

// node_modules/rxjs/dist/cjs/internal/operators/takeLast.js
var require_takeLast = __commonJS((exports) => {
  var __values = exports && exports.__values || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m)
      return m.call(o);
    if (o && typeof o.length === "number")
      return {
        next: function() {
          if (o && i >= o.length)
            o = undefined;
          return { value: o && o[i++], done: !o };
        }
      };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.takeLast = undefined;
  var empty_1 = require_empty2();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function takeLast(count) {
    return count <= 0 ? function() {
      return empty_1.EMPTY;
    } : lift_1.operate(function(source, subscriber) {
      var buffer = [];
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        buffer.push(value);
        count < buffer.length && buffer.shift();
      }, function() {
        var e_1, _a;
        try {
          for (var buffer_1 = __values(buffer), buffer_1_1 = buffer_1.next();!buffer_1_1.done; buffer_1_1 = buffer_1.next()) {
            var value = buffer_1_1.value;
            subscriber.next(value);
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (buffer_1_1 && !buffer_1_1.done && (_a = buffer_1.return))
              _a.call(buffer_1);
          } finally {
            if (e_1)
              throw e_1.error;
          }
        }
        subscriber.complete();
      }, undefined, function() {
        buffer = null;
      }));
    });
  }
  exports.takeLast = takeLast;
});

// node_modules/rxjs/dist/cjs/internal/operators/last.js
var require_last = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.last = undefined;
  var EmptyError_1 = require_EmptyError();
  var filter_1 = require_filter();
  var takeLast_1 = require_takeLast();
  var throwIfEmpty_1 = require_throwIfEmpty();
  var defaultIfEmpty_1 = require_defaultIfEmpty();
  var identity_1 = require_identity();
  function last(predicate, defaultValue) {
    var hasDefaultValue = arguments.length >= 2;
    return function(source) {
      return source.pipe(predicate ? filter_1.filter(function(v, i) {
        return predicate(v, i, source);
      }) : identity_1.identity, takeLast_1.takeLast(1), hasDefaultValue ? defaultIfEmpty_1.defaultIfEmpty(defaultValue) : throwIfEmpty_1.throwIfEmpty(function() {
        return new EmptyError_1.EmptyError;
      }));
    };
  }
  exports.last = last;
});

// node_modules/rxjs/dist/cjs/internal/operators/materialize.js
var require_materialize = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.materialize = undefined;
  var Notification_1 = require_Notification();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function materialize() {
    return lift_1.operate(function(source, subscriber) {
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        subscriber.next(Notification_1.Notification.createNext(value));
      }, function() {
        subscriber.next(Notification_1.Notification.createComplete());
        subscriber.complete();
      }, function(err) {
        subscriber.next(Notification_1.Notification.createError(err));
        subscriber.complete();
      }));
    });
  }
  exports.materialize = materialize;
});

// node_modules/rxjs/dist/cjs/internal/operators/max.js
var require_max = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.max = undefined;
  var reduce_1 = require_reduce();
  var isFunction_1 = require_isFunction();
  function max(comparer) {
    return reduce_1.reduce(isFunction_1.isFunction(comparer) ? function(x, y) {
      return comparer(x, y) > 0 ? x : y;
    } : function(x, y) {
      return x > y ? x : y;
    });
  }
  exports.max = max;
});

// node_modules/rxjs/dist/cjs/internal/operators/flatMap.js
var require_flatMap = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.flatMap = undefined;
  var mergeMap_1 = require_mergeMap();
  exports.flatMap = mergeMap_1.mergeMap;
});

// node_modules/rxjs/dist/cjs/internal/operators/mergeMapTo.js
var require_mergeMapTo = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.mergeMapTo = undefined;
  var mergeMap_1 = require_mergeMap();
  var isFunction_1 = require_isFunction();
  function mergeMapTo(innerObservable, resultSelector, concurrent) {
    if (concurrent === undefined) {
      concurrent = Infinity;
    }
    if (isFunction_1.isFunction(resultSelector)) {
      return mergeMap_1.mergeMap(function() {
        return innerObservable;
      }, resultSelector, concurrent);
    }
    if (typeof resultSelector === "number") {
      concurrent = resultSelector;
    }
    return mergeMap_1.mergeMap(function() {
      return innerObservable;
    }, concurrent);
  }
  exports.mergeMapTo = mergeMapTo;
});

// node_modules/rxjs/dist/cjs/internal/operators/mergeScan.js
var require_mergeScan = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.mergeScan = undefined;
  var lift_1 = require_lift();
  var mergeInternals_1 = require_mergeInternals();
  function mergeScan(accumulator, seed, concurrent) {
    if (concurrent === undefined) {
      concurrent = Infinity;
    }
    return lift_1.operate(function(source, subscriber) {
      var state = seed;
      return mergeInternals_1.mergeInternals(source, subscriber, function(value, index) {
        return accumulator(state, value, index);
      }, concurrent, function(value) {
        state = value;
      }, false, undefined, function() {
        return state = null;
      });
    });
  }
  exports.mergeScan = mergeScan;
});

// node_modules/rxjs/dist/cjs/internal/operators/merge.js
var require_merge2 = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.merge = undefined;
  var lift_1 = require_lift();
  var argsOrArgArray_1 = require_argsOrArgArray();
  var mergeAll_1 = require_mergeAll();
  var args_1 = require_args();
  var from_1 = require_from();
  function merge() {
    var args = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }
    var scheduler = args_1.popScheduler(args);
    var concurrent = args_1.popNumber(args, Infinity);
    args = argsOrArgArray_1.argsOrArgArray(args);
    return lift_1.operate(function(source, subscriber) {
      mergeAll_1.mergeAll(concurrent)(from_1.from(__spreadArray([source], __read(args)), scheduler)).subscribe(subscriber);
    });
  }
  exports.merge = merge;
});

// node_modules/rxjs/dist/cjs/internal/operators/mergeWith.js
var require_mergeWith = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.mergeWith = undefined;
  var merge_1 = require_merge2();
  function mergeWith() {
    var otherSources = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      otherSources[_i] = arguments[_i];
    }
    return merge_1.merge.apply(undefined, __spreadArray([], __read(otherSources)));
  }
  exports.mergeWith = mergeWith;
});

// node_modules/rxjs/dist/cjs/internal/operators/min.js
var require_min = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.min = undefined;
  var reduce_1 = require_reduce();
  var isFunction_1 = require_isFunction();
  function min(comparer) {
    return reduce_1.reduce(isFunction_1.isFunction(comparer) ? function(x, y) {
      return comparer(x, y) < 0 ? x : y;
    } : function(x, y) {
      return x < y ? x : y;
    });
  }
  exports.min = min;
});

// node_modules/rxjs/dist/cjs/internal/operators/multicast.js
var require_multicast = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.multicast = undefined;
  var ConnectableObservable_1 = require_ConnectableObservable();
  var isFunction_1 = require_isFunction();
  var connect_1 = require_connect();
  function multicast(subjectOrSubjectFactory, selector) {
    var subjectFactory = isFunction_1.isFunction(subjectOrSubjectFactory) ? subjectOrSubjectFactory : function() {
      return subjectOrSubjectFactory;
    };
    if (isFunction_1.isFunction(selector)) {
      return connect_1.connect(selector, {
        connector: subjectFactory
      });
    }
    return function(source) {
      return new ConnectableObservable_1.ConnectableObservable(source, subjectFactory);
    };
  }
  exports.multicast = multicast;
});

// node_modules/rxjs/dist/cjs/internal/operators/onErrorResumeNextWith.js
var require_onErrorResumeNextWith = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.onErrorResumeNext = exports.onErrorResumeNextWith = undefined;
  var argsOrArgArray_1 = require_argsOrArgArray();
  var onErrorResumeNext_1 = require_onErrorResumeNext();
  function onErrorResumeNextWith() {
    var sources = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      sources[_i] = arguments[_i];
    }
    var nextSources = argsOrArgArray_1.argsOrArgArray(sources);
    return function(source) {
      return onErrorResumeNext_1.onErrorResumeNext.apply(undefined, __spreadArray([source], __read(nextSources)));
    };
  }
  exports.onErrorResumeNextWith = onErrorResumeNextWith;
  exports.onErrorResumeNext = onErrorResumeNextWith;
});

// node_modules/rxjs/dist/cjs/internal/operators/pairwise.js
var require_pairwise = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.pairwise = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function pairwise() {
    return lift_1.operate(function(source, subscriber) {
      var prev;
      var hasPrev = false;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        var p = prev;
        prev = value;
        hasPrev && subscriber.next([p, value]);
        hasPrev = true;
      }));
    });
  }
  exports.pairwise = pairwise;
});

// node_modules/rxjs/dist/cjs/internal/operators/pluck.js
var require_pluck = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.pluck = undefined;
  var map_1 = require_map();
  function pluck() {
    var properties = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      properties[_i] = arguments[_i];
    }
    var length = properties.length;
    if (length === 0) {
      throw new Error("list of properties cannot be empty.");
    }
    return map_1.map(function(x) {
      var currentProp = x;
      for (var i = 0;i < length; i++) {
        var p = currentProp === null || currentProp === undefined ? undefined : currentProp[properties[i]];
        if (typeof p !== "undefined") {
          currentProp = p;
        } else {
          return;
        }
      }
      return currentProp;
    });
  }
  exports.pluck = pluck;
});

// node_modules/rxjs/dist/cjs/internal/operators/publish.js
var require_publish = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.publish = undefined;
  var Subject_1 = require_Subject();
  var multicast_1 = require_multicast();
  var connect_1 = require_connect();
  function publish(selector) {
    return selector ? function(source) {
      return connect_1.connect(selector)(source);
    } : function(source) {
      return multicast_1.multicast(new Subject_1.Subject)(source);
    };
  }
  exports.publish = publish;
});

// node_modules/rxjs/dist/cjs/internal/operators/publishBehavior.js
var require_publishBehavior = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.publishBehavior = undefined;
  var BehaviorSubject_1 = require_BehaviorSubject();
  var ConnectableObservable_1 = require_ConnectableObservable();
  function publishBehavior(initialValue) {
    return function(source) {
      var subject = new BehaviorSubject_1.BehaviorSubject(initialValue);
      return new ConnectableObservable_1.ConnectableObservable(source, function() {
        return subject;
      });
    };
  }
  exports.publishBehavior = publishBehavior;
});

// node_modules/rxjs/dist/cjs/internal/operators/publishLast.js
var require_publishLast = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.publishLast = undefined;
  var AsyncSubject_1 = require_AsyncSubject();
  var ConnectableObservable_1 = require_ConnectableObservable();
  function publishLast() {
    return function(source) {
      var subject = new AsyncSubject_1.AsyncSubject;
      return new ConnectableObservable_1.ConnectableObservable(source, function() {
        return subject;
      });
    };
  }
  exports.publishLast = publishLast;
});

// node_modules/rxjs/dist/cjs/internal/operators/publishReplay.js
var require_publishReplay = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.publishReplay = undefined;
  var ReplaySubject_1 = require_ReplaySubject();
  var multicast_1 = require_multicast();
  var isFunction_1 = require_isFunction();
  function publishReplay(bufferSize, windowTime, selectorOrScheduler, timestampProvider) {
    if (selectorOrScheduler && !isFunction_1.isFunction(selectorOrScheduler)) {
      timestampProvider = selectorOrScheduler;
    }
    var selector = isFunction_1.isFunction(selectorOrScheduler) ? selectorOrScheduler : undefined;
    return function(source) {
      return multicast_1.multicast(new ReplaySubject_1.ReplaySubject(bufferSize, windowTime, timestampProvider), selector)(source);
    };
  }
  exports.publishReplay = publishReplay;
});

// node_modules/rxjs/dist/cjs/internal/operators/raceWith.js
var require_raceWith = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.raceWith = undefined;
  var race_1 = require_race();
  var lift_1 = require_lift();
  var identity_1 = require_identity();
  function raceWith() {
    var otherSources = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      otherSources[_i] = arguments[_i];
    }
    return !otherSources.length ? identity_1.identity : lift_1.operate(function(source, subscriber) {
      race_1.raceInit(__spreadArray([source], __read(otherSources)))(subscriber);
    });
  }
  exports.raceWith = raceWith;
});

// node_modules/rxjs/dist/cjs/internal/operators/repeat.js
var require_repeat = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.repeat = undefined;
  var empty_1 = require_empty2();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var innerFrom_1 = require_innerFrom();
  var timer_1 = require_timer();
  function repeat(countOrConfig) {
    var _a;
    var count = Infinity;
    var delay;
    if (countOrConfig != null) {
      if (typeof countOrConfig === "object") {
        _a = countOrConfig.count, count = _a === undefined ? Infinity : _a, delay = countOrConfig.delay;
      } else {
        count = countOrConfig;
      }
    }
    return count <= 0 ? function() {
      return empty_1.EMPTY;
    } : lift_1.operate(function(source, subscriber) {
      var soFar = 0;
      var sourceSub;
      var resubscribe = function() {
        sourceSub === null || sourceSub === undefined || sourceSub.unsubscribe();
        sourceSub = null;
        if (delay != null) {
          var notifier = typeof delay === "number" ? timer_1.timer(delay) : innerFrom_1.innerFrom(delay(soFar));
          var notifierSubscriber_1 = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
            notifierSubscriber_1.unsubscribe();
            subscribeToSource();
          });
          notifier.subscribe(notifierSubscriber_1);
        } else {
          subscribeToSource();
        }
      };
      var subscribeToSource = function() {
        var syncUnsub = false;
        sourceSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, undefined, function() {
          if (++soFar < count) {
            if (sourceSub) {
              resubscribe();
            } else {
              syncUnsub = true;
            }
          } else {
            subscriber.complete();
          }
        }));
        if (syncUnsub) {
          resubscribe();
        }
      };
      subscribeToSource();
    });
  }
  exports.repeat = repeat;
});

// node_modules/rxjs/dist/cjs/internal/operators/repeatWhen.js
var require_repeatWhen = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.repeatWhen = undefined;
  var innerFrom_1 = require_innerFrom();
  var Subject_1 = require_Subject();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function repeatWhen(notifier) {
    return lift_1.operate(function(source, subscriber) {
      var innerSub;
      var syncResub = false;
      var completions$;
      var isNotifierComplete = false;
      var isMainComplete = false;
      var checkComplete = function() {
        return isMainComplete && isNotifierComplete && (subscriber.complete(), true);
      };
      var getCompletionSubject = function() {
        if (!completions$) {
          completions$ = new Subject_1.Subject;
          innerFrom_1.innerFrom(notifier(completions$)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
            if (innerSub) {
              subscribeForRepeatWhen();
            } else {
              syncResub = true;
            }
          }, function() {
            isNotifierComplete = true;
            checkComplete();
          }));
        }
        return completions$;
      };
      var subscribeForRepeatWhen = function() {
        isMainComplete = false;
        innerSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, undefined, function() {
          isMainComplete = true;
          !checkComplete() && getCompletionSubject().next();
        }));
        if (syncResub) {
          innerSub.unsubscribe();
          innerSub = null;
          syncResub = false;
          subscribeForRepeatWhen();
        }
      };
      subscribeForRepeatWhen();
    });
  }
  exports.repeatWhen = repeatWhen;
});

// node_modules/rxjs/dist/cjs/internal/operators/retry.js
var require_retry = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.retry = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var identity_1 = require_identity();
  var timer_1 = require_timer();
  var innerFrom_1 = require_innerFrom();
  function retry(configOrCount) {
    if (configOrCount === undefined) {
      configOrCount = Infinity;
    }
    var config;
    if (configOrCount && typeof configOrCount === "object") {
      config = configOrCount;
    } else {
      config = {
        count: configOrCount
      };
    }
    var _a = config.count, count = _a === undefined ? Infinity : _a, delay = config.delay, _b = config.resetOnSuccess, resetOnSuccess = _b === undefined ? false : _b;
    return count <= 0 ? identity_1.identity : lift_1.operate(function(source, subscriber) {
      var soFar = 0;
      var innerSub;
      var subscribeForRetry = function() {
        var syncUnsub = false;
        innerSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          if (resetOnSuccess) {
            soFar = 0;
          }
          subscriber.next(value);
        }, undefined, function(err) {
          if (soFar++ < count) {
            var resub_1 = function() {
              if (innerSub) {
                innerSub.unsubscribe();
                innerSub = null;
                subscribeForRetry();
              } else {
                syncUnsub = true;
              }
            };
            if (delay != null) {
              var notifier = typeof delay === "number" ? timer_1.timer(delay) : innerFrom_1.innerFrom(delay(err, soFar));
              var notifierSubscriber_1 = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
                notifierSubscriber_1.unsubscribe();
                resub_1();
              }, function() {
                subscriber.complete();
              });
              notifier.subscribe(notifierSubscriber_1);
            } else {
              resub_1();
            }
          } else {
            subscriber.error(err);
          }
        }));
        if (syncUnsub) {
          innerSub.unsubscribe();
          innerSub = null;
          subscribeForRetry();
        }
      };
      subscribeForRetry();
    });
  }
  exports.retry = retry;
});

// node_modules/rxjs/dist/cjs/internal/operators/retryWhen.js
var require_retryWhen = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.retryWhen = undefined;
  var innerFrom_1 = require_innerFrom();
  var Subject_1 = require_Subject();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function retryWhen(notifier) {
    return lift_1.operate(function(source, subscriber) {
      var innerSub;
      var syncResub = false;
      var errors$;
      var subscribeForRetryWhen = function() {
        innerSub = source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, undefined, undefined, function(err) {
          if (!errors$) {
            errors$ = new Subject_1.Subject;
            innerFrom_1.innerFrom(notifier(errors$)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
              return innerSub ? subscribeForRetryWhen() : syncResub = true;
            }));
          }
          if (errors$) {
            errors$.next(err);
          }
        }));
        if (syncResub) {
          innerSub.unsubscribe();
          innerSub = null;
          syncResub = false;
          subscribeForRetryWhen();
        }
      };
      subscribeForRetryWhen();
    });
  }
  exports.retryWhen = retryWhen;
});

// node_modules/rxjs/dist/cjs/internal/operators/sample.js
var require_sample = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.sample = undefined;
  var innerFrom_1 = require_innerFrom();
  var lift_1 = require_lift();
  var noop_1 = require_noop();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function sample2(notifier) {
    return lift_1.operate(function(source, subscriber) {
      var hasValue = false;
      var lastValue = null;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        hasValue = true;
        lastValue = value;
      }));
      innerFrom_1.innerFrom(notifier).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
        if (hasValue) {
          hasValue = false;
          var value = lastValue;
          lastValue = null;
          subscriber.next(value);
        }
      }, noop_1.noop));
    });
  }
  exports.sample = sample2;
});

// node_modules/rxjs/dist/cjs/internal/operators/sampleTime.js
var require_sampleTime = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.sampleTime = undefined;
  var async_1 = require_async();
  var sample_1 = require_sample();
  var interval_1 = require_interval();
  function sampleTime(period, scheduler) {
    if (scheduler === undefined) {
      scheduler = async_1.asyncScheduler;
    }
    return sample_1.sample(interval_1.interval(period, scheduler));
  }
  exports.sampleTime = sampleTime;
});

// node_modules/rxjs/dist/cjs/internal/operators/scan.js
var require_scan = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.scan = undefined;
  var lift_1 = require_lift();
  var scanInternals_1 = require_scanInternals();
  function scan(accumulator, seed) {
    return lift_1.operate(scanInternals_1.scanInternals(accumulator, seed, arguments.length >= 2, true));
  }
  exports.scan = scan;
});

// node_modules/rxjs/dist/cjs/internal/operators/sequenceEqual.js
var require_sequenceEqual = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.sequenceEqual = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var innerFrom_1 = require_innerFrom();
  function sequenceEqual(compareTo, comparator) {
    if (comparator === undefined) {
      comparator = function(a, b) {
        return a === b;
      };
    }
    return lift_1.operate(function(source, subscriber) {
      var aState = createState();
      var bState = createState();
      var emit = function(isEqual) {
        subscriber.next(isEqual);
        subscriber.complete();
      };
      var createSubscriber = function(selfState, otherState) {
        var sequenceEqualSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(a) {
          var { buffer, complete } = otherState;
          if (buffer.length === 0) {
            complete ? emit(false) : selfState.buffer.push(a);
          } else {
            !comparator(a, buffer.shift()) && emit(false);
          }
        }, function() {
          selfState.complete = true;
          var { complete, buffer } = otherState;
          complete && emit(buffer.length === 0);
          sequenceEqualSubscriber === null || sequenceEqualSubscriber === undefined || sequenceEqualSubscriber.unsubscribe();
        });
        return sequenceEqualSubscriber;
      };
      source.subscribe(createSubscriber(aState, bState));
      innerFrom_1.innerFrom(compareTo).subscribe(createSubscriber(bState, aState));
    });
  }
  exports.sequenceEqual = sequenceEqual;
  function createState() {
    return {
      buffer: [],
      complete: false
    };
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/share.js
var require_share = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.share = undefined;
  var innerFrom_1 = require_innerFrom();
  var Subject_1 = require_Subject();
  var Subscriber_1 = require_Subscriber();
  var lift_1 = require_lift();
  function share(options) {
    if (options === undefined) {
      options = {};
    }
    var _a = options.connector, connector = _a === undefined ? function() {
      return new Subject_1.Subject;
    } : _a, _b = options.resetOnError, resetOnError = _b === undefined ? true : _b, _c = options.resetOnComplete, resetOnComplete = _c === undefined ? true : _c, _d = options.resetOnRefCountZero, resetOnRefCountZero = _d === undefined ? true : _d;
    return function(wrapperSource) {
      var connection;
      var resetConnection;
      var subject;
      var refCount = 0;
      var hasCompleted = false;
      var hasErrored = false;
      var cancelReset = function() {
        resetConnection === null || resetConnection === undefined || resetConnection.unsubscribe();
        resetConnection = undefined;
      };
      var reset = function() {
        cancelReset();
        connection = subject = undefined;
        hasCompleted = hasErrored = false;
      };
      var resetAndUnsubscribe = function() {
        var conn = connection;
        reset();
        conn === null || conn === undefined || conn.unsubscribe();
      };
      return lift_1.operate(function(source, subscriber) {
        refCount++;
        if (!hasErrored && !hasCompleted) {
          cancelReset();
        }
        var dest = subject = subject !== null && subject !== undefined ? subject : connector();
        subscriber.add(function() {
          refCount--;
          if (refCount === 0 && !hasErrored && !hasCompleted) {
            resetConnection = handleReset(resetAndUnsubscribe, resetOnRefCountZero);
          }
        });
        dest.subscribe(subscriber);
        if (!connection && refCount > 0) {
          connection = new Subscriber_1.SafeSubscriber({
            next: function(value) {
              return dest.next(value);
            },
            error: function(err) {
              hasErrored = true;
              cancelReset();
              resetConnection = handleReset(reset, resetOnError, err);
              dest.error(err);
            },
            complete: function() {
              hasCompleted = true;
              cancelReset();
              resetConnection = handleReset(reset, resetOnComplete);
              dest.complete();
            }
          });
          innerFrom_1.innerFrom(source).subscribe(connection);
        }
      })(wrapperSource);
    };
  }
  exports.share = share;
  function handleReset(reset, on) {
    var args = [];
    for (var _i = 2;_i < arguments.length; _i++) {
      args[_i - 2] = arguments[_i];
    }
    if (on === true) {
      reset();
      return;
    }
    if (on === false) {
      return;
    }
    var onSubscriber = new Subscriber_1.SafeSubscriber({
      next: function() {
        onSubscriber.unsubscribe();
        reset();
      }
    });
    return innerFrom_1.innerFrom(on.apply(undefined, __spreadArray([], __read(args)))).subscribe(onSubscriber);
  }
});

// node_modules/rxjs/dist/cjs/internal/operators/shareReplay.js
var require_shareReplay = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.shareReplay = undefined;
  var ReplaySubject_1 = require_ReplaySubject();
  var share_1 = require_share();
  function shareReplay(configOrBufferSize, windowTime, scheduler) {
    var _a, _b, _c;
    var bufferSize;
    var refCount = false;
    if (configOrBufferSize && typeof configOrBufferSize === "object") {
      _a = configOrBufferSize.bufferSize, bufferSize = _a === undefined ? Infinity : _a, _b = configOrBufferSize.windowTime, windowTime = _b === undefined ? Infinity : _b, _c = configOrBufferSize.refCount, refCount = _c === undefined ? false : _c, scheduler = configOrBufferSize.scheduler;
    } else {
      bufferSize = configOrBufferSize !== null && configOrBufferSize !== undefined ? configOrBufferSize : Infinity;
    }
    return share_1.share({
      connector: function() {
        return new ReplaySubject_1.ReplaySubject(bufferSize, windowTime, scheduler);
      },
      resetOnError: true,
      resetOnComplete: false,
      resetOnRefCountZero: refCount
    });
  }
  exports.shareReplay = shareReplay;
});

// node_modules/rxjs/dist/cjs/internal/operators/single.js
var require_single = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.single = undefined;
  var EmptyError_1 = require_EmptyError();
  var SequenceError_1 = require_SequenceError();
  var NotFoundError_1 = require_NotFoundError();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function single(predicate) {
    return lift_1.operate(function(source, subscriber) {
      var hasValue = false;
      var singleValue;
      var seenValue = false;
      var index = 0;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        seenValue = true;
        if (!predicate || predicate(value, index++, source)) {
          hasValue && subscriber.error(new SequenceError_1.SequenceError("Too many matching values"));
          hasValue = true;
          singleValue = value;
        }
      }, function() {
        if (hasValue) {
          subscriber.next(singleValue);
          subscriber.complete();
        } else {
          subscriber.error(seenValue ? new NotFoundError_1.NotFoundError("No matching values") : new EmptyError_1.EmptyError);
        }
      }));
    });
  }
  exports.single = single;
});

// node_modules/rxjs/dist/cjs/internal/operators/skip.js
var require_skip = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.skip = undefined;
  var filter_1 = require_filter();
  function skip(count) {
    return filter_1.filter(function(_, index) {
      return count <= index;
    });
  }
  exports.skip = skip;
});

// node_modules/rxjs/dist/cjs/internal/operators/skipLast.js
var require_skipLast = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.skipLast = undefined;
  var identity_1 = require_identity();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function skipLast(skipCount) {
    return skipCount <= 0 ? identity_1.identity : lift_1.operate(function(source, subscriber) {
      var ring = new Array(skipCount);
      var seen = 0;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        var valueIndex = seen++;
        if (valueIndex < skipCount) {
          ring[valueIndex] = value;
        } else {
          var index = valueIndex % skipCount;
          var oldValue = ring[index];
          ring[index] = value;
          subscriber.next(oldValue);
        }
      }));
      return function() {
        ring = null;
      };
    });
  }
  exports.skipLast = skipLast;
});

// node_modules/rxjs/dist/cjs/internal/operators/skipUntil.js
var require_skipUntil = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.skipUntil = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var innerFrom_1 = require_innerFrom();
  var noop_1 = require_noop();
  function skipUntil(notifier) {
    return lift_1.operate(function(source, subscriber) {
      var taking = false;
      var skipSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
        skipSubscriber === null || skipSubscriber === undefined || skipSubscriber.unsubscribe();
        taking = true;
      }, noop_1.noop);
      innerFrom_1.innerFrom(notifier).subscribe(skipSubscriber);
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        return taking && subscriber.next(value);
      }));
    });
  }
  exports.skipUntil = skipUntil;
});

// node_modules/rxjs/dist/cjs/internal/operators/skipWhile.js
var require_skipWhile = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.skipWhile = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function skipWhile(predicate) {
    return lift_1.operate(function(source, subscriber) {
      var taking = false;
      var index = 0;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        return (taking || (taking = !predicate(value, index++))) && subscriber.next(value);
      }));
    });
  }
  exports.skipWhile = skipWhile;
});

// node_modules/rxjs/dist/cjs/internal/operators/startWith.js
var require_startWith = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.startWith = undefined;
  var concat_1 = require_concat();
  var args_1 = require_args();
  var lift_1 = require_lift();
  function startWith() {
    var values = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      values[_i] = arguments[_i];
    }
    var scheduler = args_1.popScheduler(values);
    return lift_1.operate(function(source, subscriber) {
      (scheduler ? concat_1.concat(values, source, scheduler) : concat_1.concat(values, source)).subscribe(subscriber);
    });
  }
  exports.startWith = startWith;
});

// node_modules/rxjs/dist/cjs/internal/operators/switchMap.js
var require_switchMap = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.switchMap = undefined;
  var innerFrom_1 = require_innerFrom();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function switchMap(project, resultSelector) {
    return lift_1.operate(function(source, subscriber) {
      var innerSubscriber = null;
      var index = 0;
      var isComplete = false;
      var checkComplete = function() {
        return isComplete && !innerSubscriber && subscriber.complete();
      };
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        innerSubscriber === null || innerSubscriber === undefined || innerSubscriber.unsubscribe();
        var innerIndex = 0;
        var outerIndex = index++;
        innerFrom_1.innerFrom(project(value, outerIndex)).subscribe(innerSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(innerValue) {
          return subscriber.next(resultSelector ? resultSelector(value, innerValue, outerIndex, innerIndex++) : innerValue);
        }, function() {
          innerSubscriber = null;
          checkComplete();
        }));
      }, function() {
        isComplete = true;
        checkComplete();
      }));
    });
  }
  exports.switchMap = switchMap;
});

// node_modules/rxjs/dist/cjs/internal/operators/switchAll.js
var require_switchAll = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.switchAll = undefined;
  var switchMap_1 = require_switchMap();
  var identity_1 = require_identity();
  function switchAll() {
    return switchMap_1.switchMap(identity_1.identity);
  }
  exports.switchAll = switchAll;
});

// node_modules/rxjs/dist/cjs/internal/operators/switchMapTo.js
var require_switchMapTo = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.switchMapTo = undefined;
  var switchMap_1 = require_switchMap();
  var isFunction_1 = require_isFunction();
  function switchMapTo(innerObservable, resultSelector) {
    return isFunction_1.isFunction(resultSelector) ? switchMap_1.switchMap(function() {
      return innerObservable;
    }, resultSelector) : switchMap_1.switchMap(function() {
      return innerObservable;
    });
  }
  exports.switchMapTo = switchMapTo;
});

// node_modules/rxjs/dist/cjs/internal/operators/switchScan.js
var require_switchScan = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.switchScan = undefined;
  var switchMap_1 = require_switchMap();
  var lift_1 = require_lift();
  function switchScan(accumulator, seed) {
    return lift_1.operate(function(source, subscriber) {
      var state = seed;
      switchMap_1.switchMap(function(value, index) {
        return accumulator(state, value, index);
      }, function(_, innerValue) {
        return state = innerValue, innerValue;
      })(source).subscribe(subscriber);
      return function() {
        state = null;
      };
    });
  }
  exports.switchScan = switchScan;
});

// node_modules/rxjs/dist/cjs/internal/operators/takeUntil.js
var require_takeUntil = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.takeUntil = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var innerFrom_1 = require_innerFrom();
  var noop_1 = require_noop();
  function takeUntil(notifier) {
    return lift_1.operate(function(source, subscriber) {
      innerFrom_1.innerFrom(notifier).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
        return subscriber.complete();
      }, noop_1.noop));
      !subscriber.closed && source.subscribe(subscriber);
    });
  }
  exports.takeUntil = takeUntil;
});

// node_modules/rxjs/dist/cjs/internal/operators/takeWhile.js
var require_takeWhile = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.takeWhile = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function takeWhile(predicate, inclusive) {
    if (inclusive === undefined) {
      inclusive = false;
    }
    return lift_1.operate(function(source, subscriber) {
      var index = 0;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        var result = predicate(value, index++);
        (result || inclusive) && subscriber.next(value);
        !result && subscriber.complete();
      }));
    });
  }
  exports.takeWhile = takeWhile;
});

// node_modules/rxjs/dist/cjs/internal/operators/tap.js
var require_tap = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.tap = undefined;
  var isFunction_1 = require_isFunction();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var identity_1 = require_identity();
  function tap(observerOrNext, error, complete) {
    var tapObserver = isFunction_1.isFunction(observerOrNext) || error || complete ? { next: observerOrNext, error, complete } : observerOrNext;
    return tapObserver ? lift_1.operate(function(source, subscriber) {
      var _a;
      (_a = tapObserver.subscribe) === null || _a === undefined || _a.call(tapObserver);
      var isUnsub = true;
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        var _a2;
        (_a2 = tapObserver.next) === null || _a2 === undefined || _a2.call(tapObserver, value);
        subscriber.next(value);
      }, function() {
        var _a2;
        isUnsub = false;
        (_a2 = tapObserver.complete) === null || _a2 === undefined || _a2.call(tapObserver);
        subscriber.complete();
      }, function(err) {
        var _a2;
        isUnsub = false;
        (_a2 = tapObserver.error) === null || _a2 === undefined || _a2.call(tapObserver, err);
        subscriber.error(err);
      }, function() {
        var _a2, _b;
        if (isUnsub) {
          (_a2 = tapObserver.unsubscribe) === null || _a2 === undefined || _a2.call(tapObserver);
        }
        (_b = tapObserver.finalize) === null || _b === undefined || _b.call(tapObserver);
      }));
    }) : identity_1.identity;
  }
  exports.tap = tap;
});

// node_modules/rxjs/dist/cjs/internal/operators/throttle.js
var require_throttle = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.throttle = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var innerFrom_1 = require_innerFrom();
  function throttle(durationSelector, config) {
    return lift_1.operate(function(source, subscriber) {
      var _a = config !== null && config !== undefined ? config : {}, _b = _a.leading, leading = _b === undefined ? true : _b, _c = _a.trailing, trailing = _c === undefined ? false : _c;
      var hasValue = false;
      var sendValue = null;
      var throttled = null;
      var isComplete = false;
      var endThrottling = function() {
        throttled === null || throttled === undefined || throttled.unsubscribe();
        throttled = null;
        if (trailing) {
          send();
          isComplete && subscriber.complete();
        }
      };
      var cleanupThrottling = function() {
        throttled = null;
        isComplete && subscriber.complete();
      };
      var startThrottle = function(value) {
        return throttled = innerFrom_1.innerFrom(durationSelector(value)).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, endThrottling, cleanupThrottling));
      };
      var send = function() {
        if (hasValue) {
          hasValue = false;
          var value = sendValue;
          sendValue = null;
          subscriber.next(value);
          !isComplete && startThrottle(value);
        }
      };
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        hasValue = true;
        sendValue = value;
        !(throttled && !throttled.closed) && (leading ? send() : startThrottle(value));
      }, function() {
        isComplete = true;
        !(trailing && hasValue && throttled && !throttled.closed) && subscriber.complete();
      }));
    });
  }
  exports.throttle = throttle;
});

// node_modules/rxjs/dist/cjs/internal/operators/throttleTime.js
var require_throttleTime = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.throttleTime = undefined;
  var async_1 = require_async();
  var throttle_1 = require_throttle();
  var timer_1 = require_timer();
  function throttleTime(duration, scheduler, config) {
    if (scheduler === undefined) {
      scheduler = async_1.asyncScheduler;
    }
    var duration$ = timer_1.timer(duration, scheduler);
    return throttle_1.throttle(function() {
      return duration$;
    }, config);
  }
  exports.throttleTime = throttleTime;
});

// node_modules/rxjs/dist/cjs/internal/operators/timeInterval.js
var require_timeInterval = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TimeInterval = exports.timeInterval = undefined;
  var async_1 = require_async();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function timeInterval(scheduler) {
    if (scheduler === undefined) {
      scheduler = async_1.asyncScheduler;
    }
    return lift_1.operate(function(source, subscriber) {
      var last = scheduler.now();
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        var now = scheduler.now();
        var interval = now - last;
        last = now;
        subscriber.next(new TimeInterval(value, interval));
      }));
    });
  }
  exports.timeInterval = timeInterval;
  var TimeInterval = function() {
    function TimeInterval2(value, interval) {
      this.value = value;
      this.interval = interval;
    }
    return TimeInterval2;
  }();
  exports.TimeInterval = TimeInterval;
});

// node_modules/rxjs/dist/cjs/internal/operators/timeoutWith.js
var require_timeoutWith = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.timeoutWith = undefined;
  var async_1 = require_async();
  var isDate_1 = require_isDate();
  var timeout_1 = require_timeout();
  function timeoutWith(due, withObservable, scheduler) {
    var first;
    var each;
    var _with;
    scheduler = scheduler !== null && scheduler !== undefined ? scheduler : async_1.async;
    if (isDate_1.isValidDate(due)) {
      first = due;
    } else if (typeof due === "number") {
      each = due;
    }
    if (withObservable) {
      _with = function() {
        return withObservable;
      };
    } else {
      throw new TypeError("No observable provided to switch to");
    }
    if (first == null && each == null) {
      throw new TypeError("No timeout provided.");
    }
    return timeout_1.timeout({
      first,
      each,
      scheduler,
      with: _with
    });
  }
  exports.timeoutWith = timeoutWith;
});

// node_modules/rxjs/dist/cjs/internal/operators/timestamp.js
var require_timestamp = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.timestamp = undefined;
  var dateTimestampProvider_1 = require_dateTimestampProvider();
  var map_1 = require_map();
  function timestamp(timestampProvider) {
    if (timestampProvider === undefined) {
      timestampProvider = dateTimestampProvider_1.dateTimestampProvider;
    }
    return map_1.map(function(value) {
      return { value, timestamp: timestampProvider.now() };
    });
  }
  exports.timestamp = timestamp;
});

// node_modules/rxjs/dist/cjs/internal/operators/window.js
var require_window = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.window = undefined;
  var Subject_1 = require_Subject();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var noop_1 = require_noop();
  var innerFrom_1 = require_innerFrom();
  function window(windowBoundaries) {
    return lift_1.operate(function(source, subscriber) {
      var windowSubject = new Subject_1.Subject;
      subscriber.next(windowSubject.asObservable());
      var errorHandler = function(err) {
        windowSubject.error(err);
        subscriber.error(err);
      };
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        return windowSubject === null || windowSubject === undefined ? undefined : windowSubject.next(value);
      }, function() {
        windowSubject.complete();
        subscriber.complete();
      }, errorHandler));
      innerFrom_1.innerFrom(windowBoundaries).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function() {
        windowSubject.complete();
        subscriber.next(windowSubject = new Subject_1.Subject);
      }, noop_1.noop, errorHandler));
      return function() {
        windowSubject === null || windowSubject === undefined || windowSubject.unsubscribe();
        windowSubject = null;
      };
    });
  }
  exports.window = window;
});

// node_modules/rxjs/dist/cjs/internal/operators/windowCount.js
var require_windowCount = __commonJS((exports) => {
  var __values = exports && exports.__values || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m)
      return m.call(o);
    if (o && typeof o.length === "number")
      return {
        next: function() {
          if (o && i >= o.length)
            o = undefined;
          return { value: o && o[i++], done: !o };
        }
      };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.windowCount = undefined;
  var Subject_1 = require_Subject();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  function windowCount(windowSize, startWindowEvery) {
    if (startWindowEvery === undefined) {
      startWindowEvery = 0;
    }
    var startEvery = startWindowEvery > 0 ? startWindowEvery : windowSize;
    return lift_1.operate(function(source, subscriber) {
      var windows = [new Subject_1.Subject];
      var starts = [];
      var count = 0;
      subscriber.next(windows[0].asObservable());
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        var e_1, _a;
        try {
          for (var windows_1 = __values(windows), windows_1_1 = windows_1.next();!windows_1_1.done; windows_1_1 = windows_1.next()) {
            var window_1 = windows_1_1.value;
            window_1.next(value);
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (windows_1_1 && !windows_1_1.done && (_a = windows_1.return))
              _a.call(windows_1);
          } finally {
            if (e_1)
              throw e_1.error;
          }
        }
        var c = count - windowSize + 1;
        if (c >= 0 && c % startEvery === 0) {
          windows.shift().complete();
        }
        if (++count % startEvery === 0) {
          var window_2 = new Subject_1.Subject;
          windows.push(window_2);
          subscriber.next(window_2.asObservable());
        }
      }, function() {
        while (windows.length > 0) {
          windows.shift().complete();
        }
        subscriber.complete();
      }, function(err) {
        while (windows.length > 0) {
          windows.shift().error(err);
        }
        subscriber.error(err);
      }, function() {
        starts = null;
        windows = null;
      }));
    });
  }
  exports.windowCount = windowCount;
});

// node_modules/rxjs/dist/cjs/internal/operators/windowTime.js
var require_windowTime = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.windowTime = undefined;
  var Subject_1 = require_Subject();
  var async_1 = require_async();
  var Subscription_1 = require_Subscription();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var arrRemove_1 = require_arrRemove();
  var args_1 = require_args();
  var executeSchedule_1 = require_executeSchedule();
  function windowTime(windowTimeSpan) {
    var _a, _b;
    var otherArgs = [];
    for (var _i = 1;_i < arguments.length; _i++) {
      otherArgs[_i - 1] = arguments[_i];
    }
    var scheduler = (_a = args_1.popScheduler(otherArgs)) !== null && _a !== undefined ? _a : async_1.asyncScheduler;
    var windowCreationInterval = (_b = otherArgs[0]) !== null && _b !== undefined ? _b : null;
    var maxWindowSize = otherArgs[1] || Infinity;
    return lift_1.operate(function(source, subscriber) {
      var windowRecords = [];
      var restartOnClose = false;
      var closeWindow = function(record) {
        var { window, subs } = record;
        window.complete();
        subs.unsubscribe();
        arrRemove_1.arrRemove(windowRecords, record);
        restartOnClose && startWindow();
      };
      var startWindow = function() {
        if (windowRecords) {
          var subs = new Subscription_1.Subscription;
          subscriber.add(subs);
          var window_1 = new Subject_1.Subject;
          var record_1 = {
            window: window_1,
            subs,
            seen: 0
          };
          windowRecords.push(record_1);
          subscriber.next(window_1.asObservable());
          executeSchedule_1.executeSchedule(subs, scheduler, function() {
            return closeWindow(record_1);
          }, windowTimeSpan);
        }
      };
      if (windowCreationInterval !== null && windowCreationInterval >= 0) {
        executeSchedule_1.executeSchedule(subscriber, scheduler, startWindow, windowCreationInterval, true);
      } else {
        restartOnClose = true;
      }
      startWindow();
      var loop = function(cb) {
        return windowRecords.slice().forEach(cb);
      };
      var terminate = function(cb) {
        loop(function(_a2) {
          var window = _a2.window;
          return cb(window);
        });
        cb(subscriber);
        subscriber.unsubscribe();
      };
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        loop(function(record) {
          record.window.next(value);
          maxWindowSize <= ++record.seen && closeWindow(record);
        });
      }, function() {
        return terminate(function(consumer) {
          return consumer.complete();
        });
      }, function(err) {
        return terminate(function(consumer) {
          return consumer.error(err);
        });
      }));
      return function() {
        windowRecords = null;
      };
    });
  }
  exports.windowTime = windowTime;
});

// node_modules/rxjs/dist/cjs/internal/operators/windowToggle.js
var require_windowToggle = __commonJS((exports) => {
  var __values = exports && exports.__values || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m)
      return m.call(o);
    if (o && typeof o.length === "number")
      return {
        next: function() {
          if (o && i >= o.length)
            o = undefined;
          return { value: o && o[i++], done: !o };
        }
      };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.windowToggle = undefined;
  var Subject_1 = require_Subject();
  var Subscription_1 = require_Subscription();
  var lift_1 = require_lift();
  var innerFrom_1 = require_innerFrom();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var noop_1 = require_noop();
  var arrRemove_1 = require_arrRemove();
  function windowToggle(openings, closingSelector) {
    return lift_1.operate(function(source, subscriber) {
      var windows = [];
      var handleError = function(err) {
        while (0 < windows.length) {
          windows.shift().error(err);
        }
        subscriber.error(err);
      };
      innerFrom_1.innerFrom(openings).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(openValue) {
        var window = new Subject_1.Subject;
        windows.push(window);
        var closingSubscription = new Subscription_1.Subscription;
        var closeWindow = function() {
          arrRemove_1.arrRemove(windows, window);
          window.complete();
          closingSubscription.unsubscribe();
        };
        var closingNotifier;
        try {
          closingNotifier = innerFrom_1.innerFrom(closingSelector(openValue));
        } catch (err) {
          handleError(err);
          return;
        }
        subscriber.next(window.asObservable());
        closingSubscription.add(closingNotifier.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, closeWindow, noop_1.noop, handleError)));
      }, noop_1.noop));
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        var e_1, _a;
        var windowsCopy = windows.slice();
        try {
          for (var windowsCopy_1 = __values(windowsCopy), windowsCopy_1_1 = windowsCopy_1.next();!windowsCopy_1_1.done; windowsCopy_1_1 = windowsCopy_1.next()) {
            var window_1 = windowsCopy_1_1.value;
            window_1.next(value);
          }
        } catch (e_1_1) {
          e_1 = { error: e_1_1 };
        } finally {
          try {
            if (windowsCopy_1_1 && !windowsCopy_1_1.done && (_a = windowsCopy_1.return))
              _a.call(windowsCopy_1);
          } finally {
            if (e_1)
              throw e_1.error;
          }
        }
      }, function() {
        while (0 < windows.length) {
          windows.shift().complete();
        }
        subscriber.complete();
      }, handleError, function() {
        while (0 < windows.length) {
          windows.shift().unsubscribe();
        }
      }));
    });
  }
  exports.windowToggle = windowToggle;
});

// node_modules/rxjs/dist/cjs/internal/operators/windowWhen.js
var require_windowWhen = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.windowWhen = undefined;
  var Subject_1 = require_Subject();
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var innerFrom_1 = require_innerFrom();
  function windowWhen(closingSelector) {
    return lift_1.operate(function(source, subscriber) {
      var window;
      var closingSubscriber;
      var handleError = function(err) {
        window.error(err);
        subscriber.error(err);
      };
      var openWindow = function() {
        closingSubscriber === null || closingSubscriber === undefined || closingSubscriber.unsubscribe();
        window === null || window === undefined || window.complete();
        window = new Subject_1.Subject;
        subscriber.next(window.asObservable());
        var closingNotifier;
        try {
          closingNotifier = innerFrom_1.innerFrom(closingSelector());
        } catch (err) {
          handleError(err);
          return;
        }
        closingNotifier.subscribe(closingSubscriber = OperatorSubscriber_1.createOperatorSubscriber(subscriber, openWindow, openWindow, handleError));
      };
      openWindow();
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        return window.next(value);
      }, function() {
        window.complete();
        subscriber.complete();
      }, handleError, function() {
        closingSubscriber === null || closingSubscriber === undefined || closingSubscriber.unsubscribe();
        window = null;
      }));
    });
  }
  exports.windowWhen = windowWhen;
});

// node_modules/rxjs/dist/cjs/internal/operators/withLatestFrom.js
var require_withLatestFrom = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.withLatestFrom = undefined;
  var lift_1 = require_lift();
  var OperatorSubscriber_1 = require_OperatorSubscriber();
  var innerFrom_1 = require_innerFrom();
  var identity_1 = require_identity();
  var noop_1 = require_noop();
  var args_1 = require_args();
  function withLatestFrom() {
    var inputs = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      inputs[_i] = arguments[_i];
    }
    var project = args_1.popResultSelector(inputs);
    return lift_1.operate(function(source, subscriber) {
      var len = inputs.length;
      var otherValues = new Array(len);
      var hasValue = inputs.map(function() {
        return false;
      });
      var ready = false;
      var _loop_1 = function(i2) {
        innerFrom_1.innerFrom(inputs[i2]).subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
          otherValues[i2] = value;
          if (!ready && !hasValue[i2]) {
            hasValue[i2] = true;
            (ready = hasValue.every(identity_1.identity)) && (hasValue = null);
          }
        }, noop_1.noop));
      };
      for (var i = 0;i < len; i++) {
        _loop_1(i);
      }
      source.subscribe(OperatorSubscriber_1.createOperatorSubscriber(subscriber, function(value) {
        if (ready) {
          var values = __spreadArray([value], __read(otherValues));
          subscriber.next(project ? project.apply(undefined, __spreadArray([], __read(values))) : values);
        }
      }));
    });
  }
  exports.withLatestFrom = withLatestFrom;
});

// node_modules/rxjs/dist/cjs/internal/operators/zipAll.js
var require_zipAll = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.zipAll = undefined;
  var zip_1 = require_zip();
  var joinAllInternals_1 = require_joinAllInternals();
  function zipAll(project) {
    return joinAllInternals_1.joinAllInternals(zip_1.zip, project);
  }
  exports.zipAll = zipAll;
});

// node_modules/rxjs/dist/cjs/internal/operators/zip.js
var require_zip2 = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.zip = undefined;
  var zip_1 = require_zip();
  var lift_1 = require_lift();
  function zip() {
    var sources = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      sources[_i] = arguments[_i];
    }
    return lift_1.operate(function(source, subscriber) {
      zip_1.zip.apply(undefined, __spreadArray([source], __read(sources))).subscribe(subscriber);
    });
  }
  exports.zip = zip;
});

// node_modules/rxjs/dist/cjs/internal/operators/zipWith.js
var require_zipWith = __commonJS((exports) => {
  var __read = exports && exports.__read || function(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m)
      return o;
    var i = m.call(o), r, ar = [], e;
    try {
      while ((n === undefined || n-- > 0) && !(r = i.next()).done)
        ar.push(r.value);
    } catch (error) {
      e = { error };
    } finally {
      try {
        if (r && !r.done && (m = i["return"]))
          m.call(i);
      } finally {
        if (e)
          throw e.error;
      }
    }
    return ar;
  };
  var __spreadArray = exports && exports.__spreadArray || function(to, from) {
    for (var i = 0, il = from.length, j = to.length;i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.zipWith = undefined;
  var zip_1 = require_zip2();
  function zipWith() {
    var otherInputs = [];
    for (var _i = 0;_i < arguments.length; _i++) {
      otherInputs[_i] = arguments[_i];
    }
    return zip_1.zip.apply(undefined, __spreadArray([], __read(otherInputs)));
  }
  exports.zipWith = zipWith;
});

// node_modules/rxjs/dist/cjs/index.js
var require_cjs = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() {
      return m[k];
    } });
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.interval = exports.iif = exports.generate = exports.fromEventPattern = exports.fromEvent = exports.from = exports.forkJoin = exports.empty = exports.defer = exports.connectable = exports.concat = exports.combineLatest = exports.bindNodeCallback = exports.bindCallback = exports.UnsubscriptionError = exports.TimeoutError = exports.SequenceError = exports.ObjectUnsubscribedError = exports.NotFoundError = exports.EmptyError = exports.ArgumentOutOfRangeError = exports.firstValueFrom = exports.lastValueFrom = exports.isObservable = exports.identity = exports.noop = exports.pipe = exports.NotificationKind = exports.Notification = exports.Subscriber = exports.Subscription = exports.Scheduler = exports.VirtualAction = exports.VirtualTimeScheduler = exports.animationFrameScheduler = exports.animationFrame = exports.queueScheduler = exports.queue = exports.asyncScheduler = exports.async = exports.asapScheduler = exports.asap = exports.AsyncSubject = exports.ReplaySubject = exports.BehaviorSubject = exports.Subject = exports.animationFrames = exports.observable = exports.ConnectableObservable = exports.Observable = undefined;
  exports.filter = exports.expand = exports.exhaustMap = exports.exhaustAll = exports.exhaust = exports.every = exports.endWith = exports.elementAt = exports.distinctUntilKeyChanged = exports.distinctUntilChanged = exports.distinct = exports.dematerialize = exports.delayWhen = exports.delay = exports.defaultIfEmpty = exports.debounceTime = exports.debounce = exports.count = exports.connect = exports.concatWith = exports.concatMapTo = exports.concatMap = exports.concatAll = exports.combineLatestWith = exports.combineLatestAll = exports.combineAll = exports.catchError = exports.bufferWhen = exports.bufferToggle = exports.bufferTime = exports.bufferCount = exports.buffer = exports.auditTime = exports.audit = exports.config = exports.NEVER = exports.EMPTY = exports.scheduled = exports.zip = exports.using = exports.timer = exports.throwError = exports.range = exports.race = exports.partition = exports.pairs = exports.onErrorResumeNext = exports.of = exports.never = exports.merge = undefined;
  exports.switchMap = exports.switchAll = exports.subscribeOn = exports.startWith = exports.skipWhile = exports.skipUntil = exports.skipLast = exports.skip = exports.single = exports.shareReplay = exports.share = exports.sequenceEqual = exports.scan = exports.sampleTime = exports.sample = exports.refCount = exports.retryWhen = exports.retry = exports.repeatWhen = exports.repeat = exports.reduce = exports.raceWith = exports.publishReplay = exports.publishLast = exports.publishBehavior = exports.publish = exports.pluck = exports.pairwise = exports.onErrorResumeNextWith = exports.observeOn = exports.multicast = exports.min = exports.mergeWith = exports.mergeScan = exports.mergeMapTo = exports.mergeMap = exports.flatMap = exports.mergeAll = exports.max = exports.materialize = exports.mapTo = exports.map = exports.last = exports.isEmpty = exports.ignoreElements = exports.groupBy = exports.first = exports.findIndex = exports.find = exports.finalize = undefined;
  exports.zipWith = exports.zipAll = exports.withLatestFrom = exports.windowWhen = exports.windowToggle = exports.windowTime = exports.windowCount = exports.window = exports.toArray = exports.timestamp = exports.timeoutWith = exports.timeout = exports.timeInterval = exports.throwIfEmpty = exports.throttleTime = exports.throttle = exports.tap = exports.takeWhile = exports.takeUntil = exports.takeLast = exports.take = exports.switchScan = exports.switchMapTo = undefined;
  var Observable_1 = require_Observable();
  Object.defineProperty(exports, "Observable", { enumerable: true, get: function() {
    return Observable_1.Observable;
  } });
  var ConnectableObservable_1 = require_ConnectableObservable();
  Object.defineProperty(exports, "ConnectableObservable", { enumerable: true, get: function() {
    return ConnectableObservable_1.ConnectableObservable;
  } });
  var observable_1 = require_observable();
  Object.defineProperty(exports, "observable", { enumerable: true, get: function() {
    return observable_1.observable;
  } });
  var animationFrames_1 = require_animationFrames();
  Object.defineProperty(exports, "animationFrames", { enumerable: true, get: function() {
    return animationFrames_1.animationFrames;
  } });
  var Subject_1 = require_Subject();
  Object.defineProperty(exports, "Subject", { enumerable: true, get: function() {
    return Subject_1.Subject;
  } });
  var BehaviorSubject_1 = require_BehaviorSubject();
  Object.defineProperty(exports, "BehaviorSubject", { enumerable: true, get: function() {
    return BehaviorSubject_1.BehaviorSubject;
  } });
  var ReplaySubject_1 = require_ReplaySubject();
  Object.defineProperty(exports, "ReplaySubject", { enumerable: true, get: function() {
    return ReplaySubject_1.ReplaySubject;
  } });
  var AsyncSubject_1 = require_AsyncSubject();
  Object.defineProperty(exports, "AsyncSubject", { enumerable: true, get: function() {
    return AsyncSubject_1.AsyncSubject;
  } });
  var asap_1 = require_asap();
  Object.defineProperty(exports, "asap", { enumerable: true, get: function() {
    return asap_1.asap;
  } });
  Object.defineProperty(exports, "asapScheduler", { enumerable: true, get: function() {
    return asap_1.asapScheduler;
  } });
  var async_1 = require_async();
  Object.defineProperty(exports, "async", { enumerable: true, get: function() {
    return async_1.async;
  } });
  Object.defineProperty(exports, "asyncScheduler", { enumerable: true, get: function() {
    return async_1.asyncScheduler;
  } });
  var queue_1 = require_queue();
  Object.defineProperty(exports, "queue", { enumerable: true, get: function() {
    return queue_1.queue;
  } });
  Object.defineProperty(exports, "queueScheduler", { enumerable: true, get: function() {
    return queue_1.queueScheduler;
  } });
  var animationFrame_1 = require_animationFrame();
  Object.defineProperty(exports, "animationFrame", { enumerable: true, get: function() {
    return animationFrame_1.animationFrame;
  } });
  Object.defineProperty(exports, "animationFrameScheduler", { enumerable: true, get: function() {
    return animationFrame_1.animationFrameScheduler;
  } });
  var VirtualTimeScheduler_1 = require_VirtualTimeScheduler();
  Object.defineProperty(exports, "VirtualTimeScheduler", { enumerable: true, get: function() {
    return VirtualTimeScheduler_1.VirtualTimeScheduler;
  } });
  Object.defineProperty(exports, "VirtualAction", { enumerable: true, get: function() {
    return VirtualTimeScheduler_1.VirtualAction;
  } });
  var Scheduler_1 = require_Scheduler();
  Object.defineProperty(exports, "Scheduler", { enumerable: true, get: function() {
    return Scheduler_1.Scheduler;
  } });
  var Subscription_1 = require_Subscription();
  Object.defineProperty(exports, "Subscription", { enumerable: true, get: function() {
    return Subscription_1.Subscription;
  } });
  var Subscriber_1 = require_Subscriber();
  Object.defineProperty(exports, "Subscriber", { enumerable: true, get: function() {
    return Subscriber_1.Subscriber;
  } });
  var Notification_1 = require_Notification();
  Object.defineProperty(exports, "Notification", { enumerable: true, get: function() {
    return Notification_1.Notification;
  } });
  Object.defineProperty(exports, "NotificationKind", { enumerable: true, get: function() {
    return Notification_1.NotificationKind;
  } });
  var pipe_1 = require_pipe();
  Object.defineProperty(exports, "pipe", { enumerable: true, get: function() {
    return pipe_1.pipe;
  } });
  var noop_1 = require_noop();
  Object.defineProperty(exports, "noop", { enumerable: true, get: function() {
    return noop_1.noop;
  } });
  var identity_1 = require_identity();
  Object.defineProperty(exports, "identity", { enumerable: true, get: function() {
    return identity_1.identity;
  } });
  var isObservable_1 = require_isObservable();
  Object.defineProperty(exports, "isObservable", { enumerable: true, get: function() {
    return isObservable_1.isObservable;
  } });
  var lastValueFrom_1 = require_lastValueFrom();
  Object.defineProperty(exports, "lastValueFrom", { enumerable: true, get: function() {
    return lastValueFrom_1.lastValueFrom;
  } });
  var firstValueFrom_1 = require_firstValueFrom();
  Object.defineProperty(exports, "firstValueFrom", { enumerable: true, get: function() {
    return firstValueFrom_1.firstValueFrom;
  } });
  var ArgumentOutOfRangeError_1 = require_ArgumentOutOfRangeError();
  Object.defineProperty(exports, "ArgumentOutOfRangeError", { enumerable: true, get: function() {
    return ArgumentOutOfRangeError_1.ArgumentOutOfRangeError;
  } });
  var EmptyError_1 = require_EmptyError();
  Object.defineProperty(exports, "EmptyError", { enumerable: true, get: function() {
    return EmptyError_1.EmptyError;
  } });
  var NotFoundError_1 = require_NotFoundError();
  Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function() {
    return NotFoundError_1.NotFoundError;
  } });
  var ObjectUnsubscribedError_1 = require_ObjectUnsubscribedError();
  Object.defineProperty(exports, "ObjectUnsubscribedError", { enumerable: true, get: function() {
    return ObjectUnsubscribedError_1.ObjectUnsubscribedError;
  } });
  var SequenceError_1 = require_SequenceError();
  Object.defineProperty(exports, "SequenceError", { enumerable: true, get: function() {
    return SequenceError_1.SequenceError;
  } });
  var timeout_1 = require_timeout();
  Object.defineProperty(exports, "TimeoutError", { enumerable: true, get: function() {
    return timeout_1.TimeoutError;
  } });
  var UnsubscriptionError_1 = require_UnsubscriptionError();
  Object.defineProperty(exports, "UnsubscriptionError", { enumerable: true, get: function() {
    return UnsubscriptionError_1.UnsubscriptionError;
  } });
  var bindCallback_1 = require_bindCallback();
  Object.defineProperty(exports, "bindCallback", { enumerable: true, get: function() {
    return bindCallback_1.bindCallback;
  } });
  var bindNodeCallback_1 = require_bindNodeCallback();
  Object.defineProperty(exports, "bindNodeCallback", { enumerable: true, get: function() {
    return bindNodeCallback_1.bindNodeCallback;
  } });
  var combineLatest_1 = require_combineLatest();
  Object.defineProperty(exports, "combineLatest", { enumerable: true, get: function() {
    return combineLatest_1.combineLatest;
  } });
  var concat_1 = require_concat();
  Object.defineProperty(exports, "concat", { enumerable: true, get: function() {
    return concat_1.concat;
  } });
  var connectable_1 = require_connectable();
  Object.defineProperty(exports, "connectable", { enumerable: true, get: function() {
    return connectable_1.connectable;
  } });
  var defer_1 = require_defer();
  Object.defineProperty(exports, "defer", { enumerable: true, get: function() {
    return defer_1.defer;
  } });
  var empty_1 = require_empty2();
  Object.defineProperty(exports, "empty", { enumerable: true, get: function() {
    return empty_1.empty;
  } });
  var forkJoin_1 = require_forkJoin();
  Object.defineProperty(exports, "forkJoin", { enumerable: true, get: function() {
    return forkJoin_1.forkJoin;
  } });
  var from_1 = require_from();
  Object.defineProperty(exports, "from", { enumerable: true, get: function() {
    return from_1.from;
  } });
  var fromEvent_1 = require_fromEvent();
  Object.defineProperty(exports, "fromEvent", { enumerable: true, get: function() {
    return fromEvent_1.fromEvent;
  } });
  var fromEventPattern_1 = require_fromEventPattern();
  Object.defineProperty(exports, "fromEventPattern", { enumerable: true, get: function() {
    return fromEventPattern_1.fromEventPattern;
  } });
  var generate_1 = require_generate();
  Object.defineProperty(exports, "generate", { enumerable: true, get: function() {
    return generate_1.generate;
  } });
  var iif_1 = require_iif();
  Object.defineProperty(exports, "iif", { enumerable: true, get: function() {
    return iif_1.iif;
  } });
  var interval_1 = require_interval();
  Object.defineProperty(exports, "interval", { enumerable: true, get: function() {
    return interval_1.interval;
  } });
  var merge_1 = require_merge();
  Object.defineProperty(exports, "merge", { enumerable: true, get: function() {
    return merge_1.merge;
  } });
  var never_1 = require_never();
  Object.defineProperty(exports, "never", { enumerable: true, get: function() {
    return never_1.never;
  } });
  var of_1 = require_of();
  Object.defineProperty(exports, "of", { enumerable: true, get: function() {
    return of_1.of;
  } });
  var onErrorResumeNext_1 = require_onErrorResumeNext();
  Object.defineProperty(exports, "onErrorResumeNext", { enumerable: true, get: function() {
    return onErrorResumeNext_1.onErrorResumeNext;
  } });
  var pairs_1 = require_pairs();
  Object.defineProperty(exports, "pairs", { enumerable: true, get: function() {
    return pairs_1.pairs;
  } });
  var partition_1 = require_partition();
  Object.defineProperty(exports, "partition", { enumerable: true, get: function() {
    return partition_1.partition;
  } });
  var race_1 = require_race();
  Object.defineProperty(exports, "race", { enumerable: true, get: function() {
    return race_1.race;
  } });
  var range_1 = require_range();
  Object.defineProperty(exports, "range", { enumerable: true, get: function() {
    return range_1.range;
  } });
  var throwError_1 = require_throwError();
  Object.defineProperty(exports, "throwError", { enumerable: true, get: function() {
    return throwError_1.throwError;
  } });
  var timer_1 = require_timer();
  Object.defineProperty(exports, "timer", { enumerable: true, get: function() {
    return timer_1.timer;
  } });
  var using_1 = require_using();
  Object.defineProperty(exports, "using", { enumerable: true, get: function() {
    return using_1.using;
  } });
  var zip_1 = require_zip();
  Object.defineProperty(exports, "zip", { enumerable: true, get: function() {
    return zip_1.zip;
  } });
  var scheduled_1 = require_scheduled();
  Object.defineProperty(exports, "scheduled", { enumerable: true, get: function() {
    return scheduled_1.scheduled;
  } });
  var empty_2 = require_empty2();
  Object.defineProperty(exports, "EMPTY", { enumerable: true, get: function() {
    return empty_2.EMPTY;
  } });
  var never_2 = require_never();
  Object.defineProperty(exports, "NEVER", { enumerable: true, get: function() {
    return never_2.NEVER;
  } });
  __exportStar(require_types(), exports);
  var config_1 = require_config();
  Object.defineProperty(exports, "config", { enumerable: true, get: function() {
    return config_1.config;
  } });
  var audit_1 = require_audit();
  Object.defineProperty(exports, "audit", { enumerable: true, get: function() {
    return audit_1.audit;
  } });
  var auditTime_1 = require_auditTime();
  Object.defineProperty(exports, "auditTime", { enumerable: true, get: function() {
    return auditTime_1.auditTime;
  } });
  var buffer_1 = require_buffer();
  Object.defineProperty(exports, "buffer", { enumerable: true, get: function() {
    return buffer_1.buffer;
  } });
  var bufferCount_1 = require_bufferCount();
  Object.defineProperty(exports, "bufferCount", { enumerable: true, get: function() {
    return bufferCount_1.bufferCount;
  } });
  var bufferTime_1 = require_bufferTime();
  Object.defineProperty(exports, "bufferTime", { enumerable: true, get: function() {
    return bufferTime_1.bufferTime;
  } });
  var bufferToggle_1 = require_bufferToggle();
  Object.defineProperty(exports, "bufferToggle", { enumerable: true, get: function() {
    return bufferToggle_1.bufferToggle;
  } });
  var bufferWhen_1 = require_bufferWhen();
  Object.defineProperty(exports, "bufferWhen", { enumerable: true, get: function() {
    return bufferWhen_1.bufferWhen;
  } });
  var catchError_1 = require_catchError();
  Object.defineProperty(exports, "catchError", { enumerable: true, get: function() {
    return catchError_1.catchError;
  } });
  var combineAll_1 = require_combineAll();
  Object.defineProperty(exports, "combineAll", { enumerable: true, get: function() {
    return combineAll_1.combineAll;
  } });
  var combineLatestAll_1 = require_combineLatestAll();
  Object.defineProperty(exports, "combineLatestAll", { enumerable: true, get: function() {
    return combineLatestAll_1.combineLatestAll;
  } });
  var combineLatestWith_1 = require_combineLatestWith();
  Object.defineProperty(exports, "combineLatestWith", { enumerable: true, get: function() {
    return combineLatestWith_1.combineLatestWith;
  } });
  var concatAll_1 = require_concatAll();
  Object.defineProperty(exports, "concatAll", { enumerable: true, get: function() {
    return concatAll_1.concatAll;
  } });
  var concatMap_1 = require_concatMap();
  Object.defineProperty(exports, "concatMap", { enumerable: true, get: function() {
    return concatMap_1.concatMap;
  } });
  var concatMapTo_1 = require_concatMapTo();
  Object.defineProperty(exports, "concatMapTo", { enumerable: true, get: function() {
    return concatMapTo_1.concatMapTo;
  } });
  var concatWith_1 = require_concatWith();
  Object.defineProperty(exports, "concatWith", { enumerable: true, get: function() {
    return concatWith_1.concatWith;
  } });
  var connect_1 = require_connect();
  Object.defineProperty(exports, "connect", { enumerable: true, get: function() {
    return connect_1.connect;
  } });
  var count_1 = require_count();
  Object.defineProperty(exports, "count", { enumerable: true, get: function() {
    return count_1.count;
  } });
  var debounce_1 = require_debounce();
  Object.defineProperty(exports, "debounce", { enumerable: true, get: function() {
    return debounce_1.debounce;
  } });
  var debounceTime_1 = require_debounceTime();
  Object.defineProperty(exports, "debounceTime", { enumerable: true, get: function() {
    return debounceTime_1.debounceTime;
  } });
  var defaultIfEmpty_1 = require_defaultIfEmpty();
  Object.defineProperty(exports, "defaultIfEmpty", { enumerable: true, get: function() {
    return defaultIfEmpty_1.defaultIfEmpty;
  } });
  var delay_1 = require_delay();
  Object.defineProperty(exports, "delay", { enumerable: true, get: function() {
    return delay_1.delay;
  } });
  var delayWhen_1 = require_delayWhen();
  Object.defineProperty(exports, "delayWhen", { enumerable: true, get: function() {
    return delayWhen_1.delayWhen;
  } });
  var dematerialize_1 = require_dematerialize();
  Object.defineProperty(exports, "dematerialize", { enumerable: true, get: function() {
    return dematerialize_1.dematerialize;
  } });
  var distinct_1 = require_distinct();
  Object.defineProperty(exports, "distinct", { enumerable: true, get: function() {
    return distinct_1.distinct;
  } });
  var distinctUntilChanged_1 = require_distinctUntilChanged();
  Object.defineProperty(exports, "distinctUntilChanged", { enumerable: true, get: function() {
    return distinctUntilChanged_1.distinctUntilChanged;
  } });
  var distinctUntilKeyChanged_1 = require_distinctUntilKeyChanged();
  Object.defineProperty(exports, "distinctUntilKeyChanged", { enumerable: true, get: function() {
    return distinctUntilKeyChanged_1.distinctUntilKeyChanged;
  } });
  var elementAt_1 = require_elementAt();
  Object.defineProperty(exports, "elementAt", { enumerable: true, get: function() {
    return elementAt_1.elementAt;
  } });
  var endWith_1 = require_endWith();
  Object.defineProperty(exports, "endWith", { enumerable: true, get: function() {
    return endWith_1.endWith;
  } });
  var every_1 = require_every();
  Object.defineProperty(exports, "every", { enumerable: true, get: function() {
    return every_1.every;
  } });
  var exhaust_1 = require_exhaust();
  Object.defineProperty(exports, "exhaust", { enumerable: true, get: function() {
    return exhaust_1.exhaust;
  } });
  var exhaustAll_1 = require_exhaustAll();
  Object.defineProperty(exports, "exhaustAll", { enumerable: true, get: function() {
    return exhaustAll_1.exhaustAll;
  } });
  var exhaustMap_1 = require_exhaustMap();
  Object.defineProperty(exports, "exhaustMap", { enumerable: true, get: function() {
    return exhaustMap_1.exhaustMap;
  } });
  var expand_1 = require_expand();
  Object.defineProperty(exports, "expand", { enumerable: true, get: function() {
    return expand_1.expand;
  } });
  var filter_1 = require_filter();
  Object.defineProperty(exports, "filter", { enumerable: true, get: function() {
    return filter_1.filter;
  } });
  var finalize_1 = require_finalize();
  Object.defineProperty(exports, "finalize", { enumerable: true, get: function() {
    return finalize_1.finalize;
  } });
  var find_1 = require_find();
  Object.defineProperty(exports, "find", { enumerable: true, get: function() {
    return find_1.find;
  } });
  var findIndex_1 = require_findIndex();
  Object.defineProperty(exports, "findIndex", { enumerable: true, get: function() {
    return findIndex_1.findIndex;
  } });
  var first_1 = require_first();
  Object.defineProperty(exports, "first", { enumerable: true, get: function() {
    return first_1.first;
  } });
  var groupBy_1 = require_groupBy();
  Object.defineProperty(exports, "groupBy", { enumerable: true, get: function() {
    return groupBy_1.groupBy;
  } });
  var ignoreElements_1 = require_ignoreElements();
  Object.defineProperty(exports, "ignoreElements", { enumerable: true, get: function() {
    return ignoreElements_1.ignoreElements;
  } });
  var isEmpty_1 = require_isEmpty();
  Object.defineProperty(exports, "isEmpty", { enumerable: true, get: function() {
    return isEmpty_1.isEmpty;
  } });
  var last_1 = require_last();
  Object.defineProperty(exports, "last", { enumerable: true, get: function() {
    return last_1.last;
  } });
  var map_1 = require_map();
  Object.defineProperty(exports, "map", { enumerable: true, get: function() {
    return map_1.map;
  } });
  var mapTo_1 = require_mapTo();
  Object.defineProperty(exports, "mapTo", { enumerable: true, get: function() {
    return mapTo_1.mapTo;
  } });
  var materialize_1 = require_materialize();
  Object.defineProperty(exports, "materialize", { enumerable: true, get: function() {
    return materialize_1.materialize;
  } });
  var max_1 = require_max();
  Object.defineProperty(exports, "max", { enumerable: true, get: function() {
    return max_1.max;
  } });
  var mergeAll_1 = require_mergeAll();
  Object.defineProperty(exports, "mergeAll", { enumerable: true, get: function() {
    return mergeAll_1.mergeAll;
  } });
  var flatMap_1 = require_flatMap();
  Object.defineProperty(exports, "flatMap", { enumerable: true, get: function() {
    return flatMap_1.flatMap;
  } });
  var mergeMap_1 = require_mergeMap();
  Object.defineProperty(exports, "mergeMap", { enumerable: true, get: function() {
    return mergeMap_1.mergeMap;
  } });
  var mergeMapTo_1 = require_mergeMapTo();
  Object.defineProperty(exports, "mergeMapTo", { enumerable: true, get: function() {
    return mergeMapTo_1.mergeMapTo;
  } });
  var mergeScan_1 = require_mergeScan();
  Object.defineProperty(exports, "mergeScan", { enumerable: true, get: function() {
    return mergeScan_1.mergeScan;
  } });
  var mergeWith_1 = require_mergeWith();
  Object.defineProperty(exports, "mergeWith", { enumerable: true, get: function() {
    return mergeWith_1.mergeWith;
  } });
  var min_1 = require_min();
  Object.defineProperty(exports, "min", { enumerable: true, get: function() {
    return min_1.min;
  } });
  var multicast_1 = require_multicast();
  Object.defineProperty(exports, "multicast", { enumerable: true, get: function() {
    return multicast_1.multicast;
  } });
  var observeOn_1 = require_observeOn();
  Object.defineProperty(exports, "observeOn", { enumerable: true, get: function() {
    return observeOn_1.observeOn;
  } });
  var onErrorResumeNextWith_1 = require_onErrorResumeNextWith();
  Object.defineProperty(exports, "onErrorResumeNextWith", { enumerable: true, get: function() {
    return onErrorResumeNextWith_1.onErrorResumeNextWith;
  } });
  var pairwise_1 = require_pairwise();
  Object.defineProperty(exports, "pairwise", { enumerable: true, get: function() {
    return pairwise_1.pairwise;
  } });
  var pluck_1 = require_pluck();
  Object.defineProperty(exports, "pluck", { enumerable: true, get: function() {
    return pluck_1.pluck;
  } });
  var publish_1 = require_publish();
  Object.defineProperty(exports, "publish", { enumerable: true, get: function() {
    return publish_1.publish;
  } });
  var publishBehavior_1 = require_publishBehavior();
  Object.defineProperty(exports, "publishBehavior", { enumerable: true, get: function() {
    return publishBehavior_1.publishBehavior;
  } });
  var publishLast_1 = require_publishLast();
  Object.defineProperty(exports, "publishLast", { enumerable: true, get: function() {
    return publishLast_1.publishLast;
  } });
  var publishReplay_1 = require_publishReplay();
  Object.defineProperty(exports, "publishReplay", { enumerable: true, get: function() {
    return publishReplay_1.publishReplay;
  } });
  var raceWith_1 = require_raceWith();
  Object.defineProperty(exports, "raceWith", { enumerable: true, get: function() {
    return raceWith_1.raceWith;
  } });
  var reduce_1 = require_reduce();
  Object.defineProperty(exports, "reduce", { enumerable: true, get: function() {
    return reduce_1.reduce;
  } });
  var repeat_1 = require_repeat();
  Object.defineProperty(exports, "repeat", { enumerable: true, get: function() {
    return repeat_1.repeat;
  } });
  var repeatWhen_1 = require_repeatWhen();
  Object.defineProperty(exports, "repeatWhen", { enumerable: true, get: function() {
    return repeatWhen_1.repeatWhen;
  } });
  var retry_1 = require_retry();
  Object.defineProperty(exports, "retry", { enumerable: true, get: function() {
    return retry_1.retry;
  } });
  var retryWhen_1 = require_retryWhen();
  Object.defineProperty(exports, "retryWhen", { enumerable: true, get: function() {
    return retryWhen_1.retryWhen;
  } });
  var refCount_1 = require_refCount();
  Object.defineProperty(exports, "refCount", { enumerable: true, get: function() {
    return refCount_1.refCount;
  } });
  var sample_1 = require_sample();
  Object.defineProperty(exports, "sample", { enumerable: true, get: function() {
    return sample_1.sample;
  } });
  var sampleTime_1 = require_sampleTime();
  Object.defineProperty(exports, "sampleTime", { enumerable: true, get: function() {
    return sampleTime_1.sampleTime;
  } });
  var scan_1 = require_scan();
  Object.defineProperty(exports, "scan", { enumerable: true, get: function() {
    return scan_1.scan;
  } });
  var sequenceEqual_1 = require_sequenceEqual();
  Object.defineProperty(exports, "sequenceEqual", { enumerable: true, get: function() {
    return sequenceEqual_1.sequenceEqual;
  } });
  var share_1 = require_share();
  Object.defineProperty(exports, "share", { enumerable: true, get: function() {
    return share_1.share;
  } });
  var shareReplay_1 = require_shareReplay();
  Object.defineProperty(exports, "shareReplay", { enumerable: true, get: function() {
    return shareReplay_1.shareReplay;
  } });
  var single_1 = require_single();
  Object.defineProperty(exports, "single", { enumerable: true, get: function() {
    return single_1.single;
  } });
  var skip_1 = require_skip();
  Object.defineProperty(exports, "skip", { enumerable: true, get: function() {
    return skip_1.skip;
  } });
  var skipLast_1 = require_skipLast();
  Object.defineProperty(exports, "skipLast", { enumerable: true, get: function() {
    return skipLast_1.skipLast;
  } });
  var skipUntil_1 = require_skipUntil();
  Object.defineProperty(exports, "skipUntil", { enumerable: true, get: function() {
    return skipUntil_1.skipUntil;
  } });
  var skipWhile_1 = require_skipWhile();
  Object.defineProperty(exports, "skipWhile", { enumerable: true, get: function() {
    return skipWhile_1.skipWhile;
  } });
  var startWith_1 = require_startWith();
  Object.defineProperty(exports, "startWith", { enumerable: true, get: function() {
    return startWith_1.startWith;
  } });
  var subscribeOn_1 = require_subscribeOn();
  Object.defineProperty(exports, "subscribeOn", { enumerable: true, get: function() {
    return subscribeOn_1.subscribeOn;
  } });
  var switchAll_1 = require_switchAll();
  Object.defineProperty(exports, "switchAll", { enumerable: true, get: function() {
    return switchAll_1.switchAll;
  } });
  var switchMap_1 = require_switchMap();
  Object.defineProperty(exports, "switchMap", { enumerable: true, get: function() {
    return switchMap_1.switchMap;
  } });
  var switchMapTo_1 = require_switchMapTo();
  Object.defineProperty(exports, "switchMapTo", { enumerable: true, get: function() {
    return switchMapTo_1.switchMapTo;
  } });
  var switchScan_1 = require_switchScan();
  Object.defineProperty(exports, "switchScan", { enumerable: true, get: function() {
    return switchScan_1.switchScan;
  } });
  var take_1 = require_take();
  Object.defineProperty(exports, "take", { enumerable: true, get: function() {
    return take_1.take;
  } });
  var takeLast_1 = require_takeLast();
  Object.defineProperty(exports, "takeLast", { enumerable: true, get: function() {
    return takeLast_1.takeLast;
  } });
  var takeUntil_1 = require_takeUntil();
  Object.defineProperty(exports, "takeUntil", { enumerable: true, get: function() {
    return takeUntil_1.takeUntil;
  } });
  var takeWhile_1 = require_takeWhile();
  Object.defineProperty(exports, "takeWhile", { enumerable: true, get: function() {
    return takeWhile_1.takeWhile;
  } });
  var tap_1 = require_tap();
  Object.defineProperty(exports, "tap", { enumerable: true, get: function() {
    return tap_1.tap;
  } });
  var throttle_1 = require_throttle();
  Object.defineProperty(exports, "throttle", { enumerable: true, get: function() {
    return throttle_1.throttle;
  } });
  var throttleTime_1 = require_throttleTime();
  Object.defineProperty(exports, "throttleTime", { enumerable: true, get: function() {
    return throttleTime_1.throttleTime;
  } });
  var throwIfEmpty_1 = require_throwIfEmpty();
  Object.defineProperty(exports, "throwIfEmpty", { enumerable: true, get: function() {
    return throwIfEmpty_1.throwIfEmpty;
  } });
  var timeInterval_1 = require_timeInterval();
  Object.defineProperty(exports, "timeInterval", { enumerable: true, get: function() {
    return timeInterval_1.timeInterval;
  } });
  var timeout_2 = require_timeout();
  Object.defineProperty(exports, "timeout", { enumerable: true, get: function() {
    return timeout_2.timeout;
  } });
  var timeoutWith_1 = require_timeoutWith();
  Object.defineProperty(exports, "timeoutWith", { enumerable: true, get: function() {
    return timeoutWith_1.timeoutWith;
  } });
  var timestamp_1 = require_timestamp();
  Object.defineProperty(exports, "timestamp", { enumerable: true, get: function() {
    return timestamp_1.timestamp;
  } });
  var toArray_1 = require_toArray();
  Object.defineProperty(exports, "toArray", { enumerable: true, get: function() {
    return toArray_1.toArray;
  } });
  var window_1 = require_window();
  Object.defineProperty(exports, "window", { enumerable: true, get: function() {
    return window_1.window;
  } });
  var windowCount_1 = require_windowCount();
  Object.defineProperty(exports, "windowCount", { enumerable: true, get: function() {
    return windowCount_1.windowCount;
  } });
  var windowTime_1 = require_windowTime();
  Object.defineProperty(exports, "windowTime", { enumerable: true, get: function() {
    return windowTime_1.windowTime;
  } });
  var windowToggle_1 = require_windowToggle();
  Object.defineProperty(exports, "windowToggle", { enumerable: true, get: function() {
    return windowToggle_1.windowToggle;
  } });
  var windowWhen_1 = require_windowWhen();
  Object.defineProperty(exports, "windowWhen", { enumerable: true, get: function() {
    return windowWhen_1.windowWhen;
  } });
  var withLatestFrom_1 = require_withLatestFrom();
  Object.defineProperty(exports, "withLatestFrom", { enumerable: true, get: function() {
    return withLatestFrom_1.withLatestFrom;
  } });
  var zipAll_1 = require_zipAll();
  Object.defineProperty(exports, "zipAll", { enumerable: true, get: function() {
    return zipAll_1.zipAll;
  } });
  var zipWith_1 = require_zipWith();
  Object.defineProperty(exports, "zipWith", { enumerable: true, get: function() {
    return zipWith_1.zipWith;
  } });
});

// node_modules/run-async/index.js
var require_run_async = __commonJS((exports, module) => {
  function isPromise(obj) {
    return !!obj && (typeof obj === "object" || typeof obj === "function") && typeof obj.then === "function";
  }
  var runAsync = module.exports = function(func, cb, proxyProperty = "async") {
    if (typeof cb === "string") {
      proxyProperty = cb;
      cb = undefined;
    }
    cb = cb || function() {
    };
    return function() {
      var args = arguments;
      var originalThis = this;
      var promise = new Promise(function(resolve, reject) {
        var resolved = false;
        const wrappedResolve = function(value) {
          if (resolved) {
            console.warn("Run-async promise already resolved.");
          }
          resolved = true;
          resolve(value);
        };
        var rejected = false;
        const wrappedReject = function(value) {
          if (rejected) {
            console.warn("Run-async promise already rejected.");
          }
          rejected = true;
          reject(value);
        };
        var usingCallback = false;
        var callbackConflict = false;
        var contextEnded = false;
        var doneFactory = function() {
          if (contextEnded) {
            console.warn("Run-async async() called outside a valid run-async context, callback will be ignored.");
            return function() {
            };
          }
          if (callbackConflict) {
            console.warn(`Run-async wrapped function (async) returned a promise.
Calls to async() callback can have unexpected results.`);
          }
          usingCallback = true;
          return function(err, value) {
            if (err) {
              wrappedReject(err);
            } else {
              wrappedResolve(value);
            }
          };
        };
        var _this;
        if (originalThis && proxyProperty && Proxy) {
          _this = new Proxy(originalThis, {
            get(_target, prop) {
              if (prop === proxyProperty) {
                if (prop in _target) {
                  console.warn(`${proxyProperty} property is been shadowed by run-sync`);
                }
                return doneFactory;
              }
              return Reflect.get(...arguments);
            }
          });
        } else {
          _this = { [proxyProperty]: doneFactory };
        }
        var answer = func.apply(_this, Array.prototype.slice.call(args));
        if (usingCallback) {
          if (isPromise(answer)) {
            console.warn("Run-async wrapped function (sync) returned a promise but async() callback must be executed to resolve.");
          }
        } else {
          if (isPromise(answer)) {
            callbackConflict = true;
            answer.then(wrappedResolve, wrappedReject);
          } else {
            wrappedResolve(answer);
          }
        }
        contextEnded = true;
      });
      promise.then(cb.bind(null, null), cb);
      return promise;
    };
  };
  runAsync.cb = function(func, cb) {
    return runAsync(function() {
      var args = Array.prototype.slice.call(arguments);
      if (args.length === func.length - 1) {
        args.push(this.async());
      }
      return func.apply(this, args);
    }, cb);
  };
});

// node_modules/commander/esm.mjs
var import__ = __toESM(require_commander(), 1);
var {
  program,
  createCommand,
  createArgument,
  createOption,
  CommanderError,
  InvalidArgumentError,
  InvalidOptionArgumentError,
  Command,
  Argument,
  Option,
  Help
} = import__.default;

// index.ts
var import_fs_extra = __toESM(require_lib(), 1);
import path from "path";

// node_modules/ora/index.js
import process9 from "node:process";

// node_modules/chalk/source/vendor/ansi-styles/index.js
var ANSI_BACKGROUND_OFFSET = 10;
var wrapAnsi16 = (offset = 0) => (code) => `\x1B[${code + offset}m`;
var wrapAnsi256 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`;
var wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
var styles = {
  modifier: {
    reset: [0, 0],
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29]
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    blackBright: [90, 39],
    gray: [90, 39],
    grey: [90, 39],
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39]
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    bgGrey: [100, 49],
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49]
  }
};
var modifierNames = Object.keys(styles.modifier);
var foregroundColorNames = Object.keys(styles.color);
var backgroundColorNames = Object.keys(styles.bgColor);
var colorNames = [...foregroundColorNames, ...backgroundColorNames];
function assembleStyles() {
  const codes = new Map;
  for (const [groupName, group] of Object.entries(styles)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`
      };
      group[styleName] = styles[styleName];
      codes.set(style[0], style[1]);
    }
    Object.defineProperty(styles, groupName, {
      value: group,
      enumerable: false
    });
  }
  Object.defineProperty(styles, "codes", {
    value: codes,
    enumerable: false
  });
  styles.color.close = "\x1B[39m";
  styles.bgColor.close = "\x1B[49m";
  styles.color.ansi = wrapAnsi16();
  styles.color.ansi256 = wrapAnsi256();
  styles.color.ansi16m = wrapAnsi16m();
  styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
  Object.defineProperties(styles, {
    rgbToAnsi256: {
      value(red, green, blue) {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16;
          }
          if (red > 248) {
            return 231;
          }
          return Math.round((red - 8) / 247 * 24) + 232;
        }
        return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
      },
      enumerable: false
    },
    hexToRgb: {
      value(hex) {
        const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
        if (!matches) {
          return [0, 0, 0];
        }
        let [colorString] = matches;
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join("");
        }
        const integer = Number.parseInt(colorString, 16);
        return [
          integer >> 16 & 255,
          integer >> 8 & 255,
          integer & 255
        ];
      },
      enumerable: false
    },
    hexToAnsi256: {
      value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
      enumerable: false
    },
    ansi256ToAnsi: {
      value(code) {
        if (code < 8) {
          return 30 + code;
        }
        if (code < 16) {
          return 90 + (code - 8);
        }
        let red;
        let green;
        let blue;
        if (code >= 232) {
          red = ((code - 232) * 10 + 8) / 255;
          green = red;
          blue = red;
        } else {
          code -= 16;
          const remainder = code % 36;
          red = Math.floor(code / 36) / 5;
          green = Math.floor(remainder / 6) / 5;
          blue = remainder % 6 / 5;
        }
        const value = Math.max(red, green, blue) * 2;
        if (value === 0) {
          return 30;
        }
        let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
        if (value === 2) {
          result += 60;
        }
        return result;
      },
      enumerable: false
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
      enumerable: false
    },
    hexToAnsi: {
      value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
      enumerable: false
    }
  });
  return styles;
}
var ansiStyles = assembleStyles();
var ansi_styles_default = ansiStyles;

// node_modules/chalk/source/vendor/supports-color/index.js
import process2 from "node:process";
import os from "node:os";
import tty from "node:tty";
function hasFlag(flag, argv = globalThis.Deno ? globalThis.Deno.args : process2.argv) {
  const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf("--");
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}
var { env } = process2;
var flagForceColor;
if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
  flagForceColor = 0;
} else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
  flagForceColor = 1;
}
function envForceColor() {
  if ("FORCE_COLOR" in env) {
    if (env.FORCE_COLOR === "true") {
      return 1;
    }
    if (env.FORCE_COLOR === "false") {
      return 0;
    }
    return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
  }
}
function translateLevel(level) {
  if (level === 0) {
    return false;
  }
  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3
  };
}
function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
  const noFlagForceColor = envForceColor();
  if (noFlagForceColor !== undefined) {
    flagForceColor = noFlagForceColor;
  }
  const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
  if (forceColor === 0) {
    return 0;
  }
  if (sniffFlags) {
    if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
      return 3;
    }
    if (hasFlag("color=256")) {
      return 2;
    }
  }
  if ("TF_BUILD" in env && "AGENT_NAME" in env) {
    return 1;
  }
  if (haveStream && !streamIsTTY && forceColor === undefined) {
    return 0;
  }
  const min = forceColor || 0;
  if (env.TERM === "dumb") {
    return min;
  }
  if (process2.platform === "win32") {
    const osRelease = os.release().split(".");
    if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return Number(osRelease[2]) >= 14931 ? 3 : 2;
    }
    return 1;
  }
  if ("CI" in env) {
    if (["GITHUB_ACTIONS", "GITEA_ACTIONS", "CIRCLECI"].some((key) => (key in env))) {
      return 3;
    }
    if (["TRAVIS", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"].some((sign) => (sign in env)) || env.CI_NAME === "codeship") {
      return 1;
    }
    return min;
  }
  if ("TEAMCITY_VERSION" in env) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
  }
  if (env.COLORTERM === "truecolor") {
    return 3;
  }
  if (env.TERM === "xterm-kitty") {
    return 3;
  }
  if ("TERM_PROGRAM" in env) {
    const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
    switch (env.TERM_PROGRAM) {
      case "iTerm.app": {
        return version >= 3 ? 3 : 2;
      }
      case "Apple_Terminal": {
        return 2;
      }
    }
  }
  if (/-256(color)?$/i.test(env.TERM)) {
    return 2;
  }
  if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1;
  }
  if ("COLORTERM" in env) {
    return 1;
  }
  return min;
}
function createSupportsColor(stream, options = {}) {
  const level = _supportsColor(stream, {
    streamIsTTY: stream && stream.isTTY,
    ...options
  });
  return translateLevel(level);
}
var supportsColor = {
  stdout: createSupportsColor({ isTTY: tty.isatty(1) }),
  stderr: createSupportsColor({ isTTY: tty.isatty(2) })
};
var supports_color_default = supportsColor;

// node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, replacer) {
  let index = string.indexOf(substring);
  if (index === -1) {
    return string;
  }
  const substringLength = substring.length;
  let endIndex = 0;
  let returnValue = "";
  do {
    returnValue += string.slice(endIndex, index) + substring + replacer;
    endIndex = index + substringLength;
    index = string.indexOf(substring, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
  let endIndex = 0;
  let returnValue = "";
  do {
    const gotCR = string[index - 1] === "\r";
    returnValue += string.slice(endIndex, gotCR ? index - 1 : index) + prefix + (gotCR ? `\r
` : `
`) + postfix;
    endIndex = index + 1;
    index = string.indexOf(`
`, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}

// node_modules/chalk/source/index.js
var { stdout: stdoutColor, stderr: stderrColor } = supports_color_default;
var GENERATOR = Symbol("GENERATOR");
var STYLER = Symbol("STYLER");
var IS_EMPTY = Symbol("IS_EMPTY");
var levelMapping = [
  "ansi",
  "ansi",
  "ansi256",
  "ansi16m"
];
var styles2 = Object.create(null);
var applyOptions = (object, options = {}) => {
  if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) {
    throw new Error("The `level` option should be an integer from 0 to 3");
  }
  const colorLevel = stdoutColor ? stdoutColor.level : 0;
  object.level = options.level === undefined ? colorLevel : options.level;
};
var chalkFactory = (options) => {
  const chalk = (...strings) => strings.join(" ");
  applyOptions(chalk, options);
  Object.setPrototypeOf(chalk, createChalk.prototype);
  return chalk;
};
function createChalk(options) {
  return chalkFactory(options);
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansi_styles_default)) {
  styles2[styleName] = {
    get() {
      const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
      Object.defineProperty(this, styleName, { value: builder });
      return builder;
    }
  };
}
styles2.visible = {
  get() {
    const builder = createBuilder(this, this[STYLER], true);
    Object.defineProperty(this, "visible", { value: builder });
    return builder;
  }
};
var getModelAnsi = (model, level, type, ...arguments_) => {
  if (model === "rgb") {
    if (level === "ansi16m") {
      return ansi_styles_default[type].ansi16m(...arguments_);
    }
    if (level === "ansi256") {
      return ansi_styles_default[type].ansi256(ansi_styles_default.rgbToAnsi256(...arguments_));
    }
    return ansi_styles_default[type].ansi(ansi_styles_default.rgbToAnsi(...arguments_));
  }
  if (model === "hex") {
    return getModelAnsi("rgb", level, type, ...ansi_styles_default.hexToRgb(...arguments_));
  }
  return ansi_styles_default[type][model](...arguments_);
};
var usedModels = ["rgb", "hex", "ansi256"];
for (const model of usedModels) {
  styles2[model] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "color", ...arguments_), ansi_styles_default.color.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
  const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
  styles2[bgModel] = {
    get() {
      const { level } = this;
      return function(...arguments_) {
        const styler = createStyler(getModelAnsi(model, levelMapping[level], "bgColor", ...arguments_), ansi_styles_default.bgColor.close, this[STYLER]);
        return createBuilder(this, styler, this[IS_EMPTY]);
      };
    }
  };
}
var proto = Object.defineProperties(() => {
}, {
  ...styles2,
  level: {
    enumerable: true,
    get() {
      return this[GENERATOR].level;
    },
    set(level) {
      this[GENERATOR].level = level;
    }
  }
});
var createStyler = (open, close, parent) => {
  let openAll;
  let closeAll;
  if (parent === undefined) {
    openAll = open;
    closeAll = close;
  } else {
    openAll = parent.openAll + open;
    closeAll = close + parent.closeAll;
  }
  return {
    open,
    close,
    openAll,
    closeAll,
    parent
  };
};
var createBuilder = (self, _styler, _isEmpty) => {
  const builder = (...arguments_) => applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
  Object.setPrototypeOf(builder, proto);
  builder[GENERATOR] = self;
  builder[STYLER] = _styler;
  builder[IS_EMPTY] = _isEmpty;
  return builder;
};
var applyStyle = (self, string) => {
  if (self.level <= 0 || !string) {
    return self[IS_EMPTY] ? "" : string;
  }
  let styler = self[STYLER];
  if (styler === undefined) {
    return string;
  }
  const { openAll, closeAll } = styler;
  if (string.includes("\x1B")) {
    while (styler !== undefined) {
      string = stringReplaceAll(string, styler.close, styler.open);
      styler = styler.parent;
    }
  }
  const lfIndex = string.indexOf(`
`);
  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
  }
  return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, styles2);
var chalk = createChalk();
var chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });
var source_default = chalk;

// node_modules/cli-cursor/index.js
import process5 from "node:process";

// node_modules/restore-cursor/index.js
import process4 from "node:process";

// node_modules/mimic-function/index.js
var copyProperty = (to, from, property, ignoreNonConfigurable) => {
  if (property === "length" || property === "prototype") {
    return;
  }
  if (property === "arguments" || property === "caller") {
    return;
  }
  const toDescriptor = Object.getOwnPropertyDescriptor(to, property);
  const fromDescriptor = Object.getOwnPropertyDescriptor(from, property);
  if (!canCopyProperty(toDescriptor, fromDescriptor) && ignoreNonConfigurable) {
    return;
  }
  Object.defineProperty(to, property, fromDescriptor);
};
var canCopyProperty = function(toDescriptor, fromDescriptor) {
  return toDescriptor === undefined || toDescriptor.configurable || toDescriptor.writable === fromDescriptor.writable && toDescriptor.enumerable === fromDescriptor.enumerable && toDescriptor.configurable === fromDescriptor.configurable && (toDescriptor.writable || toDescriptor.value === fromDescriptor.value);
};
var changePrototype = (to, from) => {
  const fromPrototype = Object.getPrototypeOf(from);
  if (fromPrototype === Object.getPrototypeOf(to)) {
    return;
  }
  Object.setPrototypeOf(to, fromPrototype);
};
var wrappedToString = (withName, fromBody) => `/* Wrapped ${withName}*/
${fromBody}`;
var toStringDescriptor = Object.getOwnPropertyDescriptor(Function.prototype, "toString");
var toStringName = Object.getOwnPropertyDescriptor(Function.prototype.toString, "name");
var changeToString = (to, from, name) => {
  const withName = name === "" ? "" : `with ${name.trim()}() `;
  const newToString = wrappedToString.bind(null, withName, from.toString());
  Object.defineProperty(newToString, "name", toStringName);
  const { writable, enumerable, configurable } = toStringDescriptor;
  Object.defineProperty(to, "toString", { value: newToString, writable, enumerable, configurable });
};
function mimicFunction(to, from, { ignoreNonConfigurable = false } = {}) {
  const { name } = to;
  for (const property of Reflect.ownKeys(from)) {
    copyProperty(to, from, property, ignoreNonConfigurable);
  }
  changePrototype(to, from);
  changeToString(to, from, name);
  return to;
}

// node_modules/onetime/index.js
var calledFunctions = new WeakMap;
var onetime = (function_, options = {}) => {
  if (typeof function_ !== "function") {
    throw new TypeError("Expected a function");
  }
  let returnValue;
  let callCount = 0;
  const functionName = function_.displayName || function_.name || "<anonymous>";
  const onetime2 = function(...arguments_) {
    calledFunctions.set(onetime2, ++callCount);
    if (callCount === 1) {
      returnValue = function_.apply(this, arguments_);
      function_ = undefined;
    } else if (options.throw === true) {
      throw new Error(`Function \`${functionName}\` can only be called once`);
    }
    return returnValue;
  };
  mimicFunction(onetime2, function_);
  calledFunctions.set(onetime2, callCount);
  return onetime2;
};
onetime.callCount = (function_) => {
  if (!calledFunctions.has(function_)) {
    throw new Error(`The given function \`${function_.name}\` is not wrapped by the \`onetime\` package`);
  }
  return calledFunctions.get(function_);
};
var onetime_default = onetime;

// node_modules/signal-exit/dist/mjs/signals.js
var signals = [];
signals.push("SIGHUP", "SIGINT", "SIGTERM");
if (process.platform !== "win32") {
  signals.push("SIGALRM", "SIGABRT", "SIGVTALRM", "SIGXCPU", "SIGXFSZ", "SIGUSR2", "SIGTRAP", "SIGSYS", "SIGQUIT", "SIGIOT");
}
if (process.platform === "linux") {
  signals.push("SIGIO", "SIGPOLL", "SIGPWR", "SIGSTKFLT");
}

// node_modules/signal-exit/dist/mjs/index.js
var processOk = (process3) => !!process3 && typeof process3 === "object" && typeof process3.removeListener === "function" && typeof process3.emit === "function" && typeof process3.reallyExit === "function" && typeof process3.listeners === "function" && typeof process3.kill === "function" && typeof process3.pid === "number" && typeof process3.on === "function";
var kExitEmitter = Symbol.for("signal-exit emitter");
var global2 = globalThis;
var ObjectDefineProperty = Object.defineProperty.bind(Object);

class Emitter {
  emitted = {
    afterExit: false,
    exit: false
  };
  listeners = {
    afterExit: [],
    exit: []
  };
  count = 0;
  id = Math.random();
  constructor() {
    if (global2[kExitEmitter]) {
      return global2[kExitEmitter];
    }
    ObjectDefineProperty(global2, kExitEmitter, {
      value: this,
      writable: false,
      enumerable: false,
      configurable: false
    });
  }
  on(ev, fn) {
    this.listeners[ev].push(fn);
  }
  removeListener(ev, fn) {
    const list = this.listeners[ev];
    const i = list.indexOf(fn);
    if (i === -1) {
      return;
    }
    if (i === 0 && list.length === 1) {
      list.length = 0;
    } else {
      list.splice(i, 1);
    }
  }
  emit(ev, code, signal) {
    if (this.emitted[ev]) {
      return false;
    }
    this.emitted[ev] = true;
    let ret = false;
    for (const fn of this.listeners[ev]) {
      ret = fn(code, signal) === true || ret;
    }
    if (ev === "exit") {
      ret = this.emit("afterExit", code, signal) || ret;
    }
    return ret;
  }
}

class SignalExitBase {
}
var signalExitWrap = (handler) => {
  return {
    onExit(cb, opts) {
      return handler.onExit(cb, opts);
    },
    load() {
      return handler.load();
    },
    unload() {
      return handler.unload();
    }
  };
};

class SignalExitFallback extends SignalExitBase {
  onExit() {
    return () => {
    };
  }
  load() {
  }
  unload() {
  }
}

class SignalExit extends SignalExitBase {
  #hupSig = process3.platform === "win32" ? "SIGINT" : "SIGHUP";
  #emitter = new Emitter;
  #process;
  #originalProcessEmit;
  #originalProcessReallyExit;
  #sigListeners = {};
  #loaded = false;
  constructor(process3) {
    super();
    this.#process = process3;
    this.#sigListeners = {};
    for (const sig of signals) {
      this.#sigListeners[sig] = () => {
        const listeners = this.#process.listeners(sig);
        let { count } = this.#emitter;
        const p = process3;
        if (typeof p.__signal_exit_emitter__ === "object" && typeof p.__signal_exit_emitter__.count === "number") {
          count += p.__signal_exit_emitter__.count;
        }
        if (listeners.length === count) {
          this.unload();
          const ret = this.#emitter.emit("exit", null, sig);
          const s = sig === "SIGHUP" ? this.#hupSig : sig;
          if (!ret)
            process3.kill(process3.pid, s);
        }
      };
    }
    this.#originalProcessReallyExit = process3.reallyExit;
    this.#originalProcessEmit = process3.emit;
  }
  onExit(cb, opts) {
    if (!processOk(this.#process)) {
      return () => {
      };
    }
    if (this.#loaded === false) {
      this.load();
    }
    const ev = opts?.alwaysLast ? "afterExit" : "exit";
    this.#emitter.on(ev, cb);
    return () => {
      this.#emitter.removeListener(ev, cb);
      if (this.#emitter.listeners["exit"].length === 0 && this.#emitter.listeners["afterExit"].length === 0) {
        this.unload();
      }
    };
  }
  load() {
    if (this.#loaded) {
      return;
    }
    this.#loaded = true;
    this.#emitter.count += 1;
    for (const sig of signals) {
      try {
        const fn = this.#sigListeners[sig];
        if (fn)
          this.#process.on(sig, fn);
      } catch (_) {
      }
    }
    this.#process.emit = (ev, ...a) => {
      return this.#processEmit(ev, ...a);
    };
    this.#process.reallyExit = (code) => {
      return this.#processReallyExit(code);
    };
  }
  unload() {
    if (!this.#loaded) {
      return;
    }
    this.#loaded = false;
    signals.forEach((sig) => {
      const listener = this.#sigListeners[sig];
      if (!listener) {
        throw new Error("Listener not defined for signal: " + sig);
      }
      try {
        this.#process.removeListener(sig, listener);
      } catch (_) {
      }
    });
    this.#process.emit = this.#originalProcessEmit;
    this.#process.reallyExit = this.#originalProcessReallyExit;
    this.#emitter.count -= 1;
  }
  #processReallyExit(code) {
    if (!processOk(this.#process)) {
      return 0;
    }
    this.#process.exitCode = code || 0;
    this.#emitter.emit("exit", this.#process.exitCode, null);
    return this.#originalProcessReallyExit.call(this.#process, this.#process.exitCode);
  }
  #processEmit(ev, ...args) {
    const og = this.#originalProcessEmit;
    if (ev === "exit" && processOk(this.#process)) {
      if (typeof args[0] === "number") {
        this.#process.exitCode = args[0];
      }
      const ret = og.call(this.#process, ev, ...args);
      this.#emitter.emit("exit", this.#process.exitCode, null);
      return ret;
    } else {
      return og.call(this.#process, ev, ...args);
    }
  }
}
var process3 = globalThis.process;
var {
  onExit,
  load,
  unload
} = signalExitWrap(processOk(process3) ? new SignalExit(process3) : new SignalExitFallback);

// node_modules/restore-cursor/index.js
var terminal = process4.stderr.isTTY ? process4.stderr : process4.stdout.isTTY ? process4.stdout : undefined;
var restoreCursor = terminal ? onetime_default(() => {
  onExit(() => {
    terminal.write("\x1B[?25h");
  }, { alwaysLast: true });
}) : () => {
};
var restore_cursor_default = restoreCursor;

// node_modules/cli-cursor/index.js
var isHidden = false;
var cliCursor = {};
cliCursor.show = (writableStream = process5.stderr) => {
  if (!writableStream.isTTY) {
    return;
  }
  isHidden = false;
  writableStream.write("\x1B[?25h");
};
cliCursor.hide = (writableStream = process5.stderr) => {
  if (!writableStream.isTTY) {
    return;
  }
  restore_cursor_default();
  isHidden = true;
  writableStream.write("\x1B[?25l");
};
cliCursor.toggle = (force, writableStream) => {
  if (force !== undefined) {
    isHidden = force;
  }
  if (isHidden) {
    cliCursor.show(writableStream);
  } else {
    cliCursor.hide(writableStream);
  }
};
var cli_cursor_default = cliCursor;

// node_modules/ora/index.js
var import_cli_spinners = __toESM(require_cli_spinners(), 1);

// node_modules/log-symbols/node_modules/is-unicode-supported/index.js
import process6 from "node:process";
function isUnicodeSupported() {
  if (process6.platform !== "win32") {
    return process6.env.TERM !== "linux";
  }
  return Boolean(process6.env.CI) || Boolean(process6.env.WT_SESSION) || Boolean(process6.env.TERMINUS_SUBLIME) || process6.env.ConEmuTask === "{cmd::Cmder}" || process6.env.TERM_PROGRAM === "Terminus-Sublime" || process6.env.TERM_PROGRAM === "vscode" || process6.env.TERM === "xterm-256color" || process6.env.TERM === "alacritty" || process6.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}

// node_modules/log-symbols/index.js
var main = {
  info: source_default.blue("ℹ"),
  success: source_default.green("✔"),
  warning: source_default.yellow("⚠"),
  error: source_default.red("✖")
};
var fallback = {
  info: source_default.blue("i"),
  success: source_default.green("√"),
  warning: source_default.yellow("‼"),
  error: source_default.red("×")
};
var logSymbols = isUnicodeSupported() ? main : fallback;
var log_symbols_default = logSymbols;

// node_modules/ansi-regex/index.js
function ansiRegex({ onlyFirst = false } = {}) {
  const ST = "(?:\\u0007|\\u001B\\u005C|\\u009C)";
  const pattern = [
    `[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?${ST})`,
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))"
  ].join("|");
  return new RegExp(pattern, onlyFirst ? undefined : "g");
}

// node_modules/strip-ansi/index.js
var regex = ansiRegex();
function stripAnsi(string) {
  if (typeof string !== "string") {
    throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
  }
  return string.replace(regex, "");
}

// node_modules/get-east-asian-width/lookup.js
function isAmbiguous(x) {
  return x === 161 || x === 164 || x === 167 || x === 168 || x === 170 || x === 173 || x === 174 || x >= 176 && x <= 180 || x >= 182 && x <= 186 || x >= 188 && x <= 191 || x === 198 || x === 208 || x === 215 || x === 216 || x >= 222 && x <= 225 || x === 230 || x >= 232 && x <= 234 || x === 236 || x === 237 || x === 240 || x === 242 || x === 243 || x >= 247 && x <= 250 || x === 252 || x === 254 || x === 257 || x === 273 || x === 275 || x === 283 || x === 294 || x === 295 || x === 299 || x >= 305 && x <= 307 || x === 312 || x >= 319 && x <= 322 || x === 324 || x >= 328 && x <= 331 || x === 333 || x === 338 || x === 339 || x === 358 || x === 359 || x === 363 || x === 462 || x === 464 || x === 466 || x === 468 || x === 470 || x === 472 || x === 474 || x === 476 || x === 593 || x === 609 || x === 708 || x === 711 || x >= 713 && x <= 715 || x === 717 || x === 720 || x >= 728 && x <= 731 || x === 733 || x === 735 || x >= 768 && x <= 879 || x >= 913 && x <= 929 || x >= 931 && x <= 937 || x >= 945 && x <= 961 || x >= 963 && x <= 969 || x === 1025 || x >= 1040 && x <= 1103 || x === 1105 || x === 8208 || x >= 8211 && x <= 8214 || x === 8216 || x === 8217 || x === 8220 || x === 8221 || x >= 8224 && x <= 8226 || x >= 8228 && x <= 8231 || x === 8240 || x === 8242 || x === 8243 || x === 8245 || x === 8251 || x === 8254 || x === 8308 || x === 8319 || x >= 8321 && x <= 8324 || x === 8364 || x === 8451 || x === 8453 || x === 8457 || x === 8467 || x === 8470 || x === 8481 || x === 8482 || x === 8486 || x === 8491 || x === 8531 || x === 8532 || x >= 8539 && x <= 8542 || x >= 8544 && x <= 8555 || x >= 8560 && x <= 8569 || x === 8585 || x >= 8592 && x <= 8601 || x === 8632 || x === 8633 || x === 8658 || x === 8660 || x === 8679 || x === 8704 || x === 8706 || x === 8707 || x === 8711 || x === 8712 || x === 8715 || x === 8719 || x === 8721 || x === 8725 || x === 8730 || x >= 8733 && x <= 8736 || x === 8739 || x === 8741 || x >= 8743 && x <= 8748 || x === 8750 || x >= 8756 && x <= 8759 || x === 8764 || x === 8765 || x === 8776 || x === 8780 || x === 8786 || x === 8800 || x === 8801 || x >= 8804 && x <= 8807 || x === 8810 || x === 8811 || x === 8814 || x === 8815 || x === 8834 || x === 8835 || x === 8838 || x === 8839 || x === 8853 || x === 8857 || x === 8869 || x === 8895 || x === 8978 || x >= 9312 && x <= 9449 || x >= 9451 && x <= 9547 || x >= 9552 && x <= 9587 || x >= 9600 && x <= 9615 || x >= 9618 && x <= 9621 || x === 9632 || x === 9633 || x >= 9635 && x <= 9641 || x === 9650 || x === 9651 || x === 9654 || x === 9655 || x === 9660 || x === 9661 || x === 9664 || x === 9665 || x >= 9670 && x <= 9672 || x === 9675 || x >= 9678 && x <= 9681 || x >= 9698 && x <= 9701 || x === 9711 || x === 9733 || x === 9734 || x === 9737 || x === 9742 || x === 9743 || x === 9756 || x === 9758 || x === 9792 || x === 9794 || x === 9824 || x === 9825 || x >= 9827 && x <= 9829 || x >= 9831 && x <= 9834 || x === 9836 || x === 9837 || x === 9839 || x === 9886 || x === 9887 || x === 9919 || x >= 9926 && x <= 9933 || x >= 9935 && x <= 9939 || x >= 9941 && x <= 9953 || x === 9955 || x === 9960 || x === 9961 || x >= 9963 && x <= 9969 || x === 9972 || x >= 9974 && x <= 9977 || x === 9979 || x === 9980 || x === 9982 || x === 9983 || x === 10045 || x >= 10102 && x <= 10111 || x >= 11094 && x <= 11097 || x >= 12872 && x <= 12879 || x >= 57344 && x <= 63743 || x >= 65024 && x <= 65039 || x === 65533 || x >= 127232 && x <= 127242 || x >= 127248 && x <= 127277 || x >= 127280 && x <= 127337 || x >= 127344 && x <= 127373 || x === 127375 || x === 127376 || x >= 127387 && x <= 127404 || x >= 917760 && x <= 917999 || x >= 983040 && x <= 1048573 || x >= 1048576 && x <= 1114109;
}
function isFullWidth(x) {
  return x === 12288 || x >= 65281 && x <= 65376 || x >= 65504 && x <= 65510;
}
function isWide(x) {
  return x >= 4352 && x <= 4447 || x === 8986 || x === 8987 || x === 9001 || x === 9002 || x >= 9193 && x <= 9196 || x === 9200 || x === 9203 || x === 9725 || x === 9726 || x === 9748 || x === 9749 || x >= 9776 && x <= 9783 || x >= 9800 && x <= 9811 || x === 9855 || x >= 9866 && x <= 9871 || x === 9875 || x === 9889 || x === 9898 || x === 9899 || x === 9917 || x === 9918 || x === 9924 || x === 9925 || x === 9934 || x === 9940 || x === 9962 || x === 9970 || x === 9971 || x === 9973 || x === 9978 || x === 9981 || x === 9989 || x === 9994 || x === 9995 || x === 10024 || x === 10060 || x === 10062 || x >= 10067 && x <= 10069 || x === 10071 || x >= 10133 && x <= 10135 || x === 10160 || x === 10175 || x === 11035 || x === 11036 || x === 11088 || x === 11093 || x >= 11904 && x <= 11929 || x >= 11931 && x <= 12019 || x >= 12032 && x <= 12245 || x >= 12272 && x <= 12287 || x >= 12289 && x <= 12350 || x >= 12353 && x <= 12438 || x >= 12441 && x <= 12543 || x >= 12549 && x <= 12591 || x >= 12593 && x <= 12686 || x >= 12688 && x <= 12773 || x >= 12783 && x <= 12830 || x >= 12832 && x <= 12871 || x >= 12880 && x <= 42124 || x >= 42128 && x <= 42182 || x >= 43360 && x <= 43388 || x >= 44032 && x <= 55203 || x >= 63744 && x <= 64255 || x >= 65040 && x <= 65049 || x >= 65072 && x <= 65106 || x >= 65108 && x <= 65126 || x >= 65128 && x <= 65131 || x >= 94176 && x <= 94180 || x === 94192 || x === 94193 || x >= 94208 && x <= 100343 || x >= 100352 && x <= 101589 || x >= 101631 && x <= 101640 || x >= 110576 && x <= 110579 || x >= 110581 && x <= 110587 || x === 110589 || x === 110590 || x >= 110592 && x <= 110882 || x === 110898 || x >= 110928 && x <= 110930 || x === 110933 || x >= 110948 && x <= 110951 || x >= 110960 && x <= 111355 || x >= 119552 && x <= 119638 || x >= 119648 && x <= 119670 || x === 126980 || x === 127183 || x === 127374 || x >= 127377 && x <= 127386 || x >= 127488 && x <= 127490 || x >= 127504 && x <= 127547 || x >= 127552 && x <= 127560 || x === 127568 || x === 127569 || x >= 127584 && x <= 127589 || x >= 127744 && x <= 127776 || x >= 127789 && x <= 127797 || x >= 127799 && x <= 127868 || x >= 127870 && x <= 127891 || x >= 127904 && x <= 127946 || x >= 127951 && x <= 127955 || x >= 127968 && x <= 127984 || x === 127988 || x >= 127992 && x <= 128062 || x === 128064 || x >= 128066 && x <= 128252 || x >= 128255 && x <= 128317 || x >= 128331 && x <= 128334 || x >= 128336 && x <= 128359 || x === 128378 || x === 128405 || x === 128406 || x === 128420 || x >= 128507 && x <= 128591 || x >= 128640 && x <= 128709 || x === 128716 || x >= 128720 && x <= 128722 || x >= 128725 && x <= 128727 || x >= 128732 && x <= 128735 || x === 128747 || x === 128748 || x >= 128756 && x <= 128764 || x >= 128992 && x <= 129003 || x === 129008 || x >= 129292 && x <= 129338 || x >= 129340 && x <= 129349 || x >= 129351 && x <= 129535 || x >= 129648 && x <= 129660 || x >= 129664 && x <= 129673 || x >= 129679 && x <= 129734 || x >= 129742 && x <= 129756 || x >= 129759 && x <= 129769 || x >= 129776 && x <= 129784 || x >= 131072 && x <= 196605 || x >= 196608 && x <= 262141;
}

// node_modules/get-east-asian-width/index.js
function validate(codePoint) {
  if (!Number.isSafeInteger(codePoint)) {
    throw new TypeError(`Expected a code point, got \`${typeof codePoint}\`.`);
  }
}
function eastAsianWidth(codePoint, { ambiguousAsWide = false } = {}) {
  validate(codePoint);
  if (isFullWidth(codePoint) || isWide(codePoint) || ambiguousAsWide && isAmbiguous(codePoint)) {
    return 2;
  }
  return 1;
}

// node_modules/string-width/index.js
var import_emoji_regex = __toESM(require_emoji_regex(), 1);
var segmenter = new Intl.Segmenter;
var defaultIgnorableCodePointRegex = /^\p{Default_Ignorable_Code_Point}$/u;
function stringWidth(string, options = {}) {
  if (typeof string !== "string" || string.length === 0) {
    return 0;
  }
  const {
    ambiguousIsNarrow = true,
    countAnsiEscapeCodes = false
  } = options;
  if (!countAnsiEscapeCodes) {
    string = stripAnsi(string);
  }
  if (string.length === 0) {
    return 0;
  }
  let width = 0;
  const eastAsianWidthOptions = { ambiguousAsWide: !ambiguousIsNarrow };
  for (const { segment: character } of segmenter.segment(string)) {
    const codePoint = character.codePointAt(0);
    if (codePoint <= 31 || codePoint >= 127 && codePoint <= 159) {
      continue;
    }
    if (codePoint >= 8203 && codePoint <= 8207 || codePoint === 65279) {
      continue;
    }
    if (codePoint >= 768 && codePoint <= 879 || codePoint >= 6832 && codePoint <= 6911 || codePoint >= 7616 && codePoint <= 7679 || codePoint >= 8400 && codePoint <= 8447 || codePoint >= 65056 && codePoint <= 65071) {
      continue;
    }
    if (codePoint >= 55296 && codePoint <= 57343) {
      continue;
    }
    if (codePoint >= 65024 && codePoint <= 65039) {
      continue;
    }
    if (defaultIgnorableCodePointRegex.test(character)) {
      continue;
    }
    if (import_emoji_regex.default().test(character)) {
      width += 2;
      continue;
    }
    width += eastAsianWidth(codePoint, eastAsianWidthOptions);
  }
  return width;
}

// node_modules/is-interactive/index.js
function isInteractive({ stream = process.stdout } = {}) {
  return Boolean(stream && stream.isTTY && process.env.TERM !== "dumb" && !("CI" in process.env));
}

// node_modules/is-unicode-supported/index.js
import process7 from "node:process";
function isUnicodeSupported2() {
  const { env: env2 } = process7;
  const { TERM, TERM_PROGRAM } = env2;
  if (process7.platform !== "win32") {
    return TERM !== "linux";
  }
  return Boolean(env2.WT_SESSION) || Boolean(env2.TERMINUS_SUBLIME) || env2.ConEmuTask === "{cmd::Cmder}" || TERM_PROGRAM === "Terminus-Sublime" || TERM_PROGRAM === "vscode" || TERM === "xterm-256color" || TERM === "alacritty" || TERM === "rxvt-unicode" || TERM === "rxvt-unicode-256color" || env2.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}

// node_modules/stdin-discarder/index.js
import process8 from "node:process";
var ASCII_ETX_CODE = 3;

class StdinDiscarder {
  #activeCount = 0;
  start() {
    this.#activeCount++;
    if (this.#activeCount === 1) {
      this.#realStart();
    }
  }
  stop() {
    if (this.#activeCount <= 0) {
      throw new Error("`stop` called more times than `start`");
    }
    this.#activeCount--;
    if (this.#activeCount === 0) {
      this.#realStop();
    }
  }
  #realStart() {
    if (process8.platform === "win32" || !process8.stdin.isTTY) {
      return;
    }
    process8.stdin.setRawMode(true);
    process8.stdin.on("data", this.#handleInput);
    process8.stdin.resume();
  }
  #realStop() {
    if (!process8.stdin.isTTY) {
      return;
    }
    process8.stdin.off("data", this.#handleInput);
    process8.stdin.pause();
    process8.stdin.setRawMode(false);
  }
  #handleInput(chunk) {
    if (chunk[0] === ASCII_ETX_CODE) {
      process8.emit("SIGINT");
    }
  }
}
var stdinDiscarder = new StdinDiscarder;
var stdin_discarder_default = stdinDiscarder;

// node_modules/ora/index.js
var import_cli_spinners2 = __toESM(require_cli_spinners(), 1);

class Ora {
  #linesToClear = 0;
  #isDiscardingStdin = false;
  #lineCount = 0;
  #frameIndex = -1;
  #lastSpinnerFrameTime = 0;
  #options;
  #spinner;
  #stream;
  #id;
  #initialInterval;
  #isEnabled;
  #isSilent;
  #indent;
  #text;
  #prefixText;
  #suffixText;
  color;
  constructor(options) {
    if (typeof options === "string") {
      options = {
        text: options
      };
    }
    this.#options = {
      color: "cyan",
      stream: process9.stderr,
      discardStdin: true,
      hideCursor: true,
      ...options
    };
    this.color = this.#options.color;
    this.spinner = this.#options.spinner;
    this.#initialInterval = this.#options.interval;
    this.#stream = this.#options.stream;
    this.#isEnabled = typeof this.#options.isEnabled === "boolean" ? this.#options.isEnabled : isInteractive({ stream: this.#stream });
    this.#isSilent = typeof this.#options.isSilent === "boolean" ? this.#options.isSilent : false;
    this.text = this.#options.text;
    this.prefixText = this.#options.prefixText;
    this.suffixText = this.#options.suffixText;
    this.indent = this.#options.indent;
    if (process9.env.NODE_ENV === "test") {
      this._stream = this.#stream;
      this._isEnabled = this.#isEnabled;
      Object.defineProperty(this, "_linesToClear", {
        get() {
          return this.#linesToClear;
        },
        set(newValue) {
          this.#linesToClear = newValue;
        }
      });
      Object.defineProperty(this, "_frameIndex", {
        get() {
          return this.#frameIndex;
        }
      });
      Object.defineProperty(this, "_lineCount", {
        get() {
          return this.#lineCount;
        }
      });
    }
  }
  get indent() {
    return this.#indent;
  }
  set indent(indent = 0) {
    if (!(indent >= 0 && Number.isInteger(indent))) {
      throw new Error("The `indent` option must be an integer from 0 and up");
    }
    this.#indent = indent;
    this.#updateLineCount();
  }
  get interval() {
    return this.#initialInterval ?? this.#spinner.interval ?? 100;
  }
  get spinner() {
    return this.#spinner;
  }
  set spinner(spinner) {
    this.#frameIndex = -1;
    this.#initialInterval = undefined;
    if (typeof spinner === "object") {
      if (spinner.frames === undefined) {
        throw new Error("The given spinner must have a `frames` property");
      }
      this.#spinner = spinner;
    } else if (!isUnicodeSupported2()) {
      this.#spinner = import_cli_spinners.default.line;
    } else if (spinner === undefined) {
      this.#spinner = import_cli_spinners.default.dots;
    } else if (spinner !== "default" && import_cli_spinners.default[spinner]) {
      this.#spinner = import_cli_spinners.default[spinner];
    } else {
      throw new Error(`There is no built-in spinner named '${spinner}'. See https://github.com/sindresorhus/cli-spinners/blob/main/spinners.json for a full list.`);
    }
  }
  get text() {
    return this.#text;
  }
  set text(value = "") {
    this.#text = value;
    this.#updateLineCount();
  }
  get prefixText() {
    return this.#prefixText;
  }
  set prefixText(value = "") {
    this.#prefixText = value;
    this.#updateLineCount();
  }
  get suffixText() {
    return this.#suffixText;
  }
  set suffixText(value = "") {
    this.#suffixText = value;
    this.#updateLineCount();
  }
  get isSpinning() {
    return this.#id !== undefined;
  }
  #getFullPrefixText(prefixText = this.#prefixText, postfix = " ") {
    if (typeof prefixText === "string" && prefixText !== "") {
      return prefixText + postfix;
    }
    if (typeof prefixText === "function") {
      return prefixText() + postfix;
    }
    return "";
  }
  #getFullSuffixText(suffixText = this.#suffixText, prefix = " ") {
    if (typeof suffixText === "string" && suffixText !== "") {
      return prefix + suffixText;
    }
    if (typeof suffixText === "function") {
      return prefix + suffixText();
    }
    return "";
  }
  #updateLineCount() {
    const columns = this.#stream.columns ?? 80;
    const fullPrefixText = this.#getFullPrefixText(this.#prefixText, "-");
    const fullSuffixText = this.#getFullSuffixText(this.#suffixText, "-");
    const fullText = " ".repeat(this.#indent) + fullPrefixText + "--" + this.#text + "--" + fullSuffixText;
    this.#lineCount = 0;
    for (const line of stripAnsi(fullText).split(`
`)) {
      this.#lineCount += Math.max(1, Math.ceil(stringWidth(line, { countAnsiEscapeCodes: true }) / columns));
    }
  }
  get isEnabled() {
    return this.#isEnabled && !this.#isSilent;
  }
  set isEnabled(value) {
    if (typeof value !== "boolean") {
      throw new TypeError("The `isEnabled` option must be a boolean");
    }
    this.#isEnabled = value;
  }
  get isSilent() {
    return this.#isSilent;
  }
  set isSilent(value) {
    if (typeof value !== "boolean") {
      throw new TypeError("The `isSilent` option must be a boolean");
    }
    this.#isSilent = value;
  }
  frame() {
    const now = Date.now();
    if (this.#frameIndex === -1 || now - this.#lastSpinnerFrameTime >= this.interval) {
      this.#frameIndex = ++this.#frameIndex % this.#spinner.frames.length;
      this.#lastSpinnerFrameTime = now;
    }
    const { frames } = this.#spinner;
    let frame = frames[this.#frameIndex];
    if (this.color) {
      frame = source_default[this.color](frame);
    }
    const fullPrefixText = typeof this.#prefixText === "string" && this.#prefixText !== "" ? this.#prefixText + " " : "";
    const fullText = typeof this.text === "string" ? " " + this.text : "";
    const fullSuffixText = typeof this.#suffixText === "string" && this.#suffixText !== "" ? " " + this.#suffixText : "";
    return fullPrefixText + frame + fullText + fullSuffixText;
  }
  clear() {
    if (!this.#isEnabled || !this.#stream.isTTY) {
      return this;
    }
    this.#stream.cursorTo(0);
    for (let index = 0;index < this.#linesToClear; index++) {
      if (index > 0) {
        this.#stream.moveCursor(0, -1);
      }
      this.#stream.clearLine(1);
    }
    if (this.#indent || this.lastIndent !== this.#indent) {
      this.#stream.cursorTo(this.#indent);
    }
    this.lastIndent = this.#indent;
    this.#linesToClear = 0;
    return this;
  }
  render() {
    if (this.#isSilent) {
      return this;
    }
    this.clear();
    this.#stream.write(this.frame());
    this.#linesToClear = this.#lineCount;
    return this;
  }
  start(text) {
    if (text) {
      this.text = text;
    }
    if (this.#isSilent) {
      return this;
    }
    if (!this.#isEnabled) {
      if (this.text) {
        this.#stream.write(`- ${this.text}
`);
      }
      return this;
    }
    if (this.isSpinning) {
      return this;
    }
    if (this.#options.hideCursor) {
      cli_cursor_default.hide(this.#stream);
    }
    if (this.#options.discardStdin && process9.stdin.isTTY) {
      this.#isDiscardingStdin = true;
      stdin_discarder_default.start();
    }
    this.render();
    this.#id = setInterval(this.render.bind(this), this.interval);
    return this;
  }
  stop() {
    if (!this.#isEnabled) {
      return this;
    }
    clearInterval(this.#id);
    this.#id = undefined;
    this.#frameIndex = 0;
    this.clear();
    if (this.#options.hideCursor) {
      cli_cursor_default.show(this.#stream);
    }
    if (this.#options.discardStdin && process9.stdin.isTTY && this.#isDiscardingStdin) {
      stdin_discarder_default.stop();
      this.#isDiscardingStdin = false;
    }
    return this;
  }
  succeed(text) {
    return this.stopAndPersist({ symbol: log_symbols_default.success, text });
  }
  fail(text) {
    return this.stopAndPersist({ symbol: log_symbols_default.error, text });
  }
  warn(text) {
    return this.stopAndPersist({ symbol: log_symbols_default.warning, text });
  }
  info(text) {
    return this.stopAndPersist({ symbol: log_symbols_default.info, text });
  }
  stopAndPersist(options = {}) {
    if (this.#isSilent) {
      return this;
    }
    const prefixText = options.prefixText ?? this.#prefixText;
    const fullPrefixText = this.#getFullPrefixText(prefixText, " ");
    const symbolText = options.symbol ?? " ";
    const text = options.text ?? this.text;
    const separatorText = symbolText ? " " : "";
    const fullText = typeof text === "string" ? separatorText + text : "";
    const suffixText = options.suffixText ?? this.#suffixText;
    const fullSuffixText = this.#getFullSuffixText(suffixText, " ");
    const textToWrite = fullPrefixText + symbolText + fullText + fullSuffixText + `
`;
    this.stop();
    this.#stream.write(textToWrite);
    return this;
  }
}
function ora(options) {
  return new Ora(options);
}

// index.ts
import { execSync } from "child_process";

// node_modules/@inquirer/core/dist/esm/lib/key.js
var isUpKey = (key) => key.name === "up" || key.name === "k" || key.ctrl && key.name === "p";
var isDownKey = (key) => key.name === "down" || key.name === "j" || key.ctrl && key.name === "n";
var isSpaceKey = (key) => key.name === "space";
var isBackspaceKey = (key) => key.name === "backspace";
var isNumberKey = (key) => "123456789".includes(key.name);
var isEnterKey = (key) => key.name === "enter" || key.name === "return";
// node_modules/@inquirer/core/dist/esm/lib/errors.js
class AbortPromptError extends Error {
  name = "AbortPromptError";
  message = "Prompt was aborted";
  constructor(options) {
    super();
    this.cause = options?.cause;
  }
}

class CancelPromptError extends Error {
  name = "CancelPromptError";
  message = "Prompt was canceled";
}

class ExitPromptError extends Error {
  name = "ExitPromptError";
}

class HookError extends Error {
  name = "HookError";
}

class ValidationError extends Error {
  name = "ValidationError";
}
// node_modules/@inquirer/core/dist/esm/lib/use-prefix.js
import { AsyncResource as AsyncResource2 } from "node:async_hooks";

// node_modules/@inquirer/core/dist/esm/lib/hook-engine.js
import { AsyncLocalStorage, AsyncResource } from "node:async_hooks";
var hookStorage = new AsyncLocalStorage;
function createStore(rl) {
  const store = {
    rl,
    hooks: [],
    hooksCleanup: [],
    hooksEffect: [],
    index: 0,
    handleChange() {
    }
  };
  return store;
}
function withHooks(rl, cb) {
  const store = createStore(rl);
  return hookStorage.run(store, () => {
    function cycle(render) {
      store.handleChange = () => {
        store.index = 0;
        render();
      };
      store.handleChange();
    }
    return cb(cycle);
  });
}
function getStore() {
  const store = hookStorage.getStore();
  if (!store) {
    throw new HookError("[Inquirer] Hook functions can only be called from within a prompt");
  }
  return store;
}
function readline() {
  return getStore().rl;
}
function withUpdates(fn) {
  const wrapped = (...args) => {
    const store = getStore();
    let shouldUpdate = false;
    const oldHandleChange = store.handleChange;
    store.handleChange = () => {
      shouldUpdate = true;
    };
    const returnValue = fn(...args);
    if (shouldUpdate) {
      oldHandleChange();
    }
    store.handleChange = oldHandleChange;
    return returnValue;
  };
  return AsyncResource.bind(wrapped);
}
function withPointer(cb) {
  const store = getStore();
  const { index } = store;
  const pointer = {
    get() {
      return store.hooks[index];
    },
    set(value) {
      store.hooks[index] = value;
    },
    initialized: index in store.hooks
  };
  const returnValue = cb(pointer);
  store.index++;
  return returnValue;
}
function handleChange() {
  getStore().handleChange();
}
var effectScheduler = {
  queue(cb) {
    const store = getStore();
    const { index } = store;
    store.hooksEffect.push(() => {
      store.hooksCleanup[index]?.();
      const cleanFn = cb(readline());
      if (cleanFn != null && typeof cleanFn !== "function") {
        throw new ValidationError("useEffect return value must be a cleanup function or nothing.");
      }
      store.hooksCleanup[index] = cleanFn;
    });
  },
  run() {
    const store = getStore();
    withUpdates(() => {
      store.hooksEffect.forEach((effect) => {
        effect();
      });
      store.hooksEffect.length = 0;
    })();
  },
  clearAll() {
    const store = getStore();
    store.hooksCleanup.forEach((cleanFn) => {
      cleanFn?.();
    });
    store.hooksEffect.length = 0;
    store.hooksCleanup.length = 0;
  }
};

// node_modules/@inquirer/core/dist/esm/lib/use-state.js
function useState(defaultValue) {
  return withPointer((pointer) => {
    const setFn = (newValue) => {
      if (pointer.get() !== newValue) {
        pointer.set(newValue);
        handleChange();
      }
    };
    if (pointer.initialized) {
      return [pointer.get(), setFn];
    }
    const value = typeof defaultValue === "function" ? defaultValue() : defaultValue;
    pointer.set(value);
    return [value, setFn];
  });
}

// node_modules/@inquirer/core/dist/esm/lib/use-effect.js
function useEffect(cb, depArray) {
  withPointer((pointer) => {
    const oldDeps = pointer.get();
    const hasChanged = !Array.isArray(oldDeps) || depArray.some((dep, i) => !Object.is(dep, oldDeps[i]));
    if (hasChanged) {
      effectScheduler.queue(cb);
    }
    pointer.set(depArray);
  });
}

// node_modules/@inquirer/core/dist/esm/lib/theme.js
var import_yoctocolors_cjs = __toESM(require_yoctocolors_cjs(), 1);

// node_modules/@inquirer/figures/dist/esm/index.js
import process10 from "node:process";
function isUnicodeSupported3() {
  if (process10.platform !== "win32") {
    return process10.env["TERM"] !== "linux";
  }
  return Boolean(process10.env["WT_SESSION"]) || Boolean(process10.env["TERMINUS_SUBLIME"]) || process10.env["ConEmuTask"] === "{cmd::Cmder}" || process10.env["TERM_PROGRAM"] === "Terminus-Sublime" || process10.env["TERM_PROGRAM"] === "vscode" || process10.env["TERM"] === "xterm-256color" || process10.env["TERM"] === "alacritty" || process10.env["TERMINAL_EMULATOR"] === "JetBrains-JediTerm";
}
var common = {
  circleQuestionMark: "(?)",
  questionMarkPrefix: "(?)",
  square: "█",
  squareDarkShade: "▓",
  squareMediumShade: "▒",
  squareLightShade: "░",
  squareTop: "▀",
  squareBottom: "▄",
  squareLeft: "▌",
  squareRight: "▐",
  squareCenter: "■",
  bullet: "●",
  dot: "․",
  ellipsis: "…",
  pointerSmall: "›",
  triangleUp: "▲",
  triangleUpSmall: "▴",
  triangleDown: "▼",
  triangleDownSmall: "▾",
  triangleLeftSmall: "◂",
  triangleRightSmall: "▸",
  home: "⌂",
  heart: "♥",
  musicNote: "♪",
  musicNoteBeamed: "♫",
  arrowUp: "↑",
  arrowDown: "↓",
  arrowLeft: "←",
  arrowRight: "→",
  arrowLeftRight: "↔",
  arrowUpDown: "↕",
  almostEqual: "≈",
  notEqual: "≠",
  lessOrEqual: "≤",
  greaterOrEqual: "≥",
  identical: "≡",
  infinity: "∞",
  subscriptZero: "₀",
  subscriptOne: "₁",
  subscriptTwo: "₂",
  subscriptThree: "₃",
  subscriptFour: "₄",
  subscriptFive: "₅",
  subscriptSix: "₆",
  subscriptSeven: "₇",
  subscriptEight: "₈",
  subscriptNine: "₉",
  oneHalf: "½",
  oneThird: "⅓",
  oneQuarter: "¼",
  oneFifth: "⅕",
  oneSixth: "⅙",
  oneEighth: "⅛",
  twoThirds: "⅔",
  twoFifths: "⅖",
  threeQuarters: "¾",
  threeFifths: "⅗",
  threeEighths: "⅜",
  fourFifths: "⅘",
  fiveSixths: "⅚",
  fiveEighths: "⅝",
  sevenEighths: "⅞",
  line: "─",
  lineBold: "━",
  lineDouble: "═",
  lineDashed0: "┄",
  lineDashed1: "┅",
  lineDashed2: "┈",
  lineDashed3: "┉",
  lineDashed4: "╌",
  lineDashed5: "╍",
  lineDashed6: "╴",
  lineDashed7: "╶",
  lineDashed8: "╸",
  lineDashed9: "╺",
  lineDashed10: "╼",
  lineDashed11: "╾",
  lineDashed12: "−",
  lineDashed13: "–",
  lineDashed14: "‐",
  lineDashed15: "⁃",
  lineVertical: "│",
  lineVerticalBold: "┃",
  lineVerticalDouble: "║",
  lineVerticalDashed0: "┆",
  lineVerticalDashed1: "┇",
  lineVerticalDashed2: "┊",
  lineVerticalDashed3: "┋",
  lineVerticalDashed4: "╎",
  lineVerticalDashed5: "╏",
  lineVerticalDashed6: "╵",
  lineVerticalDashed7: "╷",
  lineVerticalDashed8: "╹",
  lineVerticalDashed9: "╻",
  lineVerticalDashed10: "╽",
  lineVerticalDashed11: "╿",
  lineDownLeft: "┐",
  lineDownLeftArc: "╮",
  lineDownBoldLeftBold: "┓",
  lineDownBoldLeft: "┒",
  lineDownLeftBold: "┑",
  lineDownDoubleLeftDouble: "╗",
  lineDownDoubleLeft: "╖",
  lineDownLeftDouble: "╕",
  lineDownRight: "┌",
  lineDownRightArc: "╭",
  lineDownBoldRightBold: "┏",
  lineDownBoldRight: "┎",
  lineDownRightBold: "┍",
  lineDownDoubleRightDouble: "╔",
  lineDownDoubleRight: "╓",
  lineDownRightDouble: "╒",
  lineUpLeft: "┘",
  lineUpLeftArc: "╯",
  lineUpBoldLeftBold: "┛",
  lineUpBoldLeft: "┚",
  lineUpLeftBold: "┙",
  lineUpDoubleLeftDouble: "╝",
  lineUpDoubleLeft: "╜",
  lineUpLeftDouble: "╛",
  lineUpRight: "└",
  lineUpRightArc: "╰",
  lineUpBoldRightBold: "┗",
  lineUpBoldRight: "┖",
  lineUpRightBold: "┕",
  lineUpDoubleRightDouble: "╚",
  lineUpDoubleRight: "╙",
  lineUpRightDouble: "╘",
  lineUpDownLeft: "┤",
  lineUpBoldDownBoldLeftBold: "┫",
  lineUpBoldDownBoldLeft: "┨",
  lineUpDownLeftBold: "┥",
  lineUpBoldDownLeftBold: "┩",
  lineUpDownBoldLeftBold: "┪",
  lineUpDownBoldLeft: "┧",
  lineUpBoldDownLeft: "┦",
  lineUpDoubleDownDoubleLeftDouble: "╣",
  lineUpDoubleDownDoubleLeft: "╢",
  lineUpDownLeftDouble: "╡",
  lineUpDownRight: "├",
  lineUpBoldDownBoldRightBold: "┣",
  lineUpBoldDownBoldRight: "┠",
  lineUpDownRightBold: "┝",
  lineUpBoldDownRightBold: "┡",
  lineUpDownBoldRightBold: "┢",
  lineUpDownBoldRight: "┟",
  lineUpBoldDownRight: "┞",
  lineUpDoubleDownDoubleRightDouble: "╠",
  lineUpDoubleDownDoubleRight: "╟",
  lineUpDownRightDouble: "╞",
  lineDownLeftRight: "┬",
  lineDownBoldLeftBoldRightBold: "┳",
  lineDownLeftBoldRightBold: "┯",
  lineDownBoldLeftRight: "┰",
  lineDownBoldLeftBoldRight: "┱",
  lineDownBoldLeftRightBold: "┲",
  lineDownLeftRightBold: "┮",
  lineDownLeftBoldRight: "┭",
  lineDownDoubleLeftDoubleRightDouble: "╦",
  lineDownDoubleLeftRight: "╥",
  lineDownLeftDoubleRightDouble: "╤",
  lineUpLeftRight: "┴",
  lineUpBoldLeftBoldRightBold: "┻",
  lineUpLeftBoldRightBold: "┷",
  lineUpBoldLeftRight: "┸",
  lineUpBoldLeftBoldRight: "┹",
  lineUpBoldLeftRightBold: "┺",
  lineUpLeftRightBold: "┶",
  lineUpLeftBoldRight: "┵",
  lineUpDoubleLeftDoubleRightDouble: "╩",
  lineUpDoubleLeftRight: "╨",
  lineUpLeftDoubleRightDouble: "╧",
  lineUpDownLeftRight: "┼",
  lineUpBoldDownBoldLeftBoldRightBold: "╋",
  lineUpDownBoldLeftBoldRightBold: "╈",
  lineUpBoldDownLeftBoldRightBold: "╇",
  lineUpBoldDownBoldLeftRightBold: "╊",
  lineUpBoldDownBoldLeftBoldRight: "╉",
  lineUpBoldDownLeftRight: "╀",
  lineUpDownBoldLeftRight: "╁",
  lineUpDownLeftBoldRight: "┽",
  lineUpDownLeftRightBold: "┾",
  lineUpBoldDownBoldLeftRight: "╂",
  lineUpDownLeftBoldRightBold: "┿",
  lineUpBoldDownLeftBoldRight: "╃",
  lineUpBoldDownLeftRightBold: "╄",
  lineUpDownBoldLeftBoldRight: "╅",
  lineUpDownBoldLeftRightBold: "╆",
  lineUpDoubleDownDoubleLeftDoubleRightDouble: "╬",
  lineUpDoubleDownDoubleLeftRight: "╫",
  lineUpDownLeftDoubleRightDouble: "╪",
  lineCross: "╳",
  lineBackslash: "╲",
  lineSlash: "╱"
};
var specialMainSymbols = {
  tick: "✔",
  info: "ℹ",
  warning: "⚠",
  cross: "✘",
  squareSmall: "◻",
  squareSmallFilled: "◼",
  circle: "◯",
  circleFilled: "◉",
  circleDotted: "◌",
  circleDouble: "◎",
  circleCircle: "ⓞ",
  circleCross: "ⓧ",
  circlePipe: "Ⓘ",
  radioOn: "◉",
  radioOff: "◯",
  checkboxOn: "☒",
  checkboxOff: "☐",
  checkboxCircleOn: "ⓧ",
  checkboxCircleOff: "Ⓘ",
  pointer: "❯",
  triangleUpOutline: "△",
  triangleLeft: "◀",
  triangleRight: "▶",
  lozenge: "◆",
  lozengeOutline: "◇",
  hamburger: "☰",
  smiley: "㋡",
  mustache: "෴",
  star: "★",
  play: "▶",
  nodejs: "⬢",
  oneSeventh: "⅐",
  oneNinth: "⅑",
  oneTenth: "⅒"
};
var specialFallbackSymbols = {
  tick: "√",
  info: "i",
  warning: "‼",
  cross: "×",
  squareSmall: "□",
  squareSmallFilled: "■",
  circle: "( )",
  circleFilled: "(*)",
  circleDotted: "( )",
  circleDouble: "( )",
  circleCircle: "(○)",
  circleCross: "(×)",
  circlePipe: "(│)",
  radioOn: "(*)",
  radioOff: "( )",
  checkboxOn: "[×]",
  checkboxOff: "[ ]",
  checkboxCircleOn: "(×)",
  checkboxCircleOff: "( )",
  pointer: ">",
  triangleUpOutline: "∆",
  triangleLeft: "◄",
  triangleRight: "►",
  lozenge: "♦",
  lozengeOutline: "◊",
  hamburger: "≡",
  smiley: "☺",
  mustache: "┌─┐",
  star: "✶",
  play: "►",
  nodejs: "♦",
  oneSeventh: "1/7",
  oneNinth: "1/9",
  oneTenth: "1/10"
};
var mainSymbols = { ...common, ...specialMainSymbols };
var fallbackSymbols = {
  ...common,
  ...specialFallbackSymbols
};
var shouldUseMain = isUnicodeSupported3();
var figures = shouldUseMain ? mainSymbols : fallbackSymbols;
var esm_default = figures;
var replacements = Object.entries(specialMainSymbols);

// node_modules/@inquirer/core/dist/esm/lib/theme.js
var defaultTheme = {
  prefix: {
    idle: import_yoctocolors_cjs.default.blue("?"),
    done: import_yoctocolors_cjs.default.green(esm_default.tick)
  },
  spinner: {
    interval: 80,
    frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"].map((frame) => import_yoctocolors_cjs.default.yellow(frame))
  },
  style: {
    answer: import_yoctocolors_cjs.default.cyan,
    message: import_yoctocolors_cjs.default.bold,
    error: (text) => import_yoctocolors_cjs.default.red(`> ${text}`),
    defaultAnswer: (text) => import_yoctocolors_cjs.default.dim(`(${text})`),
    help: import_yoctocolors_cjs.default.dim,
    highlight: import_yoctocolors_cjs.default.cyan,
    key: (text) => import_yoctocolors_cjs.default.cyan(import_yoctocolors_cjs.default.bold(`<${text}>`))
  }
};

// node_modules/@inquirer/core/dist/esm/lib/make-theme.js
function isPlainObject(value) {
  if (typeof value !== "object" || value === null)
    return false;
  let proto2 = value;
  while (Object.getPrototypeOf(proto2) !== null) {
    proto2 = Object.getPrototypeOf(proto2);
  }
  return Object.getPrototypeOf(value) === proto2;
}
function deepMerge(...objects) {
  const output = {};
  for (const obj of objects) {
    for (const [key, value] of Object.entries(obj)) {
      const prevValue = output[key];
      output[key] = isPlainObject(prevValue) && isPlainObject(value) ? deepMerge(prevValue, value) : value;
    }
  }
  return output;
}
function makeTheme(...themes) {
  const themesToMerge = [
    defaultTheme,
    ...themes.filter((theme) => theme != null)
  ];
  return deepMerge(...themesToMerge);
}

// node_modules/@inquirer/core/dist/esm/lib/use-prefix.js
function usePrefix({ status = "idle", theme }) {
  const [showLoader, setShowLoader] = useState(false);
  const [tick, setTick] = useState(0);
  const { prefix, spinner } = makeTheme(theme);
  useEffect(() => {
    if (status === "loading") {
      let tickInterval;
      let inc = -1;
      const delayTimeout = setTimeout(AsyncResource2.bind(() => {
        setShowLoader(true);
        tickInterval = setInterval(AsyncResource2.bind(() => {
          inc = inc + 1;
          setTick(inc % spinner.frames.length);
        }), spinner.interval);
      }), 300);
      return () => {
        clearTimeout(delayTimeout);
        clearInterval(tickInterval);
      };
    } else {
      setShowLoader(false);
    }
  }, [status]);
  if (showLoader) {
    return spinner.frames[tick];
  }
  const iconName = status === "loading" ? "idle" : status;
  return typeof prefix === "string" ? prefix : prefix[iconName] ?? prefix["idle"];
}
// node_modules/@inquirer/core/dist/esm/lib/use-memo.js
function useMemo(fn, dependencies) {
  return withPointer((pointer) => {
    const prev = pointer.get();
    if (!prev || prev.dependencies.length !== dependencies.length || prev.dependencies.some((dep, i) => dep !== dependencies[i])) {
      const value = fn();
      pointer.set({ value, dependencies });
      return value;
    }
    return prev.value;
  });
}
// node_modules/@inquirer/core/dist/esm/lib/use-ref.js
function useRef(val) {
  return useState({ current: val })[0];
}
// node_modules/@inquirer/core/dist/esm/lib/use-keypress.js
function useKeypress(userHandler) {
  const signal = useRef(userHandler);
  signal.current = userHandler;
  useEffect((rl) => {
    let ignore = false;
    const handler = withUpdates((_input, event) => {
      if (ignore)
        return;
      signal.current(event, rl);
    });
    rl.input.on("keypress", handler);
    return () => {
      ignore = true;
      rl.input.removeListener("keypress", handler);
    };
  }, []);
}
// node_modules/@inquirer/core/dist/esm/lib/utils.js
var import_cli_width = __toESM(require_cli_width(), 1);
var import_wrap_ansi = __toESM(require_wrap_ansi(), 1);
function breakLines(content, width) {
  return content.split(`
`).flatMap((line) => import_wrap_ansi.default(line, width, { trim: false, hard: true }).split(`
`).map((str) => str.trimEnd())).join(`
`);
}
function readlineWidth() {
  return import_cli_width.default({ defaultWidth: 80, output: readline().output });
}

// node_modules/@inquirer/core/dist/esm/lib/pagination/lines.js
function split(content, width) {
  return breakLines(content, width).split(`
`);
}
function rotate(count, items) {
  const max = items.length;
  const offset = (count % max + max) % max;
  return [...items.slice(offset), ...items.slice(0, offset)];
}
function lines({ items, width, renderItem, active, position: requested, pageSize }) {
  const layouts = items.map((item, index) => ({
    item,
    index,
    isActive: index === active
  }));
  const layoutsInPage = rotate(active - requested, layouts).slice(0, pageSize);
  const renderItemAt = (index) => layoutsInPage[index] == null ? [] : split(renderItem(layoutsInPage[index]), width);
  const pageBuffer = Array.from({ length: pageSize });
  const activeItem = renderItemAt(requested).slice(0, pageSize);
  const position = requested + activeItem.length <= pageSize ? requested : pageSize - activeItem.length;
  pageBuffer.splice(position, activeItem.length, ...activeItem);
  let bufferPointer = position + activeItem.length;
  let layoutPointer = requested + 1;
  while (bufferPointer < pageSize && layoutPointer < layoutsInPage.length) {
    for (const line of renderItemAt(layoutPointer)) {
      pageBuffer[bufferPointer++] = line;
      if (bufferPointer >= pageSize)
        break;
    }
    layoutPointer++;
  }
  bufferPointer = position - 1;
  layoutPointer = requested - 1;
  while (bufferPointer >= 0 && layoutPointer >= 0) {
    for (const line of renderItemAt(layoutPointer).reverse()) {
      pageBuffer[bufferPointer--] = line;
      if (bufferPointer < 0)
        break;
    }
    layoutPointer--;
  }
  return pageBuffer.filter((line) => typeof line === "string");
}

// node_modules/@inquirer/core/dist/esm/lib/pagination/position.js
function finite({ active, pageSize, total }) {
  const middle = Math.floor(pageSize / 2);
  if (total <= pageSize || active < middle)
    return active;
  if (active >= total - middle)
    return active + pageSize - total;
  return middle;
}
function infinite({ active, lastActive, total, pageSize, pointer }) {
  if (total <= pageSize)
    return active;
  if (lastActive < active && active - lastActive < pageSize) {
    return Math.min(Math.floor(pageSize / 2), pointer + active - lastActive);
  }
  return pointer;
}

// node_modules/@inquirer/core/dist/esm/lib/pagination/use-pagination.js
function usePagination({ items, active, renderItem, pageSize, loop = true }) {
  const state = useRef({ position: 0, lastActive: 0 });
  const position = loop ? infinite({
    active,
    lastActive: state.current.lastActive,
    total: items.length,
    pageSize,
    pointer: state.current.position
  }) : finite({
    active,
    total: items.length,
    pageSize
  });
  state.current.position = position;
  state.current.lastActive = active;
  return lines({
    items,
    width: readlineWidth(),
    renderItem,
    active,
    position,
    pageSize
  }).join(`
`);
}
// node_modules/@inquirer/core/dist/esm/lib/create-prompt.js
var import_mute_stream = __toESM(require_lib2(), 1);
import * as readline2 from "node:readline";
import { AsyncResource as AsyncResource3 } from "node:async_hooks";

// node_modules/@inquirer/core/dist/esm/lib/screen-manager.js
var import_ansi_escapes = __toESM(require_ansi_escapes(), 1);
import { stripVTControlCharacters } from "node:util";
var height = (content) => content.split(`
`).length;
var lastLine = (content) => content.split(`
`).pop() ?? "";
function cursorDown(n) {
  return n > 0 ? import_ansi_escapes.default.cursorDown(n) : "";
}

class ScreenManager {
  rl;
  height = 0;
  extraLinesUnderPrompt = 0;
  cursorPos;
  constructor(rl) {
    this.rl = rl;
    this.rl = rl;
    this.cursorPos = rl.getCursorPos();
  }
  write(content) {
    this.rl.output.unmute();
    this.rl.output.write(content);
    this.rl.output.mute();
  }
  render(content, bottomContent = "") {
    const promptLine = lastLine(content);
    const rawPromptLine = stripVTControlCharacters(promptLine);
    let prompt = rawPromptLine;
    if (this.rl.line.length > 0) {
      prompt = prompt.slice(0, -this.rl.line.length);
    }
    this.rl.setPrompt(prompt);
    this.cursorPos = this.rl.getCursorPos();
    const width = readlineWidth();
    content = breakLines(content, width);
    bottomContent = breakLines(bottomContent, width);
    if (rawPromptLine.length % width === 0) {
      content += `
`;
    }
    let output = content + (bottomContent ? `
` + bottomContent : "");
    const promptLineUpDiff = Math.floor(rawPromptLine.length / width) - this.cursorPos.rows;
    const bottomContentHeight = promptLineUpDiff + (bottomContent ? height(bottomContent) : 0);
    if (bottomContentHeight > 0)
      output += import_ansi_escapes.default.cursorUp(bottomContentHeight);
    output += import_ansi_escapes.default.cursorTo(this.cursorPos.cols);
    this.write(cursorDown(this.extraLinesUnderPrompt) + import_ansi_escapes.default.eraseLines(this.height) + output);
    this.extraLinesUnderPrompt = bottomContentHeight;
    this.height = height(output);
  }
  checkCursorPos() {
    const cursorPos = this.rl.getCursorPos();
    if (cursorPos.cols !== this.cursorPos.cols) {
      this.write(import_ansi_escapes.default.cursorTo(cursorPos.cols));
      this.cursorPos = cursorPos;
    }
  }
  done({ clearContent }) {
    this.rl.setPrompt("");
    let output = cursorDown(this.extraLinesUnderPrompt);
    output += clearContent ? import_ansi_escapes.default.eraseLines(this.height) : `
`;
    output += import_ansi_escapes.default.cursorShow;
    this.write(output);
    this.rl.close();
  }
}

// node_modules/@inquirer/core/dist/esm/lib/promise-polyfill.js
class PromisePolyfill extends Promise {
  static withResolver() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }
}

// node_modules/@inquirer/core/dist/esm/lib/create-prompt.js
function getCallSites() {
  const _prepareStackTrace = Error.prepareStackTrace;
  try {
    let result = [];
    Error.prepareStackTrace = (_, callSites) => {
      const callSitesWithoutCurrent = callSites.slice(1);
      result = callSitesWithoutCurrent;
      return callSitesWithoutCurrent;
    };
    new Error().stack;
    return result;
  } finally {
    Error.prepareStackTrace = _prepareStackTrace;
  }
}
function createPrompt(view) {
  const callSites = getCallSites();
  const callerFilename = callSites[1]?.getFileName?.();
  const prompt = (config, context = {}) => {
    const { input = process.stdin, signal } = context;
    const cleanups = new Set;
    const output = new import_mute_stream.default;
    output.pipe(context.output ?? process.stdout);
    const rl = readline2.createInterface({
      terminal: true,
      input,
      output
    });
    const screen = new ScreenManager(rl);
    const { promise, resolve, reject } = PromisePolyfill.withResolver();
    const cancel = () => reject(new CancelPromptError);
    if (signal) {
      const abort = () => reject(new AbortPromptError({ cause: signal.reason }));
      if (signal.aborted) {
        abort();
        return Object.assign(promise, { cancel });
      }
      signal.addEventListener("abort", abort);
      cleanups.add(() => signal.removeEventListener("abort", abort));
    }
    cleanups.add(onExit((code, signal2) => {
      reject(new ExitPromptError(`User force closed the prompt with ${code} ${signal2}`));
    }));
    const checkCursorPos = () => screen.checkCursorPos();
    rl.input.on("keypress", checkCursorPos);
    cleanups.add(() => rl.input.removeListener("keypress", checkCursorPos));
    return withHooks(rl, (cycle) => {
      const hooksCleanup = AsyncResource3.bind(() => effectScheduler.clearAll());
      rl.on("close", hooksCleanup);
      cleanups.add(() => rl.removeListener("close", hooksCleanup));
      cycle(() => {
        try {
          const nextView = view(config, (value) => {
            setImmediate(() => resolve(value));
          });
          if (nextView === undefined) {
            throw new Error(`Prompt functions must return a string.
    at ${callerFilename}`);
          }
          const [content, bottomContent] = typeof nextView === "string" ? [nextView] : nextView;
          screen.render(content, bottomContent);
          effectScheduler.run();
        } catch (error) {
          reject(error);
        }
      });
      return Object.assign(promise.then((answer) => {
        effectScheduler.clearAll();
        return answer;
      }, (error) => {
        effectScheduler.clearAll();
        throw error;
      }).finally(() => {
        cleanups.forEach((cleanup) => cleanup());
        screen.done({ clearContent: Boolean(context.clearPromptOnDone) });
        output.end();
      }).then(() => promise), { cancel });
    });
  };
  return prompt;
}
// node_modules/@inquirer/core/dist/esm/lib/Separator.js
var import_yoctocolors_cjs2 = __toESM(require_yoctocolors_cjs(), 1);
class Separator {
  separator = import_yoctocolors_cjs2.default.dim(Array.from({ length: 15 }).join(esm_default.line));
  type = "separator";
  constructor(separator) {
    if (separator) {
      this.separator = separator;
    }
  }
  static isSeparator(choice) {
    return Boolean(choice && typeof choice === "object" && "type" in choice && choice.type === "separator");
  }
}
// node_modules/@inquirer/checkbox/dist/esm/index.js
var import_yoctocolors_cjs3 = __toESM(require_yoctocolors_cjs(), 1);
var import_ansi_escapes2 = __toESM(require_ansi_escapes(), 1);
var checkboxTheme = {
  icon: {
    checked: import_yoctocolors_cjs3.default.green(esm_default.circleFilled),
    unchecked: esm_default.circle,
    cursor: esm_default.pointer
  },
  style: {
    disabledChoice: (text) => import_yoctocolors_cjs3.default.dim(`- ${text}`),
    renderSelectedChoices: (selectedChoices) => selectedChoices.map((choice) => choice.short).join(", "),
    description: (text) => import_yoctocolors_cjs3.default.cyan(text)
  },
  helpMode: "auto"
};
function isSelectable(item) {
  return !Separator.isSeparator(item) && !item.disabled;
}
function isChecked(item) {
  return isSelectable(item) && Boolean(item.checked);
}
function toggle(item) {
  return isSelectable(item) ? { ...item, checked: !item.checked } : item;
}
function check(checked) {
  return function(item) {
    return isSelectable(item) ? { ...item, checked } : item;
  };
}
function normalizeChoices(choices) {
  return choices.map((choice) => {
    if (Separator.isSeparator(choice))
      return choice;
    if (typeof choice === "string") {
      return {
        value: choice,
        name: choice,
        short: choice,
        disabled: false,
        checked: false
      };
    }
    const name = choice.name ?? String(choice.value);
    return {
      value: choice.value,
      name,
      short: choice.short ?? name,
      description: choice.description,
      disabled: choice.disabled ?? false,
      checked: choice.checked ?? false
    };
  });
}
var esm_default2 = createPrompt((config, done) => {
  const { instructions, pageSize = 7, loop = true, required, validate: validate2 = () => true } = config;
  const shortcuts = { all: "a", invert: "i", ...config.shortcuts };
  const theme = makeTheme(checkboxTheme, config.theme);
  const firstRender = useRef(true);
  const [status, setStatus] = useState("idle");
  const prefix = usePrefix({ status, theme });
  const [items, setItems] = useState(normalizeChoices(config.choices));
  const bounds = useMemo(() => {
    const first = items.findIndex(isSelectable);
    const last = items.findLastIndex(isSelectable);
    if (first === -1) {
      throw new ValidationError("[checkbox prompt] No selectable choices. All choices are disabled.");
    }
    return { first, last };
  }, [items]);
  const [active, setActive] = useState(bounds.first);
  const [showHelpTip, setShowHelpTip] = useState(true);
  const [errorMsg, setError] = useState();
  useKeypress(async (key2) => {
    if (isEnterKey(key2)) {
      const selection = items.filter(isChecked);
      const isValid = await validate2([...selection]);
      if (required && !items.some(isChecked)) {
        setError("At least one choice must be selected");
      } else if (isValid === true) {
        setStatus("done");
        done(selection.map((choice) => choice.value));
      } else {
        setError(isValid || "You must select a valid value");
      }
    } else if (isUpKey(key2) || isDownKey(key2)) {
      if (loop || isUpKey(key2) && active !== bounds.first || isDownKey(key2) && active !== bounds.last) {
        const offset = isUpKey(key2) ? -1 : 1;
        let next = active;
        do {
          next = (next + offset + items.length) % items.length;
        } while (!isSelectable(items[next]));
        setActive(next);
      }
    } else if (isSpaceKey(key2)) {
      setError(undefined);
      setShowHelpTip(false);
      setItems(items.map((choice, i) => i === active ? toggle(choice) : choice));
    } else if (key2.name === shortcuts.all) {
      const selectAll = items.some((choice) => isSelectable(choice) && !choice.checked);
      setItems(items.map(check(selectAll)));
    } else if (key2.name === shortcuts.invert) {
      setItems(items.map(toggle));
    } else if (isNumberKey(key2)) {
      const position = Number(key2.name) - 1;
      const item = items[position];
      if (item != null && isSelectable(item)) {
        setActive(position);
        setItems(items.map((choice, i) => i === position ? toggle(choice) : choice));
      }
    }
  });
  const message = theme.style.message(config.message, status);
  let description;
  const page = usePagination({
    items,
    active,
    renderItem({ item, isActive }) {
      if (Separator.isSeparator(item)) {
        return ` ${item.separator}`;
      }
      if (item.disabled) {
        const disabledLabel = typeof item.disabled === "string" ? item.disabled : "(disabled)";
        return theme.style.disabledChoice(`${item.name} ${disabledLabel}`);
      }
      if (isActive) {
        description = item.description;
      }
      const checkbox = item.checked ? theme.icon.checked : theme.icon.unchecked;
      const color = isActive ? theme.style.highlight : (x) => x;
      const cursor = isActive ? theme.icon.cursor : " ";
      return color(`${cursor}${checkbox} ${item.name}`);
    },
    pageSize,
    loop
  });
  if (status === "done") {
    const selection = items.filter(isChecked);
    const answer = theme.style.answer(theme.style.renderSelectedChoices(selection, items));
    return `${prefix} ${message} ${answer}`;
  }
  let helpTipTop = "";
  let helpTipBottom = "";
  if (theme.helpMode === "always" || theme.helpMode === "auto" && showHelpTip && (instructions === undefined || instructions)) {
    if (typeof instructions === "string") {
      helpTipTop = instructions;
    } else {
      const keys = [
        `${theme.style.key("space")} to select`,
        shortcuts.all ? `${theme.style.key(shortcuts.all)} to toggle all` : "",
        shortcuts.invert ? `${theme.style.key(shortcuts.invert)} to invert selection` : "",
        `and ${theme.style.key("enter")} to proceed`
      ];
      helpTipTop = ` (Press ${keys.filter((key2) => key2 !== "").join(", ")})`;
    }
    if (items.length > pageSize && (theme.helpMode === "always" || theme.helpMode === "auto" && firstRender.current)) {
      helpTipBottom = `
${theme.style.help("(Use arrow keys to reveal more choices)")}`;
      firstRender.current = false;
    }
  }
  const choiceDescription = description ? `
${theme.style.description(description)}` : ``;
  let error = "";
  if (errorMsg) {
    error = `
${theme.style.error(errorMsg)}`;
  }
  return `${prefix} ${message}${helpTipTop}
${page}${helpTipBottom}${choiceDescription}${error}${import_ansi_escapes2.default.cursorHide}`;
});
// node_modules/@inquirer/editor/dist/esm/index.js
var import_external_editor = __toESM(require_main(), 1);
import { AsyncResource as AsyncResource4 } from "node:async_hooks";
var editorTheme = {
  validationFailureMode: "keep"
};
var esm_default3 = createPrompt((config, done) => {
  const { waitForUseInput = true, file: { postfix = config.postfix ?? ".txt", ...fileProps } = {}, validate: validate2 = () => true } = config;
  const theme = makeTheme(editorTheme, config.theme);
  const [status, setStatus] = useState("idle");
  const [value = "", setValue] = useState(config.default);
  const [errorMsg, setError] = useState();
  const prefix = usePrefix({ status, theme });
  function startEditor(rl) {
    rl.pause();
    const editCallback = AsyncResource4.bind(async (error2, answer) => {
      rl.resume();
      if (error2) {
        setError(error2.toString());
      } else {
        setStatus("loading");
        const isValid = await validate2(answer);
        if (isValid === true) {
          setError(undefined);
          setStatus("done");
          done(answer);
        } else {
          if (theme.validationFailureMode === "clear") {
            setValue(config.default);
          } else {
            setValue(answer);
          }
          setError(isValid || "You must provide a valid value");
          setStatus("idle");
        }
      }
    });
    import_external_editor.editAsync(value, (error2, answer) => void editCallback(error2, answer), {
      postfix,
      ...fileProps
    });
  }
  useEffect((rl) => {
    if (!waitForUseInput) {
      startEditor(rl);
    }
  }, []);
  useKeypress((key2, rl) => {
    if (status !== "idle") {
      return;
    }
    if (isEnterKey(key2)) {
      startEditor(rl);
    }
  });
  const message = theme.style.message(config.message, status);
  let helpTip = "";
  if (status === "loading") {
    helpTip = theme.style.help("Received");
  } else if (status === "idle") {
    const enterKey = theme.style.key("enter");
    helpTip = theme.style.help(`Press ${enterKey} to launch your preferred editor.`);
  }
  let error = "";
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }
  return [[prefix, message, helpTip].filter(Boolean).join(" "), error];
});
// node_modules/@inquirer/confirm/dist/esm/index.js
function getBooleanValue(value, defaultValue) {
  let answer = defaultValue !== false;
  if (/^(y|yes)/i.test(value))
    answer = true;
  else if (/^(n|no)/i.test(value))
    answer = false;
  return answer;
}
function boolToString(value) {
  return value ? "Yes" : "No";
}
var esm_default4 = createPrompt((config, done) => {
  const { transformer = boolToString } = config;
  const [status, setStatus] = useState("idle");
  const [value, setValue] = useState("");
  const theme = makeTheme(config.theme);
  const prefix = usePrefix({ status, theme });
  useKeypress((key2, rl) => {
    if (isEnterKey(key2)) {
      const answer = getBooleanValue(value, config.default);
      setValue(transformer(answer));
      setStatus("done");
      done(answer);
    } else if (key2.name === "tab") {
      const answer = boolToString(!getBooleanValue(value, config.default));
      rl.clearLine(0);
      rl.write(answer);
      setValue(answer);
    } else {
      setValue(rl.line);
    }
  });
  let formattedValue = value;
  let defaultValue = "";
  if (status === "done") {
    formattedValue = theme.style.answer(value);
  } else {
    defaultValue = ` ${theme.style.defaultAnswer(config.default === false ? "y/N" : "Y/n")}`;
  }
  const message = theme.style.message(config.message, status);
  return `${prefix} ${message}${defaultValue} ${formattedValue}`;
});
// node_modules/@inquirer/input/dist/esm/index.js
var inputTheme = {
  validationFailureMode: "keep"
};
var esm_default5 = createPrompt((config, done) => {
  const { required, validate: validate2 = () => true } = config;
  const theme = makeTheme(inputTheme, config.theme);
  const [status, setStatus] = useState("idle");
  const [defaultValue = "", setDefaultValue] = useState(config.default);
  const [errorMsg, setError] = useState();
  const [value, setValue] = useState("");
  const prefix = usePrefix({ status, theme });
  useKeypress(async (key2, rl) => {
    if (status !== "idle") {
      return;
    }
    if (isEnterKey(key2)) {
      const answer = value || defaultValue;
      setStatus("loading");
      const isValid = required && !answer ? "You must provide a value" : await validate2(answer);
      if (isValid === true) {
        setValue(answer);
        setStatus("done");
        done(answer);
      } else {
        if (theme.validationFailureMode === "clear") {
          setValue("");
        } else {
          rl.write(value);
        }
        setError(isValid || "You must provide a valid value");
        setStatus("idle");
      }
    } else if (isBackspaceKey(key2) && !value) {
      setDefaultValue(undefined);
    } else if (key2.name === "tab" && !value) {
      setDefaultValue(undefined);
      rl.clearLine(0);
      rl.write(defaultValue);
      setValue(defaultValue);
    } else {
      setValue(rl.line);
      setError(undefined);
    }
  });
  const message = theme.style.message(config.message, status);
  let formattedValue = value;
  if (typeof config.transformer === "function") {
    formattedValue = config.transformer(value, { isFinal: status === "done" });
  } else if (status === "done") {
    formattedValue = theme.style.answer(value);
  }
  let defaultStr;
  if (defaultValue && status !== "done" && !value) {
    defaultStr = theme.style.defaultAnswer(defaultValue);
  }
  let error = "";
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }
  return [
    [prefix, message, defaultStr, formattedValue].filter((v) => v !== undefined).join(" "),
    error
  ];
});
// node_modules/@inquirer/number/dist/esm/index.js
function isStepOf(value, step, min) {
  const valuePow = value * Math.pow(10, 6);
  const stepPow = step * Math.pow(10, 6);
  const minPow = min * Math.pow(10, 6);
  return (valuePow - (Number.isFinite(min) ? minPow : 0)) % stepPow === 0;
}
function validateNumber(value, { min, max, step }) {
  if (value == null || Number.isNaN(value)) {
    return false;
  } else if (value < min || value > max) {
    return `Value must be between ${min} and ${max}`;
  } else if (step !== "any" && !isStepOf(value, step, min)) {
    return `Value must be a multiple of ${step}${Number.isFinite(min) ? ` starting from ${min}` : ""}`;
  }
  return true;
}
var esm_default6 = createPrompt((config, done) => {
  const { validate: validate2 = () => true, min = -Infinity, max = Infinity, step = 1, required = false } = config;
  const theme = makeTheme(config.theme);
  const [status, setStatus] = useState("idle");
  const [value, setValue] = useState("");
  const validDefault = validateNumber(config.default, { min, max, step }) === true ? config.default?.toString() : undefined;
  const [defaultValue = "", setDefaultValue] = useState(validDefault);
  const [errorMsg, setError] = useState();
  const prefix = usePrefix({ status, theme });
  useKeypress(async (key2, rl) => {
    if (status !== "idle") {
      return;
    }
    if (isEnterKey(key2)) {
      const input = value || defaultValue;
      const answer = input === "" ? undefined : Number(input);
      setStatus("loading");
      let isValid = true;
      if (required || answer != null) {
        isValid = validateNumber(answer, { min, max, step });
      }
      if (isValid === true) {
        isValid = await validate2(answer);
      }
      if (isValid === true) {
        setValue(String(answer ?? ""));
        setStatus("done");
        done(answer);
      } else {
        rl.write(value);
        setError(isValid || "You must provide a valid numeric value");
        setStatus("idle");
      }
    } else if (isBackspaceKey(key2) && !value) {
      setDefaultValue(undefined);
    } else if (key2.name === "tab" && !value) {
      setDefaultValue(undefined);
      rl.clearLine(0);
      rl.write(defaultValue);
      setValue(defaultValue);
    } else {
      setValue(rl.line);
      setError(undefined);
    }
  });
  const message = theme.style.message(config.message, status);
  let formattedValue = value;
  if (status === "done") {
    formattedValue = theme.style.answer(value);
  }
  let defaultStr;
  if (defaultValue && status !== "done" && !value) {
    defaultStr = theme.style.defaultAnswer(defaultValue);
  }
  let error = "";
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }
  return [
    [prefix, message, defaultStr, formattedValue].filter((v) => v !== undefined).join(" "),
    error
  ];
});
// node_modules/@inquirer/expand/dist/esm/index.js
var import_yoctocolors_cjs4 = __toESM(require_yoctocolors_cjs(), 1);
function normalizeChoices2(choices) {
  return choices.map((choice) => {
    if (Separator.isSeparator(choice)) {
      return choice;
    }
    const name = "name" in choice ? choice.name : String(choice.value);
    const value = "value" in choice ? choice.value : name;
    return {
      value,
      name,
      key: choice.key.toLowerCase()
    };
  });
}
var helpChoice = {
  key: "h",
  name: "Help, list all options",
  value: undefined
};
var esm_default7 = createPrompt((config, done) => {
  const { default: defaultKey = "h" } = config;
  const choices = useMemo(() => normalizeChoices2(config.choices), [config.choices]);
  const [status, setStatus] = useState("idle");
  const [value, setValue] = useState("");
  const [expanded, setExpanded] = useState(config.expanded ?? false);
  const [errorMsg, setError] = useState();
  const theme = makeTheme(config.theme);
  const prefix = usePrefix({ theme, status });
  useKeypress((event, rl) => {
    if (isEnterKey(event)) {
      const answer = (value || defaultKey).toLowerCase();
      if (answer === "h" && !expanded) {
        setExpanded(true);
      } else {
        const selectedChoice = choices.find((choice) => !Separator.isSeparator(choice) && choice.key === answer);
        if (selectedChoice) {
          setStatus("done");
          setValue(answer);
          done(selectedChoice.value);
        } else if (value === "") {
          setError("Please input a value");
        } else {
          setError(`"${import_yoctocolors_cjs4.default.red(value)}" isn't an available option`);
        }
      }
    } else {
      setValue(rl.line);
      setError(undefined);
    }
  });
  const message = theme.style.message(config.message, status);
  if (status === "done") {
    const selectedChoice = choices.find((choice) => !Separator.isSeparator(choice) && choice.key === value.toLowerCase());
    return `${prefix} ${message} ${theme.style.answer(selectedChoice.name)}`;
  }
  const allChoices = expanded ? choices : [...choices, helpChoice];
  let longChoices = "";
  let shortChoices = allChoices.map((choice) => {
    if (Separator.isSeparator(choice))
      return "";
    if (choice.key === defaultKey) {
      return choice.key.toUpperCase();
    }
    return choice.key;
  }).join("");
  shortChoices = ` ${theme.style.defaultAnswer(shortChoices)}`;
  if (expanded) {
    shortChoices = "";
    longChoices = allChoices.map((choice) => {
      if (Separator.isSeparator(choice)) {
        return ` ${choice.separator}`;
      }
      const line = `  ${choice.key}) ${choice.name}`;
      if (choice.key === value.toLowerCase()) {
        return theme.style.highlight(line);
      }
      return line;
    }).join(`
`);
  }
  let helpTip = "";
  const currentOption = choices.find((choice) => !Separator.isSeparator(choice) && choice.key === value.toLowerCase());
  if (currentOption) {
    helpTip = `${import_yoctocolors_cjs4.default.cyan(">>")} ${currentOption.name}`;
  }
  let error = "";
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }
  return [
    `${prefix} ${message}${shortChoices} ${value}`,
    [longChoices, helpTip, error].filter(Boolean).join(`
`)
  ];
});
// node_modules/@inquirer/rawlist/dist/esm/index.js
var import_yoctocolors_cjs5 = __toESM(require_yoctocolors_cjs(), 1);
var numberRegex = /\d+/;
function isSelectableChoice(choice) {
  return choice != null && !Separator.isSeparator(choice);
}
function normalizeChoices3(choices) {
  let index = 0;
  return choices.map((choice) => {
    if (Separator.isSeparator(choice))
      return choice;
    index += 1;
    if (typeof choice === "string") {
      return {
        value: choice,
        name: choice,
        short: choice,
        key: String(index)
      };
    }
    const name = choice.name ?? String(choice.value);
    return {
      value: choice.value,
      name,
      short: choice.short ?? name,
      key: choice.key ?? String(index)
    };
  });
}
var esm_default8 = createPrompt((config, done) => {
  const choices = useMemo(() => normalizeChoices3(config.choices), [config.choices]);
  const [status, setStatus] = useState("idle");
  const [value, setValue] = useState("");
  const [errorMsg, setError] = useState();
  const theme = makeTheme(config.theme);
  const prefix = usePrefix({ status, theme });
  useKeypress((key2, rl) => {
    if (isEnterKey(key2)) {
      let selectedChoice;
      if (numberRegex.test(value)) {
        const answer = Number.parseInt(value, 10) - 1;
        selectedChoice = choices.filter(isSelectableChoice)[answer];
      } else {
        selectedChoice = choices.find((choice) => isSelectableChoice(choice) && choice.key === value);
      }
      if (isSelectableChoice(selectedChoice)) {
        setValue(selectedChoice.short);
        setStatus("done");
        done(selectedChoice.value);
      } else if (value === "") {
        setError("Please input a value");
      } else {
        setError(`"${import_yoctocolors_cjs5.default.red(value)}" isn't an available option`);
      }
    } else {
      setValue(rl.line);
      setError(undefined);
    }
  });
  const message = theme.style.message(config.message, status);
  if (status === "done") {
    return `${prefix} ${message} ${theme.style.answer(value)}`;
  }
  const choicesStr = choices.map((choice) => {
    if (Separator.isSeparator(choice)) {
      return ` ${choice.separator}`;
    }
    const line = `  ${choice.key}) ${choice.name}`;
    if (choice.key === value.toLowerCase()) {
      return theme.style.highlight(line);
    }
    return line;
  }).join(`
`);
  let error = "";
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }
  return [
    `${prefix} ${message} ${value}`,
    [choicesStr, error].filter(Boolean).join(`
`)
  ];
});
// node_modules/@inquirer/password/dist/esm/index.js
var import_ansi_escapes3 = __toESM(require_ansi_escapes(), 1);
var esm_default9 = createPrompt((config, done) => {
  const { validate: validate2 = () => true } = config;
  const theme = makeTheme(config.theme);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setError] = useState();
  const [value, setValue] = useState("");
  const prefix = usePrefix({ status, theme });
  useKeypress(async (key2, rl) => {
    if (status !== "idle") {
      return;
    }
    if (isEnterKey(key2)) {
      const answer = value;
      setStatus("loading");
      const isValid = await validate2(answer);
      if (isValid === true) {
        setValue(answer);
        setStatus("done");
        done(answer);
      } else {
        rl.write(value);
        setError(isValid || "You must provide a valid value");
        setStatus("idle");
      }
    } else {
      setValue(rl.line);
      setError(undefined);
    }
  });
  const message = theme.style.message(config.message, status);
  let formattedValue = "";
  let helpTip;
  if (config.mask) {
    const maskChar = typeof config.mask === "string" ? config.mask : "*";
    formattedValue = maskChar.repeat(value.length);
  } else if (status !== "done") {
    helpTip = `${theme.style.help("[input is masked]")}${import_ansi_escapes3.default.cursorHide}`;
  }
  if (status === "done") {
    formattedValue = theme.style.answer(formattedValue);
  }
  let error = "";
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }
  return [[prefix, message, config.mask ? formattedValue : helpTip].join(" "), error];
});
// node_modules/@inquirer/search/dist/esm/index.js
var import_yoctocolors_cjs6 = __toESM(require_yoctocolors_cjs(), 1);
var searchTheme = {
  icon: { cursor: esm_default.pointer },
  style: {
    disabled: (text) => import_yoctocolors_cjs6.default.dim(`- ${text}`),
    searchTerm: (text) => import_yoctocolors_cjs6.default.cyan(text),
    description: (text) => import_yoctocolors_cjs6.default.cyan(text)
  },
  helpMode: "auto"
};
function isSelectable2(item) {
  return !Separator.isSeparator(item) && !item.disabled;
}
function normalizeChoices4(choices) {
  return choices.map((choice) => {
    if (Separator.isSeparator(choice))
      return choice;
    if (typeof choice === "string") {
      return {
        value: choice,
        name: choice,
        short: choice,
        disabled: false
      };
    }
    const name = choice.name ?? String(choice.value);
    return {
      value: choice.value,
      name,
      description: choice.description,
      short: choice.short ?? name,
      disabled: choice.disabled ?? false
    };
  });
}
var esm_default10 = createPrompt((config, done) => {
  const { pageSize = 7, validate: validate2 = () => true } = config;
  const theme = makeTheme(searchTheme, config.theme);
  const firstRender = useRef(true);
  const [status, setStatus] = useState("loading");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState();
  const prefix = usePrefix({ status, theme });
  const bounds = useMemo(() => {
    const first = searchResults.findIndex(isSelectable2);
    const last = searchResults.findLastIndex(isSelectable2);
    return { first, last };
  }, [searchResults]);
  const [active = bounds.first, setActive] = useState();
  useEffect(() => {
    const controller = new AbortController;
    setStatus("loading");
    setSearchError(undefined);
    const fetchResults = async () => {
      try {
        const results = await config.source(searchTerm || undefined, {
          signal: controller.signal
        });
        if (!controller.signal.aborted) {
          setActive(undefined);
          setSearchError(undefined);
          setSearchResults(normalizeChoices4(results));
          setStatus("idle");
        }
      } catch (error2) {
        if (!controller.signal.aborted && error2 instanceof Error) {
          setSearchError(error2.message);
        }
      }
    };
    fetchResults();
    return () => {
      controller.abort();
    };
  }, [searchTerm]);
  const selectedChoice = searchResults[active];
  useKeypress(async (key2, rl) => {
    if (isEnterKey(key2)) {
      if (selectedChoice) {
        setStatus("loading");
        const isValid = await validate2(selectedChoice.value);
        setStatus("idle");
        if (isValid === true) {
          setStatus("done");
          done(selectedChoice.value);
        } else if (selectedChoice.name === searchTerm) {
          setSearchError(isValid || "You must provide a valid value");
        } else {
          rl.write(selectedChoice.name);
          setSearchTerm(selectedChoice.name);
        }
      } else {
        rl.write(searchTerm);
      }
    } else if (key2.name === "tab" && selectedChoice) {
      rl.clearLine(0);
      rl.write(selectedChoice.name);
      setSearchTerm(selectedChoice.name);
    } else if (status !== "loading" && (key2.name === "up" || key2.name === "down")) {
      rl.clearLine(0);
      if (key2.name === "up" && active !== bounds.first || key2.name === "down" && active !== bounds.last) {
        const offset = key2.name === "up" ? -1 : 1;
        let next = active;
        do {
          next = (next + offset + searchResults.length) % searchResults.length;
        } while (!isSelectable2(searchResults[next]));
        setActive(next);
      }
    } else {
      setSearchTerm(rl.line);
    }
  });
  const message = theme.style.message(config.message, status);
  if (active > 0) {
    firstRender.current = false;
  }
  let helpTip = "";
  if (searchResults.length > 1 && (theme.helpMode === "always" || theme.helpMode === "auto" && firstRender.current)) {
    helpTip = searchResults.length > pageSize ? `
${theme.style.help("(Use arrow keys to reveal more choices)")}` : `
${theme.style.help("(Use arrow keys)")}`;
  }
  const page = usePagination({
    items: searchResults,
    active,
    renderItem({ item, isActive }) {
      if (Separator.isSeparator(item)) {
        return ` ${item.separator}`;
      }
      if (item.disabled) {
        const disabledLabel = typeof item.disabled === "string" ? item.disabled : "(disabled)";
        return theme.style.disabled(`${item.name} ${disabledLabel}`);
      }
      const color = isActive ? theme.style.highlight : (x) => x;
      const cursor = isActive ? theme.icon.cursor : ` `;
      return color(`${cursor} ${item.name}`);
    },
    pageSize,
    loop: false
  });
  let error;
  if (searchError) {
    error = theme.style.error(searchError);
  } else if (searchResults.length === 0 && searchTerm !== "" && status === "idle") {
    error = theme.style.error("No results found");
  }
  let searchStr;
  if (status === "done" && selectedChoice) {
    const answer = selectedChoice.short;
    return `${prefix} ${message} ${theme.style.answer(answer)}`;
  } else {
    searchStr = theme.style.searchTerm(searchTerm);
  }
  const choiceDescription = selectedChoice?.description ? `
${theme.style.description(selectedChoice.description)}` : ``;
  return [
    [prefix, message, searchStr].filter(Boolean).join(" "),
    `${error ?? page}${helpTip}${choiceDescription}`
  ];
});
// node_modules/@inquirer/select/dist/esm/index.js
var import_yoctocolors_cjs7 = __toESM(require_yoctocolors_cjs(), 1);
var import_ansi_escapes4 = __toESM(require_ansi_escapes(), 1);
var selectTheme = {
  icon: { cursor: esm_default.pointer },
  style: {
    disabled: (text) => import_yoctocolors_cjs7.default.dim(`- ${text}`),
    description: (text) => import_yoctocolors_cjs7.default.cyan(text)
  },
  helpMode: "auto"
};
function isSelectable3(item) {
  return !Separator.isSeparator(item) && !item.disabled;
}
function normalizeChoices5(choices) {
  return choices.map((choice) => {
    if (Separator.isSeparator(choice))
      return choice;
    if (typeof choice === "string") {
      return {
        value: choice,
        name: choice,
        short: choice,
        disabled: false
      };
    }
    const name = choice.name ?? String(choice.value);
    return {
      value: choice.value,
      name,
      description: choice.description,
      short: choice.short ?? name,
      disabled: choice.disabled ?? false
    };
  });
}
var esm_default11 = createPrompt((config, done) => {
  const { loop = true, pageSize = 7 } = config;
  const firstRender = useRef(true);
  const theme = makeTheme(selectTheme, config.theme);
  const [status, setStatus] = useState("idle");
  const prefix = usePrefix({ status, theme });
  const searchTimeoutRef = useRef();
  const items = useMemo(() => normalizeChoices5(config.choices), [config.choices]);
  const bounds = useMemo(() => {
    const first = items.findIndex(isSelectable3);
    const last = items.findLastIndex(isSelectable3);
    if (first === -1) {
      throw new ValidationError("[select prompt] No selectable choices. All choices are disabled.");
    }
    return { first, last };
  }, [items]);
  const defaultItemIndex = useMemo(() => {
    if (!("default" in config))
      return -1;
    return items.findIndex((item) => isSelectable3(item) && item.value === config.default);
  }, [config.default, items]);
  const [active, setActive] = useState(defaultItemIndex === -1 ? bounds.first : defaultItemIndex);
  const selectedChoice = items[active];
  useKeypress((key2, rl) => {
    clearTimeout(searchTimeoutRef.current);
    if (isEnterKey(key2)) {
      setStatus("done");
      done(selectedChoice.value);
    } else if (isUpKey(key2) || isDownKey(key2)) {
      rl.clearLine(0);
      if (loop || isUpKey(key2) && active !== bounds.first || isDownKey(key2) && active !== bounds.last) {
        const offset = isUpKey(key2) ? -1 : 1;
        let next = active;
        do {
          next = (next + offset + items.length) % items.length;
        } while (!isSelectable3(items[next]));
        setActive(next);
      }
    } else if (isNumberKey(key2)) {
      rl.clearLine(0);
      const position = Number(key2.name) - 1;
      const item = items[position];
      if (item != null && isSelectable3(item)) {
        setActive(position);
      }
    } else if (isBackspaceKey(key2)) {
      rl.clearLine(0);
    } else {
      const searchTerm = rl.line.toLowerCase();
      const matchIndex = items.findIndex((item) => {
        if (Separator.isSeparator(item) || !isSelectable3(item))
          return false;
        return item.name.toLowerCase().startsWith(searchTerm);
      });
      if (matchIndex !== -1) {
        setActive(matchIndex);
      }
      searchTimeoutRef.current = setTimeout(() => {
        rl.clearLine(0);
      }, 700);
    }
  });
  useEffect(() => () => {
    clearTimeout(searchTimeoutRef.current);
  }, []);
  const message = theme.style.message(config.message, status);
  let helpTipTop = "";
  let helpTipBottom = "";
  if (theme.helpMode === "always" || theme.helpMode === "auto" && firstRender.current) {
    firstRender.current = false;
    if (items.length > pageSize) {
      helpTipBottom = `
${theme.style.help("(Use arrow keys to reveal more choices)")}`;
    } else {
      helpTipTop = theme.style.help("(Use arrow keys)");
    }
  }
  const page = usePagination({
    items,
    active,
    renderItem({ item, isActive }) {
      if (Separator.isSeparator(item)) {
        return ` ${item.separator}`;
      }
      if (item.disabled) {
        const disabledLabel = typeof item.disabled === "string" ? item.disabled : "(disabled)";
        return theme.style.disabled(`${item.name} ${disabledLabel}`);
      }
      const color = isActive ? theme.style.highlight : (x) => x;
      const cursor = isActive ? theme.icon.cursor : ` `;
      return color(`${cursor} ${item.name}`);
    },
    pageSize,
    loop
  });
  if (status === "done") {
    return `${prefix} ${message} ${theme.style.answer(selectedChoice.short)}`;
  }
  const choiceDescription = selectedChoice.description ? `
${theme.style.description(selectedChoice.description)}` : ``;
  return `${[prefix, message, helpTipTop].filter(Boolean).join(" ")}
${page}${helpTipBottom}${choiceDescription}${import_ansi_escapes4.default.cursorHide}`;
});
// node_modules/inquirer/dist/esm/ui/prompt.js
var import_rxjs = __toESM(require_cjs(), 1);
var import_run_async = __toESM(require_run_async(), 1);
var import_mute_stream2 = __toESM(require_lib2(), 1);
import readline3 from "node:readline";
var import_ansi_escapes5 = __toESM(require_ansi_escapes(), 1);
var _ = {
  set: (obj, path = "", value) => {
    let pointer = obj;
    path.split(".").forEach((key2, index, arr) => {
      if (key2 === "__proto__" || key2 === "constructor")
        return;
      if (index === arr.length - 1) {
        pointer[key2] = value;
      } else if (!(key2 in pointer) || typeof pointer[key2] !== "object") {
        pointer[key2] = {};
      }
      pointer = pointer[key2];
    });
  },
  get: (obj, path = "", defaultValue) => {
    const travel = (regexp) => String.prototype.split.call(path, regexp).filter(Boolean).reduce((res, key2) => res == null ? res : res[key2], obj);
    const result = travel(/[,[\]]+?/) || travel(/[,.[\]]+?/);
    return result === undefined || result === obj ? defaultValue : result;
  }
};
async function fetchAsyncQuestionProperty(question, prop, answers) {
  const propGetter = question[prop];
  if (typeof propGetter === "function") {
    return import_run_async.default(propGetter)(answers);
  }
  return propGetter;
}

class TTYError extends Error {
  name = "TTYError";
  isTtyError = true;
}
function setupReadlineOptions(opt) {
  opt.skipTTYChecks = opt.skipTTYChecks === undefined ? true : opt.skipTTYChecks;
  const input = opt.input || process.stdin;
  if (!opt.skipTTYChecks && !input.isTTY) {
    throw new TTYError("Prompts can not be meaningfully rendered in non-TTY environments");
  }
  const ms = new import_mute_stream2.default;
  ms.pipe(opt.output || process.stdout);
  const output = ms;
  return {
    terminal: true,
    ...opt,
    input,
    output
  };
}
function isQuestionArray(questions) {
  return Array.isArray(questions);
}
function isQuestionMap(questions) {
  return Object.values(questions).every((maybeQuestion) => typeof maybeQuestion === "object" && !Array.isArray(maybeQuestion) && maybeQuestion != null);
}
function isPromptConstructor(prompt) {
  return Boolean(prompt.prototype && "run" in prompt.prototype && typeof prompt.prototype.run === "function");
}

class PromptsRunner {
  prompts;
  answers = {};
  process = import_rxjs.EMPTY;
  abortController = new AbortController;
  opt;
  constructor(prompts, opt = {}) {
    this.opt = opt;
    this.prompts = prompts;
  }
  async run(questions, answers) {
    this.abortController = new AbortController;
    this.answers = typeof answers === "object" ? { ...answers } : {};
    let obs;
    if (isQuestionArray(questions)) {
      obs = import_rxjs.from(questions);
    } else if (import_rxjs.isObservable(questions)) {
      obs = questions;
    } else if (isQuestionMap(questions)) {
      obs = import_rxjs.from(Object.entries(questions).map(([name, question]) => {
        return Object.assign({}, question, { name });
      }));
    } else {
      obs = import_rxjs.from([questions]);
    }
    this.process = obs.pipe(import_rxjs.concatMap((question) => import_rxjs.of(question).pipe(import_rxjs.concatMap((question2) => import_rxjs.from(this.shouldRun(question2).then((shouldRun) => {
      if (shouldRun) {
        return question2;
      }
      return;
    })).pipe(import_rxjs.filter((val) => val != null))), import_rxjs.concatMap((question2) => import_rxjs.defer(() => import_rxjs.from(this.fetchAnswer(question2)))))));
    return import_rxjs.lastValueFrom(this.process.pipe(import_rxjs.reduce((answersObj, answer) => {
      _.set(answersObj, answer.name, answer.answer);
      return answersObj;
    }, this.answers))).then(() => this.answers).finally(() => this.close());
  }
  prepareQuestion = async (question) => {
    const [message, defaultValue, resolvedChoices] = await Promise.all([
      fetchAsyncQuestionProperty(question, "message", this.answers),
      fetchAsyncQuestionProperty(question, "default", this.answers),
      fetchAsyncQuestionProperty(question, "choices", this.answers)
    ]);
    let choices;
    if (Array.isArray(resolvedChoices)) {
      choices = resolvedChoices.map((choice) => {
        const choiceObj = typeof choice !== "object" || choice == null ? { name: choice, value: choice } : {
          ...choice,
          value: "value" in choice ? choice.value : ("name" in choice) ? choice.name : undefined
        };
        if ("value" in choiceObj && Array.isArray(defaultValue)) {
          return {
            checked: defaultValue.includes(choiceObj.value),
            ...choiceObj
          };
        }
        return choiceObj;
      });
    }
    return Object.assign({}, question, {
      message,
      default: defaultValue,
      choices,
      type: question.type in this.prompts ? question.type : "input"
    });
  };
  fetchAnswer = async (rawQuestion) => {
    const question = await this.prepareQuestion(rawQuestion);
    const prompt = this.prompts[question.type];
    if (prompt == null) {
      throw new Error(`Prompt for type ${question.type} not found`);
    }
    let cleanupSignal;
    const promptFn = isPromptConstructor(prompt) ? (q, opt) => new Promise((resolve, reject) => {
      const { signal: signal2 } = opt;
      if (signal2.aborted) {
        reject(new AbortPromptError({ cause: signal2.reason }));
        return;
      }
      const rl = readline3.createInterface(setupReadlineOptions(opt));
      const onForceClose = () => {
        this.close();
        process.kill(process.pid, "SIGINT");
        console.log("");
      };
      const onClose = () => {
        process.removeListener("exit", onForceClose);
        rl.removeListener("SIGINT", onForceClose);
        rl.setPrompt("");
        rl.output.unmute();
        rl.output.write(import_ansi_escapes5.default.cursorShow);
        rl.output.end();
        rl.close();
      };
      process.on("exit", onForceClose);
      rl.on("SIGINT", onForceClose);
      const activePrompt = new prompt(q, rl, this.answers);
      const cleanup = () => {
        onClose();
        cleanupSignal?.();
      };
      const abort = () => {
        reject(new AbortPromptError({ cause: signal2.reason }));
        cleanup();
      };
      signal2.addEventListener("abort", abort);
      cleanupSignal = () => {
        signal2.removeEventListener("abort", abort);
        cleanupSignal = undefined;
      };
      activePrompt.run().then(resolve, reject).finally(cleanup);
    }) : prompt;
    let cleanupModuleSignal;
    const { signal: moduleSignal } = this.opt;
    if (moduleSignal?.aborted) {
      this.abortController.abort(moduleSignal.reason);
    } else if (moduleSignal) {
      const abort = () => this.abortController.abort(moduleSignal.reason);
      moduleSignal.addEventListener("abort", abort);
      cleanupModuleSignal = () => {
        moduleSignal.removeEventListener("abort", abort);
      };
    }
    const { filter: filter2 = (value) => value } = question;
    const { signal } = this.abortController;
    return promptFn(question, { ...this.opt, signal }).then((answer) => ({
      name: question.name,
      answer: filter2(answer, this.answers)
    })).finally(() => {
      cleanupSignal?.();
      cleanupModuleSignal?.();
    });
  };
  close = () => {
    this.abortController.abort();
  };
  shouldRun = async (question) => {
    if (question.askAnswered !== true && _.get(this.answers, question.name) !== undefined) {
      return false;
    }
    const { when } = question;
    if (typeof when === "function") {
      const shouldRun = await import_run_async.default(when)(this.answers);
      return Boolean(shouldRun);
    }
    return when !== false;
  };
}

// node_modules/inquirer/dist/esm/index.js
var builtInPrompts = {
  input: esm_default5,
  select: esm_default11,
  list: esm_default11,
  number: esm_default6,
  confirm: esm_default4,
  rawlist: esm_default8,
  expand: esm_default7,
  checkbox: esm_default2,
  password: esm_default9,
  editor: esm_default3,
  search: esm_default10
};
function createPromptModule(opt) {
  function promptModule(questions, answers) {
    const runner = new PromptsRunner(promptModule.prompts, opt);
    const promptPromise = runner.run(questions, answers);
    return Object.assign(promptPromise, { ui: runner });
  }
  promptModule.prompts = { ...builtInPrompts };
  promptModule.registerPrompt = function(name, prompt) {
    promptModule.prompts[name] = prompt;
    return this;
  };
  promptModule.restoreDefaultPrompts = function() {
    promptModule.prompts = { ...builtInPrompts };
  };
  return promptModule;
}
var prompt = createPromptModule();
function registerPrompt(name, newPrompt) {
  prompt.registerPrompt(name, newPrompt);
}
function restoreDefaultPrompts() {
  prompt.restoreDefaultPrompts();
}
var inquirer = {
  prompt,
  ui: {
    Prompt: PromptsRunner
  },
  createPromptModule,
  registerPrompt,
  restoreDefaultPrompts,
  Separator
};
var esm_default12 = inquirer;

// index.ts
var program2 = new Command;
program2.name("create-project").description("CLI para crear un template de proyecto base").version("1.0.0").argument("[project-name]", "Nombre del proyecto").action(async (projectName) => {
  if (!projectName) {
    const response = await esm_default12.prompt([
      {
        type: "input",
        name: "projectName",
        message: "Introduce el nombre del proyecto:",
        validate: (input) => input ? true : "El nombre del proyecto no puede estar vacío."
      }
    ]);
    projectName = response.projectName;
  }
  const projectPath = path.join(process.cwd(), projectName);
  if (import_fs_extra.default.existsSync(projectPath)) {
    console.error(`El directorio ${projectName} ya existe.`);
    process.exit(1);
  }
  const spinner = ora("Creando proyecto...").start();
  import_fs_extra.default.mkdirSync(projectPath);
  try {
    const folders = ["src", "tests"];
    folders.forEach((folder) => import_fs_extra.default.mkdirSync(path.join(projectPath, folder)));
    import_fs_extra.default.writeFileSync(path.join(projectPath, "package.json"), JSON.stringify({
      name: projectName,
      version: "1.0.0",
      scripts: {
        start: "node dist/index.js",
        build: "tsc"
      }
    }, null, 2));
    import_fs_extra.default.writeFileSync(path.join(projectPath, "tsconfig.json"), JSON.stringify({
      compilerOptions: {
        target: "ES6",
        module: "CommonJS",
        outDir: "dist",
        rootDir: "src"
      }
    }, null, 2));
    import_fs_extra.default.writeFileSync(path.join(projectPath, "src", "index.ts"), `console.log('Hello, world!');`);
    spinner.succeed("Proyecto creado con éxito.");
    const { packageManager } = await esm_default12.prompt([
      {
        type: "list",
        name: "packageManager",
        message: "Selecciona el manejador de paquetes:",
        choices: ["npm", "yarn", "pnpm", "bun"]
      }
    ]);
    const { installDependencies } = await esm_default12.prompt([
      {
        type: "confirm",
        name: "installDependencies",
        message: "¿Deseas instalar las dependencias?",
        default: true
      }
    ]);
    if (installDependencies) {
      const installSpinner = ora(`Instalando dependencias con ${packageManager}...`).start();
      try {
        const installCommand = {
          npm: "npm install",
          yarn: "yarn install",
          pnpm: "pnpm install",
          bun: "bun install"
        }[packageManager];
        execSync(installCommand, { cwd: projectPath, stdio: "inherit" });
        installSpinner.succeed("Dependencias instaladas con éxito.");
      } catch (error) {
        installSpinner.fail("Error al instalar dependencias.");
      }
    }
    const { initGit } = await esm_default12.prompt([
      {
        type: "confirm",
        name: "initGit",
        message: "¿Deseas inicializar un repositorio Git?",
        default: true
      }
    ]);
    if (initGit) {
      const gitSpinner = ora("Inicializando repositorio Git...").start();
      try {
        execSync("git init", { cwd: projectPath, stdio: "inherit" });
        import_fs_extra.default.writeFileSync(path.join(projectPath, ".gitignore"), `node_modules
dist
`);
        gitSpinner.succeed("Repositorio Git inicializado con éxito.");
      } catch (error) {
        gitSpinner.fail("Error al inicializar el repositorio Git.");
      }
    }
  } catch (error) {
    spinner.fail("Error al crear el proyecto.");
    console.error(error);
    process.exit(1);
  }
});
program2.parse();
