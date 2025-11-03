import Prism from 'prismjs';

// Definir linguagens completas manualmente com sintaxes mais robustas
const basicLanguages = {
  javascript: {
    comment: [
      {
        pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
        lookbehind: true
      },
      {
        pattern: /(^|[^\\:])\/\/.*/,
        lookbehind: true
      }
    ],
    'string-property': {
      pattern: /((?:^|[,{])[ \t]*)(["'])(?:\\(?:\r\n|[\s\S])|(?!\2)[^\\\r\n])*\2(?=\s*:)/m,
      lookbehind: true,
      greedy: true
    },
    string: {
      pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
      greedy: true
    },
    'template-string': {
      pattern: /`(?:\\[\s\S]|\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}|(?!\${)[^\\`])*`/,
      greedy: true,
      inside: {
        'template-punctuation': {
          pattern: /^`|`$/,
          alias: 'string'
        },
        interpolation: {
          pattern: /((?:^|[^\\])(?:\\{2})*)\${(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}/,
          lookbehind: true,
          inside: {
            'interpolation-punctuation': {
              pattern: /^\${|}$/,
              alias: 'punctuation'
            }
          }
        }
      }
    },
    keyword: /\b(?:as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|undefined|var|void|while|with|yield)\b/,
    'class-name': {
      pattern: /((?:^|[^$\w\xA0-\uFFFF])(?:class|interface|extends|implements|instanceof)\s+)[\w$\xA0-\uFFFF]+/,
      lookbehind: true
    },
    function: /\w+(?=\s*\()/,
    number: /\b(?:0[xX][\dA-Fa-f]+|0[bB][01]+|0[oO][0-7]+|\d+(?:\.\d*)?(?:[Ee][+-]?\d+)?n?)\b/,
    operator: /--|\+\+|\*\*=?|=>|&&=?|\|\|=?|[!=]==|<<=?|>>>?=?|[-+*/%&|^!=<>]=?|\.{3}|\?\?=?|\?\.?|[~:]/,
    punctuation: /[{}[\];(),.:]/
  },
  
  python: {
    comment: {
      pattern: /(^|[^\\])#.*/,
      lookbehind: true
    },
    'string-interpolation': {
      pattern: /(?:f|F)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/,
      greedy: true,
      inside: {
        interpolation: {
          pattern: /((?:^|[^{])(?:{{)*){(?:[^{}]|{(?:[^{}]|{[^}]*})*})+}/,
          lookbehind: true,
          inside: {
            'format-spec': {
              pattern: /(:)[^:(){}]+(?=}$)/,
              lookbehind: true
            },
            'conversion-option': {
              pattern: /![sra](?=[:}]$)/,
              alias: 'punctuation'
            }
          }
        },
        string: /[\s\S]+/
      }
    },
    'triple-quoted-string': {
      pattern: /("""|''')[\s\S]*?\1/,
      greedy: true,
      alias: 'string'
    },
    string: {
      pattern: /("|')(?:\\.|(?!\1)[^\\\r\n])*\1/,
      greedy: true
    },
    function: {
      pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/m,
      lookbehind: true
    },
    'class-name': {
      pattern: /((?:^|\s)class[ \t]+)[a-zA-Z_]\w*(?=\s*(?:\([^)]*\))?[ \t]*:)/m,
      lookbehind: true
    },
    decorator: {
      pattern: /(^[ \t]*)@\w+(?:\.\w+)*/m,
      lookbehind: true,
      alias: ['annotation', 'punctuation'],
      inside: {
        punctuation: /\./
      }
    },
    keyword: /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,
    builtin: /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,
    boolean: /\b(?:True|False|None)\b/,
    number: /\b0(?:b(?:_?[01])+|o(?:_?[0-7])+|x(?:_?[a-f0-9])+)\b|(?:\b\d+(?:_\d+)*(?:\.(?:\d+(?:_\d+)*)?)?|\B\.\d+(?:_\d+)*)(?:e[+-]?\d+(?:_\d+)*)?j?(?!\w)/i,
    operator: /[-+%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,
    punctuation: /[{}[\];(),.:]/
  },

  css: {
    comment: /\/\*[\s\S]*?\*\//,
    atrule: {
      pattern: /@[\w-](?:[^;{\s]|\s+(?![\s{]))*(?:;|(?=\s*\{))/,
      inside: {
        rule: /^@[\w-]+/,
        'selector-function-argument': {
          pattern: /(\bselector\s*\(\s*(?![\s)]))(?:[^()\s]|\s+(?![\s)])|\((?:[^()]|\([^()]*\))*\))+(?=\s*\))/,
          lookbehind: true,
          alias: 'selector'
        },
        keyword: {
          pattern: /(^|[^\w-])(?:and|not|only|or)(?![\w-])/,
          lookbehind: true
        }
      }
    },
    url: {
      pattern: /\burl\((?:(?:"(?:[^\\\r\n"]|\\[\s\S])*"|'(?:[^\\\r\n']|\\[\s\S])*'|[^\s"'()\\]*))\)/i,
      greedy: true,
      inside: {
        function: /^url/i,
        punctuation: /^\(|\)$/,
        string: {
          pattern: /^"[\s\S]*"$|^'[\s\S]*'$/,
          greedy: true
        }
      }
    },
    selector: /[^{}\s][^{}]*(?=\s*\{)/,
    string: {
      pattern: /("|')(?:(?!\1)[^\\\r\n]|\\(?:\r\n|[\s\S]))*\1/,
      greedy: true
    },
    property: /(?!\s)[-_a-z\xA0-\uFFFF][-\w\xA0-\uFFFF]*(?=\s*:)/i,
    important: /!important\b/i,
    function: /[-a-z0-9]+(?=\()/i,
    number: /[\d.]+%?/,
    punctuation: /[(){};:,]/
  },

  html: {
    comment: /<!--[\s\S]*?-->/,
    prolog: /<\?[\s\S]+?\?>/,
    doctype: {
      pattern: /<!DOCTYPE(?:[^>"']|"[^"]*"|'[^']*')+>/i,
      greedy: true,
      inside: {
        'internal-subset': {
          pattern: /(\[)[\s\S]+(?=\]>$)/,
          lookbehind: true
        },
        string: {
          pattern: /"[^"]*"|'[^']*'/,
          greedy: true
        },
        punctuation: /^<!|>$|[[\]]/,
        'doctype-tag': /^DOCTYPE/,
        name: /[^\s<>'"]+/
      }
    },
    cdata: /<!\[CDATA\[[\s\S]*?]]>/i,
    tag: {
      pattern: /<\/?(?!\d)[^\s>\/=$<%]+(?:\s(?:\s*[^\s>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+(?=[\s>]))|(?=[\s/>])))+)?\s*\/?>/,
      greedy: true,
      inside: {
        tag: {
          pattern: /^<\/?[^\s>\/]+/,
          inside: {
            punctuation: /^<\/?/,
            namespace: /^[^\s>\/:]+:/
          }
        },
        'attr-value': {
          pattern: /=\s*(?:"[^"]*"|'[^']*'|[^\s'">=]+)/,
          inside: {
            punctuation: [
              {
                pattern: /^=/,
                alias: 'attr-equals'
              },
              /"|'/
            ]
          }
        },
        punctuation: /\/?>/,
        'attr-name': {
          pattern: /[^\s>\/]+/,
          inside: {
            namespace: /^[^\s>\/:]+:/
          }
        }
      }
    },
    entity: /&#?[\da-z]{1,8};/i
  },

  java: {
    comment: [
      {
        pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
        lookbehind: true
      },
      {
        pattern: /(^|[^\\:])\/\/.*/,
        lookbehind: true
      }
    ],
    string: {
      pattern: /(["'])(?:\\.|(?!\1)[^\\\r\n])*\1/,
      greedy: true
    },
    'class-name': [
      {
        pattern: /((?:^|[^\w.])(?:class|interface|extends|implements|instanceof)\s+)[A-Z]\w*(?:\.[A-Z]\w*)*/,
        lookbehind: true,
        inside: {
          punctuation: /\./
        }
      },
      {
        pattern: /(^|[^\w.])[A-Z]\w*(?=\s+\w+\s*[;,=()])/,
        lookbehind: true
      }
    ],
    keyword: /\b(?:abstract|assert|boolean|break|byte|case|catch|char|class|const|continue|default|do|double|else|enum|extends|final|finally|float|for|goto|if|implements|import|instanceof|int|interface|long|native|new|null|package|private|protected|public|return|short|static|strictfp|super|switch|synchronized|this|throw|throws|transient|try|void|volatile|while)\b/,
    function: /\w+(?=\s*\()/,
    number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?[flsd]?/i,
    operator: /[<>]=?|[!=]=?|--?|\+\+?|&&?|\|\|?|[?*/~^%]/,
    punctuation: /[{}[\];(),.:]/
  },

  sql: {
    comment: {
      pattern: /(^|[^\\])(?:\/\*[\s\S]*?\*\/|(?:--|\/\/|#).*)/,
      lookbehind: true
    },
    variable: [
      {
        pattern: /@(["'`])(?:\\[\s\S]|(?!\1)[^\\])+\1/,
        greedy: true
      },
      /@[\w.$]+/
    ],
    string: {
      pattern: /(^|[^@\\])("|')(?:\\[\s\S]|(?!\2)[^\\]|\2\2)*\2/,
      greedy: true,
      lookbehind: true
    },
    function: /\b(?:AVG|COUNT|FIRST|FORMAT|LAST|LCASE|LEN|MAX|MID|MIN|MOD|NOW|ROUND|SUM|UCASE)(?=\s*\()/i,
    keyword: /\b(?:ACTION|ADD|AFTER|ALGORITHM|ALL|ALTER|ANALYZE|ANY|APPLY|AS|ASC|AUTHORIZATION|AUTO_INCREMENT|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADED?|CASE|CHAIN|CHAR|CHARACTER|CHARSET|CHECK|CHECKPOINT|CLOSE|CLUSTERED|COALESCE|COLUMN|COLUMNS|COMMENT|COMMIT|COMMITTED|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS|CONTAINSTABLE|CONTINUE|CONVERT|CREATE|CROSS|CURRENT|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|CURRENT_USER|CURSOR|CYCLE|DATA|DATABASE|DATABASES|DATETIME|DAY|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DELIMITERS|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DIV|DOUBLE|DROP|DUMMY|DUMP|DUMPFILE|DUPLICATE|ELSE|ENABLE|ENCLOSED|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPED?|EXCEPT|EXEC|EXECUTE|EXISTS|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR|FOR|FORCE|FOREIGN|FREETEXT|FREETEXTTABLE|FROM|FULL|FUNCTION|GEOMETRY|GEOMETRYCOLLECTION|GET|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|HOUR|IDENTITY|IDENTITY_INSERT|IDENTITYCOL|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTERVAL|INTO|INVOKER|ISOLATION|ITERATE|JOIN|KEYS?|KILL|LANGUAGE|LAST|LEAVE|LEFT|LEVEL|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONGBLOB|LONGTEXT|LOOP|MATCH|MATCHED|MEDIUMBLOB|MEDIUMINT|MEDIUMTEXT|MERGE|MIDDLEINT|MINUTE|MODE|MODIFIES|MODIFY|MONTH|MULTILINESTRING|MULTIPOINT|MULTIPOLYGON|MUTEX|NAME|NATIONAL|NATURAL|NCHAR|NONCLUSTERED|NULL|NULLIF|NUMERIC|OFF|OFFSETS|ON|OPEN|OPENDATASOURCE|OPENQUERY|OPENROWSET|OPTIMIZE|OPTION|OPTIONALLY|ORDER|OUT|OUTER|OUTFILE|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREPARE|PREV|PRIMARY|PRINT|PRIVILEGES|PROC|PROCEDURE|PUBLIC|PURGE|QUICK|RAISERROR|READS|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEAT|REPEATABLE|REPLACE|REPLICATION|REQUIRE|RESIGNAL|RESTORE|RESTRICT|RETURN|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROWCOUNT|ROWGUIDCOL|ROWS?|RTREE|RULE|SAVE|SAVEPOINT|SCHEMA|SCOPE|SCROLL|SECURITY|SEEK|SELECT|SERIAL|SERIALIZABLE|SESSION|SET|SETUSER|SHARE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|SQL|SQL_BIG_RESULT|SQL_BIG_SELECTS|SQL_BIG_TABLES|SQL_CALC_FOUND_ROWS|SQL_LOG_OFF|SQL_LOG_UPDATE|SQL_LOW_PRIORITY_UPDATES|SQL_SELECT_LIMIT|SQL_SMALL_RESULT|SQL_WARNINGS|SQLEXCEPTION|SQLSTATE|SQLWARNING|START|STARTING|STATISTICS|STATUS|STEP|STOP|STORAGE|STRAIGHT_JOIN|STRING|STRIPED|SYSTEM|SYSTEM_USER|TABLE|TABLES|TABLESPACE|TEMP|TEMPORARY|TERMINATED|TEXT|TEXTSIZE|THEN|TIME|TIMESTAMP|TINYBLOB|TINYINT|TINYTEXT|TO|TOP|TRAN|TRANSACTION|TRIGGER|TRUNCATE|TSEQUAL|TYPES|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNIQUE|UNLOCK|UNPIVOT|UNSIGNED|UPDATE|UPDATETEXT|USAGE|USE|USER|USING|VALUES?|VARBINARY|VARCHAR|VARCHARACTER|VARYING|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH|WORK|WRITE|YEAR|ZEROFILL)\b/i,
    boolean: /\b(?:TRUE|FALSE|NULL)\b/i,
    number: /\b0x[\da-f]+\b|\b\d+(?:\.\d*)?|\B\.\d+\b/i,
    operator: /[-+*\/=%^~]|&&?|\|\|?|!=?|<(?:=>?|<|>)?|>[>=]?|\b(?:AND|BETWEEN|DIV|IN|ILIKE|NOT|OR|REGEXP|RLIKE|SOUNDS|XOR)\b/i,
    punctuation: /[;[\]()`,.]/
  },

  bash: {
    shebang: {
      pattern: /^#!\s*\/.*/,
      alias: 'important'
    },
    comment: {
      pattern: /(^|[^"{\\$])#.*/,
      lookbehind: true
    },
    'function-name': [
      {
        pattern: /(\bfunction\s+)\w+(?=(?:\s*\(?:\s*\))?\s*\{)/,
        lookbehind: true,
        alias: 'function'
      },
      {
        pattern: /\b\w+(?=\s*\(\s*\)\s*\{)/,
        alias: 'function'
      }
    ],
    'for-or-select': {
      pattern: /(\b(?:for|select)\s+)\w+(?=\s+in\s)/,
      alias: 'variable',
      lookbehind: true
    },
    'assign-left': {
      pattern: /(^|[\s;|&]|[<>]\()\w+(?=\+?=)/,
      inside: {
        environment: {
          pattern: RegExp("(^|[\\s;|&]|[<>]\\()\\w+(?=\\+?=)"),
          lookbehind: true,
          alias: 'constant'
        }
      },
      alias: 'environment',
      lookbehind: true
    },
    string: [
      {
        pattern: /((?:^|[^<])<<-?\s*)(\w+?)\s[\s\S]*?(?:\r?\n|\r)\2/,
        lookbehind: true,
        greedy: true
      },
      {
        pattern: /((?:^|[^<])<<-?\s*)(["'])(\w+)\2\s[\s\S]*?(?:\r?\n|\r)\3/,
        lookbehind: true,
        greedy: true
      },
      {
        pattern: /(^|[^\\](?:\\\\)*)(["'])(?:\\[\s\S]|(?!\2)[^\\])*\2/,
        greedy: true,
        lookbehind: true
      }
    ],
    environment: {
      pattern: /\$\w+|[{}\[\]]/,
      alias: 'constant'
    },
    variable: /\$(?:\w+|[#?*!@$])/,
    function: /\b(?:alias|apropos|apt-get|aptitude|aspell|awk|basename|bash|bc|bg|builtin|bzip2|cal|cat|cd|cfdisk|chgrp|chmod|chown|chroot|chkconfig|cksum|clear|cmp|comm|command|cp|cron|crontab|csplit|cut|date|dc|dd|ddrescue|debootstrap|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|du|egrep|eject|enable|env|ethtool|eval|exec|expand|expect|export|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|getopts|git|grep|groupadd|groupdel|groupmod|groups|gzip|hash|head|help|hg|history|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|jobs|join|kill|killall|less|link|ln|locate|logname|logout|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|make|man|mkdir|mkfifo|mkisofs|mknod|more|most|mount|mtools|mtr|mv|mmv|nano|netstat|nice|nl|nohup|notify-send|nslookup|open|op|passwd|paste|pathchk|ping|pkill|popd|pr|printcap|printenv|printf|ps|pushd|pv|pwd|quota|quotacheck|quotactl|ram|rar|rcp|read|readarray|readonly|reboot|rename|renice|rev|rm|rmdir|rsync|screen|scp|sdiff|sed|select|seq|service|sftp|shift|shopt|shutdown|sleep|slocate|sort|source|split|ssh|stat|strace|su|sudo|sum|suspend|sync|tail|tar|tee|test|time|timeout|times|touch|top|traceroute|trap|tr|tsort|tty|type|ulimit|umask|umount|unalias|uname|unexpand|uniq|units|unrar|unshar|uptime|useradd|userdel|usermod|users|uuencode|uudecode|v|vdir|vi|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yes|zip)\b/,
    keyword: /\b(?:if|then|else|elif|fi|for|while|in|case|esac|function|select|do|done|until)\b/,
    builtin: /\b(?:break|cd|continue|eval|exec|exit|export|getopts|hash|pwd|readonly|return|shift|test|times|trap|umask|unset)\b/,
    boolean: /\b(?:true|false)\b/,
    file: {
      pattern: /\*|\?/,
      alias: 'punctuation'
    },
    operator: /\d?<>|>\||\+=|==?|!=?=?|=~|<<[<-]?|[&\d]?>>|\d?[<>]&?\d?|&[>&]?|\|[&|]?|<=?|>=?|[!+~-]/,
    punctuation: /\$?\(\(?|\)\)?|\.\.|[{}[\];\\]/,
    number: /(?:\b\d+(?:\.\d+)?(?:[Ee][+-]?\d+)?|\$0x[\dA-Fa-f]+)/
  }
};

// Registrar linguagens básicas no Prism
Object.entries(basicLanguages).forEach(([name, grammar]) => {
  (Prism.languages as any)[name] = grammar;
});

// Adicionar mais linguagens simples
(Prism.languages as any).typescript = {
  ...(Prism.languages as any).javascript,
  keyword: /\b(?:abstract|as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|throws|try|type|typeof|undefined|var|void|while|with|yield)\b/,
  'class-name': /\b[A-Z][\w$]*(?:\<[\w\s,<>]*\>)?\b/
};

(Prism.languages as any).json = {
  property: {
    pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?=\s*:)/,
    lookbehind: true,
    greedy: true
  },
  string: {
    pattern: /(^|[^\\])"(?:\\.|[^\\"\r\n])*"(?!\s*:)/,
    lookbehind: true,
    greedy: true
  },
  comment: {
    pattern: /\/\/.*|\/\*[\s\S]*?(?:\*\/|$)/,
    greedy: true
  },
  number: /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/,
  punctuation: /[{}[\],]/,
  operator: /:/,
  boolean: /\b(?:true|false)\b/,
  'null': {
    pattern: /\bnull\b/,
    alias: 'keyword'
  }
};

(Prism.languages as any).yaml = {
  scalar: {
    pattern: /([\-:]\s*(?:![^\s]+)?[ \t]*[|>])[ \t]*(?:((?:\r?\n|\r)[ \t]+)[^\r\n]+(?:\2[^\r\n]+)*)/,
    lookbehind: true,
    alias: 'string'
  },
  comment: /#.*/,
  key: {
    pattern: /(\s*(?:^|[:\-,[{\r\n?])[ \t]*(?:![^\s]+)?[ \t]*)[^\r\n{[\]},#\s]+?(?=\s*:\s)/,
    lookbehind: true,
    greedy: true,
    alias: 'atrule'
  },
  directive: {
    pattern: /(^[ \t]*)%.+/m,
    lookbehind: true,
    alias: 'important'
  },
  datetime: {
    pattern: /([:\-,[{]\s*(?:![^\s]+)?[ \t]*)(?:\d{4}-\d\d?-\d\d?(?:[tT]|[ \t]+)\d\d?:\d{2}:\d{2}(?:\.\d*)?[ \t]*(?:Z|[-+]\d\d?(?::\d{2})?)?|\d{4}-\d{2}-\d{2}|\d\d?:\d{2}(?::\d{2}(?:\.\d*)?)?)(?=[ \t]*(?:$|,|]|}|(?:[\r\n]\s*)?#))/m,
    lookbehind: true,
    alias: 'number'
  },
  boolean: {
    pattern: /([:\-,[{]\s*(?:![^\s]+)?[ \t]*)(?:true|false)[ \t]*(?=$|,|]|}|(?:[\r\n]\s*)?#)/im,
    lookbehind: true,
    alias: 'important'
  },
  'null': {
    pattern: /([:\-,[{]\s*(?:![^\s]+)?[ \t]*)(?:null|~)[ \t]*(?=$|,|]|}|(?:[\r\n]\s*)?#)/im,
    lookbehind: true,
    alias: 'important'
  },
  string: {
    pattern: /([:\-,[{]\s*(?:![^\s]+)?[ \t]*)("|')(?:(?!\2)[^\\\r\n]|\\.)*\2(?=[ \t]*(?:$|,|]|}|(?:[\r\n]\s*)?#))/m,
    lookbehind: true,
    greedy: true
  },
  number: {
    pattern: /([:\-,[{]\s*(?:![^\s]+)?[ \t]*)[+-]?(?:0x[\da-f]+|0o[0-7]+|(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?|\.inf|\.nan)[ \t]*(?=$|,|]|}|(?:[\r\n]\s*)?#)/im,
    lookbehind: true
  },
  tag: /![^\s]+/,
  important: /[&*][\w]+/,
  punctuation: /---|[:[\]{}\-,|>?]|\.\.\./
};

(Prism.languages as any).markdown = {
  bold: {
    pattern: /(^|[^\\])(\*\*|__)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
    lookbehind: true,
    greedy: true,
    inside: {
      punctuation: /^\*\*|^__|\*\*$|__$/
    }
  },
  italic: {
    pattern: /(^|[^\\])([*_])(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
    lookbehind: true,
    greedy: true,
    inside: {
      punctuation: /^[*_]|[*_]$/
    }
  },
  code: [
    {
      pattern: /(`+)(?:(?!`)[^`\r\n]|`(?!\1))+\1/,
      greedy: true,
      inside: {
        punctuation: /^`+|`+$/
      }
    },
    {
      pattern: /^(?: {4}|\t).+/m,
      alias: 'keyword'
    }
  ],
  url: {
    pattern: /!?\[[^\]]*\]\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)/,
    inside: {
      variable: {
        pattern: /(!?\[)[^\]]+(?=\])/,
        lookbehind: true
      },
      string: {
        pattern: /"(?:\\.|[^"\\])*"(?=\)$)/
      }
    }
  }
};

// Linguagens simples adicionais
(Prism.languages as any).php = {
  comment: [
    {
      pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
      lookbehind: true
    },
    {
      pattern: /(^|[^\\:])\/\/.*/,
      lookbehind: true
    },
    /#.*/
  ],
  string: {
    pattern: /(["'])(?:\\[\s\S]|(?!\1)[^\\])*\1/,
    greedy: true
  },
  keyword: /\b(?:and|or|xor|array|as|break|case|cfunction|class|const|continue|declare|default|die|do|else|elseif|enddeclare|endfor|endforeach|endif|endswitch|endwhile|extends|for|foreach|function|include|include_once|global|if|new|return|static|switch|use|require|require_once|var|while|abstract|interface|public|implements|private|protected|parent|throw|null|echo|print|trait|namespace|final|yield|goto|instanceof|finally|try|catch)\b/,
  function: /\w+(?=\s*\()/,
  number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?/i,
  operator: [
    {
      pattern: /(^|[^-])>>=?|<<=?|^=|~|[+\-*\/%]=?|&&?|\|\|?|\?\?=?|\.=|<[<=]?|>[>=]?|[!=]==?|\^=?/,
      lookbehind: true
    },
    /[&|^~]/
  ],
  punctuation: /[{}[\];(),.:]/
};

(Prism.languages as any).csharp = {
  comment: [
    {
      pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)/,
      lookbehind: true
    },
    {
      pattern: /(^|[^\\:])\/\/.*/,
      lookbehind: true
    }
  ],
  string: {
    pattern: /@?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/,
    greedy: true
  },
  keyword: /\b(?:abstract|as|async|await|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|goto|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|virtual|void|volatile|while)\b/,
  'class-name': /\b[A-Z]\w*\b/,
  function: /\w+(?=\s*\()/,
  number: /\b0x[\da-f]+\b|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?[flmd]?/i,
  operator: /[<>]=?|[!=]=?|--?|\+\+?|&&?|\|\|?|[?*\/~^%]/,
  punctuation: /[{}[\];(),.:]/
};

// Adicionar aliases
(Prism.languages as any).js = (Prism.languages as any).javascript;
(Prism.languages as any).ts = (Prism.languages as any).typescript;
(Prism.languages as any).py = (Prism.languages as any).python;
(Prism.languages as any).htm = (Prism.languages as any).html;
(Prism.languages as any).xml = (Prism.languages as any).html;
(Prism.languages as any).yml = (Prism.languages as any).yaml;
(Prism.languages as any).md = (Prism.languages as any).markdown;
(Prism.languages as any).cs = (Prism.languages as any).csharp;
(Prism.languages as any).sh = (Prism.languages as any).bash;

/**
 * Mapeamento de linguagens para identificação automática
 */
const languageMap: Record<string, string> = {
  // JavaScript e TypeScript
  'js': 'javascript',
  'jsx': 'jsx',
  'ts': 'typescript',
  'tsx': 'tsx',
  'javascript': 'javascript',
  'typescript': 'typescript',
  
  // Web
  'html': 'html',
  'htm': 'html',
  'xml': 'xml',
  'css': 'css',
  'scss': 'scss',
  'sass': 'sass',
  'json': 'json',
  
  // Shell e Scripts
  'bash': 'bash',
  'sh': 'bash',
  'shell': 'bash',
  'powershell': 'powershell',
  'ps1': 'powershell',
  'cmd': 'batch',
  
  // Banco de dados
  'sql': 'sql',
  'mysql': 'sql',
  'postgresql': 'sql',
  'sqlite': 'sql',
  
  // Linguagens de programação
  'python': 'python',
  'py': 'python',
  'java': 'java',
  'c': 'c',
  'cpp': 'cpp',
  'c++': 'cpp',
  'csharp': 'csharp',
  'c#': 'csharp',
  'cs': 'csharp',
  'php': 'php',
  'ruby': 'ruby',
  'rb': 'ruby',
  'go': 'go',
  'rust': 'rust',
  'rs': 'rust',
  'swift': 'swift',
  'kotlin': 'kotlin',
  'kt': 'kotlin',
  
  // Configuração e markup
  'yaml': 'yaml',
  'yml': 'yaml',
  'markdown': 'markdown',
  'md': 'markdown',
  'text': 'text',
  'txt': 'text',
};

/**
 * Palavras-chave para detecção automática de linguagem
 */
const languageKeywords: Record<string, string[]> = {
  javascript: ['function', 'const', 'let', 'var', 'class', 'extends', 'import', 'export', 'async', 'await', 'console.log'],
  typescript: ['interface', 'type', 'enum', 'namespace', 'declare', 'readonly', 'private', 'public', 'protected'],
  python: ['def', 'class', 'import', 'from', 'if __name__', 'print(', 'self', 'lambda', 'with', 'as'],
  java: ['public class', 'private', 'protected', 'static', 'void', 'String', 'System.out', 'import java'],
  csharp: ['using System', 'public class', 'private', 'public', 'static', 'void', 'namespace', 'Console.WriteLine'],
  php: ['<?php', '$_', 'function', 'class', 'public', 'private', 'echo', 'var_dump'],
  html: ['<!DOCTYPE', '<html>', '<head>', '<body>', '<div>', '<span>', '<script>', '<style>'],
  css: ['@media', '@import', '@keyframes', 'display:', 'position:', 'color:', 'background:', 'margin:'],
  sql: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE TABLE', 'ALTER TABLE'],
  bash: ['#!/bin/bash', 'echo', 'cd', 'ls', 'grep', 'awk', 'sed', 'chmod', 'sudo'],
  powershell: ['Get-', 'Set-', 'New-', 'Remove-', '$_', 'ForEach-Object', 'Where-Object', 'Write-Host'],
  json: ['{', '}', '[', ']', '":', 'null', 'true', 'false'],
  yaml: ['---', '- name:', 'hosts:', 'vars:', 'tasks:', '  -'],
};

/**
 * Detecta automaticamente a linguagem de programação do código
 */
export function detectLanguage(code: string): string {
  if (!code || code.trim().length === 0) return 'text';

  const codeText = code.toLowerCase().trim();

  // Detectar por padrões específicos primeiro
  if (codeText.startsWith('<!doctype') || codeText.startsWith('<html')) return 'html';
  if (codeText.startsWith('<?php')) return 'php';
  if (codeText.startsWith('#!/bin/bash') || codeText.startsWith('#!/bin/sh')) return 'bash';
  if (codeText.startsWith('{') || codeText.startsWith('[')) {
    try {
      JSON.parse(code);
      return 'json';
    } catch (e) {
      // Não é JSON válido, continuar com outras detecções
    }
  }

  // Detectar por palavras-chave
  const scores: Record<string, number> = {};
  
  Object.entries(languageKeywords).forEach(([lang, keywords]) => {
    scores[lang] = 0;
    keywords.forEach(keyword => {
      try {
        // Escapar caracteres especiais de RegExp
        const escapedKeyword = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escapedKeyword, 'gi');
        const matches = codeText.match(regex);
        if (matches) {
          scores[lang] += matches.length;
        }
      } catch (error) {
        // Se houver erro na criação da RegExp, ignorar esta palavra-chave
        console.warn(`Erro ao criar RegExp para palavra-chave "${keyword}":`, error);
      }
    });
  });

  // Encontrar a linguagem com maior pontuação
  const bestMatch = Object.entries(scores).reduce((best, [lang, score]) => {
    return score > best.score ? { lang, score } : best;
  }, { lang: 'text', score: 0 });

  return bestMatch.score > 0 ? bestMatch.lang : 'text';
}

/**
 * Normaliza o nome da linguagem para uso com Prism.js
 */
export function normalizeLanguage(language: string): string {
  if (!language) return 'text';
  
  const normalized = language.toLowerCase().trim();
  return languageMap[normalized] || normalized;
}



/**
 * Aplica syntax highlighting ao código usando Prism.js
 */
export function highlightCode(code: string, language?: string): string {
  try {
    // Detectar linguagem se não fornecida
    const detectedLang = language ? normalizeLanguage(language) : detectLanguage(code);
    
    // Verificar se a linguagem é suportada pelo Prism
    if (!Prism.languages[detectedLang]) {
      return escapeHtml(code);
    }

    // Aplicar highlight
    const highlightedCode = Prism.highlight(code, Prism.languages[detectedLang], detectedLang);
    
    return highlightedCode;
  } catch (error) {
    console.error('Erro ao aplicar syntax highlight:', error);
    return escapeHtml(code);
  }
}

/**
 * Escapa HTML para exibição segura
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Processa blocos de código em HTML e aplica syntax highlighting
 */
export function processCodeBlocks(html: string): string {
  return html.replace(
    /<pre><code(?:\s+class=["']language-(\w+)["'])?>(.*?)<\/code><\/pre>/gis,
    (_, language, code) => {
      // Decodificar HTML entities no código
      const decodedCode = code
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      // Aplicar syntax highlighting
      const highlightedCode = highlightCode(decodedCode, language);
      const detectedLang = language || detectLanguage(decodedCode);
      
      return `<pre><code class="language-${detectedLang}" data-lang="${detectedLang}">${highlightedCode}</code></pre>`;
    }
  );
}

/**
 * Lista de linguagens suportadas para seleção manual
 */
export const supportedLanguages = [
  { code: 'text', name: 'Texto Simples' },
  { code: 'javascript', name: 'JavaScript' },
  { code: 'typescript', name: 'TypeScript' },
  { code: 'jsx', name: 'React JSX' },
  { code: 'tsx', name: 'React TSX' },
  { code: 'html', name: 'HTML' },
  { code: 'css', name: 'CSS' },
  { code: 'scss', name: 'SCSS' },
  { code: 'json', name: 'JSON' },
  { code: 'yaml', name: 'YAML' },
  { code: 'markdown', name: 'Markdown' },
  { code: 'bash', name: 'Bash/Shell' },
  { code: 'powershell', name: 'PowerShell' },
  { code: 'sql', name: 'SQL' },
  { code: 'python', name: 'Python' },
  { code: 'java', name: 'Java' },
  { code: 'c', name: 'C' },
  { code: 'cpp', name: 'C++' },
  { code: 'csharp', name: 'C#' },
  { code: 'php', name: 'PHP' },
  { code: 'ruby', name: 'Ruby' },
  { code: 'go', name: 'Go' },
  { code: 'rust', name: 'Rust' },
  { code: 'swift', name: 'Swift' },
  { code: 'kotlin', name: 'Kotlin' },
];