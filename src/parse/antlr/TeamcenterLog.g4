grammar TeamcenterLog;

@header {
  // Для TS: import { ANTLRInputStream, CommonTokenStream } from 'antlr4ts';
}

logFile
  : (header | systemInfo | logLine | envSection | dllSection | sqlDump | journalSection | pomStats | endSession | truncated | otherLine)* EOF
  ;

// Общие правила
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
  : .*? NEWLINE  // Для нераспознанных строк, чтоб не ломать парсинг
  ;

// Лексер rules
LEVEL: 'INFO' | 'DEBUG' | 'NOTE' | 'WARN' | 'ERROR';
TIMESTAMP: DIGIT DIGIT DIGIT DIGIT '/' DIGIT DIGIT '/' DIGIT DIGIT '-' DIGIT DIGIT ':' DIGIT DIGIT ':' DIGIT DIGIT ('.' DIGIT+)?;
ID: 'NoID' | 'NoId' | 'InitializeModule.' [A-Z_0-9]+ | [A-Za-z0-9.]+;  // Расширил для FF22TC133.05784.tcserver00003 и т.п.
MESSAGE: ~[\r\n]+;  // Всё до новой строки

KEY: [A-Za-z0-9_]+;  // Для env vars, типа TC_BIN
VALUE: ~[\r\n]+;     // Значение после =

PATH: [A-Za-z] ':' '\\' ~[\r\n]*;
VERSION: [0-9.()a-zA-Z]+;  // Версии типа 13.3(20211122.00)
ADDR: [0-9a-f]+;           // Адреса типа 7ffda3aa0000
SIZE: [0-9a-f]+;           // Размеры типа 1cf000
HASH: [0-9a-f-]+ ('-' [0-9a-f-]+)*;
DATE: [0-9]{2} '-' [A-Za-z]{3} '-' [0-9]{4} ' ' [0-9]+ ':' [0-9]+;

NR: DIGIT+;
CALLS: DIGIT+;
TIME: DIGIT+ '.' DIGIT+;
DBTIME: DIGIT+ '.' DIGIT+;
EXECTIME: DIGIT+ '.' DIGIT+;
TRIPS: ('-'? DIGIT+ | '-1');
ROWS: ('-'? DIGIT+ | '-1');
SQL_QUERY: 'SELECT' ~[\r\n]*;  // Начало запроса
SQL_CONTINUATION: WS+ ~[\r\n]+;  // Продолжение мультилайн SQL

HIERARCHY_PREFIX: '@'*;  // @* для иерархии
PERC_TOTAL: DIGIT+;      // %Total
PERC_PARENT: DIGIT+;     // %Parent
DB_TRIPS: DIGIT+;        // DB Trips
DEPTH: DIGIT+;           // Depth
ROUTINE: ~[\r\n]+;       // Routine name

DIGIT: [0-9];
WS: [ \t]+;
NEWLINE: '\r'? '\n';
