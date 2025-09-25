grammar TeamcenterLog;

@header {
}

logFile
  : (header | systemInfo | logLine | envSection | dllSection | sqlDump | journalSection | pomStats | endSession | truncated | otherLine)* EOF
  ;

// General rules
header
  : '***' .*? NEWLINE '*** system log created by' .*? NEWLINE
  ;

systemInfo
  : 'Node Name' .*? NEWLINE
    'Machine type' .*? NEWLINE
    'OS' .*? NEWLINE
    '# Processors' .*? NEWLINE
    'Memory' .*? NEWLINE
    'Total Swap' .*? NEWLINE
    'Free  Swap' .*? NEWLINE
    'Machine supports' .*? NEWLINE
    'Running' .*? NEWLINE
  ;

logLine
  : LEVEL WS '-' WS TIMESTAMP WS 'UTC' WS '-' WS ID WS '-' WS MESSAGE NEWLINE
  ;

envSection
  : 'TC environment variables:' NEWLINE (envLine)*
  ;

envLine
  : WS* KEY '=' VALUE NEWLINE
  ;

dllSection
  : 'Versions of DLLs are:' NEWLINE '=====================' NEWLINE (dllLine)*
  ;

dllLine
  : WS* PATH WS+ VERSION WS+ ADDR WS+ SIZE WS+ HASH WS+ DATE NEWLINE
  ;

sqlDump
  : 'START SQL_PROFILE_DUMP' NEWLINE sqlHeader NEWLINE (sqlRow)* 'END SQL_PROFILE_DUMP' NEWLINE
  ;

sqlHeader
  : 'Nr Calls Time   DB-Time Exec-Time Trips Rows  SQL Query' NEWLINE '______________________________________________________' NEWLINE
  ;

sqlRow
  : WS* NR WS+ CALLS WS+ TIME WS+ DBTIME WS+ EXECTIME WS+ TRIPS WS+ ROWS WS+ SQL_QUERY (NEWLINE SQL_CONTINUATION)*
  ;

journalSection
  : ('START JOURNALLED_TIMES' | 'START JOURNALLED_TIMES_IN_ALL_FUNCTIONS') NEWLINE (journalLine)* 'END JOURNALLED_TIMES_IN_ALL_FUNCTIONS' NEWLINE 'END JOURNALLED_TIMES' NEWLINE
  ;

journalLine
  : (HIERARCHY_PREFIX WS+ PERC_TOTAL WS+ PERC_PARENT WS+ TIME WS+ DB_TRIPS WS+ CALLS WS+ DEPTH WS+ ROUTINE NEWLINE)
  ;

pomStats
  : 'POM enquiries statistics:' .*? NEWLINE
  ;

endSession
  : '@@@ End of session' .*? NEWLINE
  ;

truncated
  : '(truncated' WS+ DIGIT+ WS+ 'characters)' .*? NEWLINE
  ;

otherLine
  : .*? NEWLINE  // For any unparsed lines
  ;

// Rules lexer
LEVEL: 'INFO' | 'DEBUG' | 'NOTE' | 'WARN' | 'ERROR' | 'FATAL';
TIMESTAMP: DIGIT DIGIT DIGIT DIGIT '/' DIGIT DIGIT '/' DIGIT DIGIT '-' DIGIT DIGIT ':' DIGIT DIGIT ':' DIGIT DIGIT ('.' DIGIT+)?;
ID: 'NoID' | 'NoId' | 'InitializeModule.' [A-Z_0-9]+ | [A-Za-z0-9.]+;
MESSAGE: ~[\r\n]+;  // For new lines

KEY: [A-Za-z0-9_]+;  // For env's, like TC_BIN
VALUE: ~[\r\n]+;     // Values after =

PATH: [A-Za-z] ':' '\\' ~[\r\n]*;
VERSION: [0-9.()a-zA-Z]+;  // Version, like 13.3(20211122.00)
ADDR: [0-9a-f]+;           // Hex address 7ffda3aa0000
SIZE: [0-9a-f]+;           // Size of shift 1cf000
HASH: [0-9a-f-]+ ('-' [0-9a-f-]+)*;
DATE: [0-9]{2} '-' [A-Za-z]{3} '-' [0-9]{4} ' ' [0-9]+ ':' [0-9]+;

NR: DIGIT+;
CALLS: DIGIT+;
TIME: DIGIT+ '.' DIGIT+;
DBTIME: DIGIT+ '.' DIGIT+;
EXECTIME: DIGIT+ '.' DIGIT+;
TRIPS: ('-'? DIGIT+ | '-1');
ROWS: ('-'? DIGIT+ | '-1');
SQL_QUERY: 'SELECT' ~[\r\n]*;  // Start query
SQL_CONTINUATION: WS+ ~[\r\n]+;  // For multiline SQL sentences

HIERARCHY_PREFIX: '@'*;  // @* for hierarchy
PERC_TOTAL: DIGIT+;      // %Total
PERC_PARENT: DIGIT+;     // %Parent
DB_TRIPS: DIGIT+;        // DB Trips
DEPTH: DIGIT+;           // Depth
ROUTINE: ~[\r\n]+;       // Routine name

DIGIT: [0-9];
WS: [ \t]+;
NEWLINE: '\r'? '\n';
