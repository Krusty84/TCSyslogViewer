// Generated from src/parse/antlr/tcServerSyslogGrammar.g4 by ANTLR 4.13.2
// jshint ignore: start
import antlr4 from 'antlr4';
import tcServerSyslogGrammarListener from './tcServerSyslogGrammarListener.js';
import tcServerSyslogGrammarVisitor from './tcServerSyslogGrammarVisitor.js';



const serializedATN = [4,1,59,411,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,
4,2,5,7,5,2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,
2,13,7,13,2,14,7,14,2,15,7,15,2,16,7,16,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,
1,0,1,0,1,0,5,0,46,8,0,10,0,12,0,49,9,0,1,0,1,0,1,1,1,1,5,1,55,8,1,10,1,
12,1,58,9,1,1,1,1,1,1,1,5,1,63,8,1,10,1,12,1,66,9,1,1,1,1,1,1,2,1,2,5,2,
72,8,2,10,2,12,2,75,9,2,1,2,1,2,1,2,5,2,80,8,2,10,2,12,2,83,9,2,1,2,1,2,
1,2,5,2,88,8,2,10,2,12,2,91,9,2,1,2,1,2,1,2,5,2,96,8,2,10,2,12,2,99,9,2,
1,2,1,2,1,2,5,2,104,8,2,10,2,12,2,107,9,2,1,2,1,2,1,2,5,2,112,8,2,10,2,12,
2,115,9,2,1,2,1,2,1,2,5,2,120,8,2,10,2,12,2,123,9,2,1,2,1,2,1,2,5,2,128,
8,2,10,2,12,2,131,9,2,1,2,1,2,1,2,5,2,136,8,2,10,2,12,2,139,9,2,1,2,1,2,
1,3,1,3,1,3,1,3,1,3,1,3,1,3,1,3,1,3,1,3,1,3,1,3,1,3,1,3,1,3,1,3,1,3,1,4,
1,4,1,4,5,4,163,8,4,10,4,12,4,166,9,4,1,5,5,5,169,8,5,10,5,12,5,172,9,5,
1,5,1,5,1,5,1,5,1,5,1,6,1,6,1,6,1,6,1,6,5,6,184,8,6,10,6,12,6,187,9,6,1,
7,5,7,190,8,7,10,7,12,7,193,9,7,1,7,1,7,4,7,197,8,7,11,7,12,7,198,1,7,1,
7,4,7,203,8,7,11,7,12,7,204,1,7,1,7,4,7,209,8,7,11,7,12,7,210,1,7,1,7,4,
7,215,8,7,11,7,12,7,216,1,7,1,7,4,7,221,8,7,11,7,12,7,222,1,7,1,7,1,7,1,
8,1,8,1,8,1,8,1,8,5,8,233,8,8,10,8,12,8,236,9,8,1,8,1,8,1,8,1,9,1,9,1,9,
1,9,1,9,1,10,5,10,247,8,10,10,10,12,10,250,9,10,1,10,1,10,4,10,254,8,10,
11,10,12,10,255,1,10,1,10,4,10,260,8,10,11,10,12,10,261,1,10,1,10,4,10,266,
8,10,11,10,12,10,267,1,10,1,10,4,10,272,8,10,11,10,12,10,273,1,10,1,10,4,
10,278,8,10,11,10,12,10,279,1,10,1,10,4,10,284,8,10,11,10,12,10,285,1,10,
1,10,4,10,290,8,10,11,10,12,10,291,1,10,1,10,1,10,5,10,297,8,10,10,10,12,
10,300,9,10,1,11,1,11,1,11,5,11,305,8,11,10,11,12,11,308,9,11,1,11,1,11,
1,11,1,11,1,11,1,12,1,12,4,12,317,8,12,11,12,12,12,318,1,12,1,12,4,12,323,
8,12,11,12,12,12,324,1,12,1,12,4,12,329,8,12,11,12,12,12,330,1,12,1,12,4,
12,335,8,12,11,12,12,12,336,1,12,1,12,4,12,341,8,12,11,12,12,12,342,1,12,
1,12,4,12,347,8,12,11,12,12,12,348,1,12,1,12,4,12,353,8,12,11,12,12,12,354,
1,12,1,12,1,12,1,13,1,13,5,13,362,8,13,10,13,12,13,365,9,13,1,13,1,13,1,
14,1,14,5,14,371,8,14,10,14,12,14,374,9,14,1,14,1,14,1,15,1,15,4,15,380,
8,15,11,15,12,15,381,1,15,4,15,385,8,15,11,15,12,15,386,1,15,4,15,390,8,
15,11,15,12,15,391,1,15,1,15,5,15,396,8,15,10,15,12,15,399,9,15,1,15,1,15,
1,16,5,16,404,8,16,10,16,12,16,407,9,16,1,16,1,16,1,16,15,56,64,73,81,89,
97,105,113,121,129,137,363,372,397,405,0,17,0,2,4,6,8,10,12,14,16,18,20,
22,24,26,28,30,32,0,1,1,0,22,23,449,0,47,1,0,0,0,2,52,1,0,0,0,4,69,1,0,0,
0,6,142,1,0,0,0,8,159,1,0,0,0,10,170,1,0,0,0,12,178,1,0,0,0,14,191,1,0,0,
0,16,227,1,0,0,0,18,240,1,0,0,0,20,248,1,0,0,0,22,301,1,0,0,0,24,314,1,0,
0,0,26,359,1,0,0,0,28,368,1,0,0,0,30,377,1,0,0,0,32,405,1,0,0,0,34,46,3,
2,1,0,35,46,3,4,2,0,36,46,3,6,3,0,37,46,3,8,4,0,38,46,3,12,6,0,39,46,3,16,
8,0,40,46,3,22,11,0,41,46,3,26,13,0,42,46,3,28,14,0,43,46,3,30,15,0,44,46,
3,32,16,0,45,34,1,0,0,0,45,35,1,0,0,0,45,36,1,0,0,0,45,37,1,0,0,0,45,38,
1,0,0,0,45,39,1,0,0,0,45,40,1,0,0,0,45,41,1,0,0,0,45,42,1,0,0,0,45,43,1,
0,0,0,45,44,1,0,0,0,46,49,1,0,0,0,47,45,1,0,0,0,47,48,1,0,0,0,48,50,1,0,
0,0,49,47,1,0,0,0,50,51,5,0,0,1,51,1,1,0,0,0,52,56,5,1,0,0,53,55,9,0,0,0,
54,53,1,0,0,0,55,58,1,0,0,0,56,57,1,0,0,0,56,54,1,0,0,0,57,59,1,0,0,0,58,
56,1,0,0,0,59,60,5,59,0,0,60,64,5,2,0,0,61,63,9,0,0,0,62,61,1,0,0,0,63,66,
1,0,0,0,64,65,1,0,0,0,64,62,1,0,0,0,65,67,1,0,0,0,66,64,1,0,0,0,67,68,5,
59,0,0,68,3,1,0,0,0,69,73,5,3,0,0,70,72,9,0,0,0,71,70,1,0,0,0,72,75,1,0,
0,0,73,74,1,0,0,0,73,71,1,0,0,0,74,76,1,0,0,0,75,73,1,0,0,0,76,77,5,59,0,
0,77,81,5,4,0,0,78,80,9,0,0,0,79,78,1,0,0,0,80,83,1,0,0,0,81,82,1,0,0,0,
81,79,1,0,0,0,82,84,1,0,0,0,83,81,1,0,0,0,84,85,5,59,0,0,85,89,5,5,0,0,86,
88,9,0,0,0,87,86,1,0,0,0,88,91,1,0,0,0,89,90,1,0,0,0,89,87,1,0,0,0,90,92,
1,0,0,0,91,89,1,0,0,0,92,93,5,59,0,0,93,97,5,6,0,0,94,96,9,0,0,0,95,94,1,
0,0,0,96,99,1,0,0,0,97,98,1,0,0,0,97,95,1,0,0,0,98,100,1,0,0,0,99,97,1,0,
0,0,100,101,5,59,0,0,101,105,5,7,0,0,102,104,9,0,0,0,103,102,1,0,0,0,104,
107,1,0,0,0,105,106,1,0,0,0,105,103,1,0,0,0,106,108,1,0,0,0,107,105,1,0,
0,0,108,109,5,59,0,0,109,113,5,8,0,0,110,112,9,0,0,0,111,110,1,0,0,0,112,
115,1,0,0,0,113,114,1,0,0,0,113,111,1,0,0,0,114,116,1,0,0,0,115,113,1,0,
0,0,116,117,5,59,0,0,117,121,5,9,0,0,118,120,9,0,0,0,119,118,1,0,0,0,120,
123,1,0,0,0,121,122,1,0,0,0,121,119,1,0,0,0,122,124,1,0,0,0,123,121,1,0,
0,0,124,125,5,59,0,0,125,129,5,10,0,0,126,128,9,0,0,0,127,126,1,0,0,0,128,
131,1,0,0,0,129,130,1,0,0,0,129,127,1,0,0,0,130,132,1,0,0,0,131,129,1,0,
0,0,132,133,5,59,0,0,133,137,5,11,0,0,134,136,9,0,0,0,135,134,1,0,0,0,136,
139,1,0,0,0,137,138,1,0,0,0,137,135,1,0,0,0,138,140,1,0,0,0,139,137,1,0,
0,0,140,141,5,59,0,0,141,5,1,0,0,0,142,143,5,30,0,0,143,144,5,58,0,0,144,
145,5,12,0,0,145,146,5,58,0,0,146,147,5,31,0,0,147,148,5,58,0,0,148,149,
5,13,0,0,149,150,5,58,0,0,150,151,5,12,0,0,151,152,5,58,0,0,152,153,5,32,
0,0,153,154,5,58,0,0,154,155,5,12,0,0,155,156,5,58,0,0,156,157,5,33,0,0,
157,158,5,59,0,0,158,7,1,0,0,0,159,160,5,14,0,0,160,164,5,59,0,0,161,163,
3,10,5,0,162,161,1,0,0,0,163,166,1,0,0,0,164,162,1,0,0,0,164,165,1,0,0,0,
165,9,1,0,0,0,166,164,1,0,0,0,167,169,5,58,0,0,168,167,1,0,0,0,169,172,1,
0,0,0,170,168,1,0,0,0,170,171,1,0,0,0,171,173,1,0,0,0,172,170,1,0,0,0,173,
174,5,34,0,0,174,175,5,15,0,0,175,176,5,35,0,0,176,177,5,59,0,0,177,11,1,
0,0,0,178,179,5,16,0,0,179,180,5,59,0,0,180,181,5,17,0,0,181,185,5,59,0,
0,182,184,3,14,7,0,183,182,1,0,0,0,184,187,1,0,0,0,185,183,1,0,0,0,185,186,
1,0,0,0,186,13,1,0,0,0,187,185,1,0,0,0,188,190,5,58,0,0,189,188,1,0,0,0,
190,193,1,0,0,0,191,189,1,0,0,0,191,192,1,0,0,0,192,194,1,0,0,0,193,191,
1,0,0,0,194,196,5,36,0,0,195,197,5,58,0,0,196,195,1,0,0,0,197,198,1,0,0,
0,198,196,1,0,0,0,198,199,1,0,0,0,199,200,1,0,0,0,200,202,5,37,0,0,201,203,
5,58,0,0,202,201,1,0,0,0,203,204,1,0,0,0,204,202,1,0,0,0,204,205,1,0,0,0,
205,206,1,0,0,0,206,208,5,38,0,0,207,209,5,58,0,0,208,207,1,0,0,0,209,210,
1,0,0,0,210,208,1,0,0,0,210,211,1,0,0,0,211,212,1,0,0,0,212,214,5,39,0,0,
213,215,5,58,0,0,214,213,1,0,0,0,215,216,1,0,0,0,216,214,1,0,0,0,216,217,
1,0,0,0,217,218,1,0,0,0,218,220,5,40,0,0,219,221,5,58,0,0,220,219,1,0,0,
0,221,222,1,0,0,0,222,220,1,0,0,0,222,223,1,0,0,0,223,224,1,0,0,0,224,225,
5,41,0,0,225,226,5,59,0,0,226,15,1,0,0,0,227,228,5,18,0,0,228,229,5,59,0,
0,229,230,3,18,9,0,230,234,5,59,0,0,231,233,3,20,10,0,232,231,1,0,0,0,233,
236,1,0,0,0,234,232,1,0,0,0,234,235,1,0,0,0,235,237,1,0,0,0,236,234,1,0,
0,0,237,238,5,19,0,0,238,239,5,59,0,0,239,17,1,0,0,0,240,241,5,20,0,0,241,
242,5,59,0,0,242,243,5,21,0,0,243,244,5,59,0,0,244,19,1,0,0,0,245,247,5,
58,0,0,246,245,1,0,0,0,247,250,1,0,0,0,248,246,1,0,0,0,248,249,1,0,0,0,249,
251,1,0,0,0,250,248,1,0,0,0,251,253,5,42,0,0,252,254,5,58,0,0,253,252,1,
0,0,0,254,255,1,0,0,0,255,253,1,0,0,0,255,256,1,0,0,0,256,257,1,0,0,0,257,
259,5,43,0,0,258,260,5,58,0,0,259,258,1,0,0,0,260,261,1,0,0,0,261,259,1,
0,0,0,261,262,1,0,0,0,262,263,1,0,0,0,263,265,5,44,0,0,264,266,5,58,0,0,
265,264,1,0,0,0,266,267,1,0,0,0,267,265,1,0,0,0,267,268,1,0,0,0,268,269,
1,0,0,0,269,271,5,45,0,0,270,272,5,58,0,0,271,270,1,0,0,0,272,273,1,0,0,
0,273,271,1,0,0,0,273,274,1,0,0,0,274,275,1,0,0,0,275,277,5,46,0,0,276,278,
5,58,0,0,277,276,1,0,0,0,278,279,1,0,0,0,279,277,1,0,0,0,279,280,1,0,0,0,
280,281,1,0,0,0,281,283,5,47,0,0,282,284,5,58,0,0,283,282,1,0,0,0,284,285,
1,0,0,0,285,283,1,0,0,0,285,286,1,0,0,0,286,287,1,0,0,0,287,289,5,48,0,0,
288,290,5,58,0,0,289,288,1,0,0,0,290,291,1,0,0,0,291,289,1,0,0,0,291,292,
1,0,0,0,292,293,1,0,0,0,293,298,5,49,0,0,294,295,5,59,0,0,295,297,5,50,0,
0,296,294,1,0,0,0,297,300,1,0,0,0,298,296,1,0,0,0,298,299,1,0,0,0,299,21,
1,0,0,0,300,298,1,0,0,0,301,302,7,0,0,0,302,306,5,59,0,0,303,305,3,24,12,
0,304,303,1,0,0,0,305,308,1,0,0,0,306,304,1,0,0,0,306,307,1,0,0,0,307,309,
1,0,0,0,308,306,1,0,0,0,309,310,5,24,0,0,310,311,5,59,0,0,311,312,5,25,0,
0,312,313,5,59,0,0,313,23,1,0,0,0,314,316,5,51,0,0,315,317,5,58,0,0,316,
315,1,0,0,0,317,318,1,0,0,0,318,316,1,0,0,0,318,319,1,0,0,0,319,320,1,0,
0,0,320,322,5,52,0,0,321,323,5,58,0,0,322,321,1,0,0,0,323,324,1,0,0,0,324,
322,1,0,0,0,324,325,1,0,0,0,325,326,1,0,0,0,326,328,5,53,0,0,327,329,5,58,
0,0,328,327,1,0,0,0,329,330,1,0,0,0,330,328,1,0,0,0,330,331,1,0,0,0,331,
332,1,0,0,0,332,334,5,44,0,0,333,335,5,58,0,0,334,333,1,0,0,0,335,336,1,
0,0,0,336,334,1,0,0,0,336,337,1,0,0,0,337,338,1,0,0,0,338,340,5,54,0,0,339,
341,5,58,0,0,340,339,1,0,0,0,341,342,1,0,0,0,342,340,1,0,0,0,342,343,1,0,
0,0,343,344,1,0,0,0,344,346,5,43,0,0,345,347,5,58,0,0,346,345,1,0,0,0,347,
348,1,0,0,0,348,346,1,0,0,0,348,349,1,0,0,0,349,350,1,0,0,0,350,352,5,55,
0,0,351,353,5,58,0,0,352,351,1,0,0,0,353,354,1,0,0,0,354,352,1,0,0,0,354,
355,1,0,0,0,355,356,1,0,0,0,356,357,5,56,0,0,357,358,5,59,0,0,358,25,1,0,
0,0,359,363,5,26,0,0,360,362,9,0,0,0,361,360,1,0,0,0,362,365,1,0,0,0,363,
364,1,0,0,0,363,361,1,0,0,0,364,366,1,0,0,0,365,363,1,0,0,0,366,367,5,59,
0,0,367,27,1,0,0,0,368,372,5,27,0,0,369,371,9,0,0,0,370,369,1,0,0,0,371,
374,1,0,0,0,372,373,1,0,0,0,372,370,1,0,0,0,373,375,1,0,0,0,374,372,1,0,
0,0,375,376,5,59,0,0,376,29,1,0,0,0,377,379,5,28,0,0,378,380,5,58,0,0,379,
378,1,0,0,0,380,381,1,0,0,0,381,379,1,0,0,0,381,382,1,0,0,0,382,384,1,0,
0,0,383,385,5,57,0,0,384,383,1,0,0,0,385,386,1,0,0,0,386,384,1,0,0,0,386,
387,1,0,0,0,387,389,1,0,0,0,388,390,5,58,0,0,389,388,1,0,0,0,390,391,1,0,
0,0,391,389,1,0,0,0,391,392,1,0,0,0,392,393,1,0,0,0,393,397,5,29,0,0,394,
396,9,0,0,0,395,394,1,0,0,0,396,399,1,0,0,0,397,398,1,0,0,0,397,395,1,0,
0,0,398,400,1,0,0,0,399,397,1,0,0,0,400,401,5,59,0,0,401,31,1,0,0,0,402,
404,9,0,0,0,403,402,1,0,0,0,404,407,1,0,0,0,405,406,1,0,0,0,405,403,1,0,
0,0,406,408,1,0,0,0,407,405,1,0,0,0,408,409,5,59,0,0,409,33,1,0,0,0,47,45,
47,56,64,73,81,89,97,105,113,121,129,137,164,170,185,191,198,204,210,216,
222,234,248,255,261,267,273,279,285,291,298,306,318,324,330,336,342,348,
354,363,372,381,386,391,397,405];


const atn = new antlr4.atn.ATNDeserializer().deserialize(serializedATN);

const decisionsToDFA = atn.decisionToState.map( (ds, index) => new antlr4.dfa.DFA(ds, index) );

const sharedContextCache = new antlr4.atn.PredictionContextCache();

export default class tcServerSyslogGrammarParser extends antlr4.Parser {

    static grammarFileName = "tcServerSyslogGrammar.g4";
    static literalNames = [ null, "'***'", "'*** system log created by'", 
                            "'Node Name'", "'Machine type'", "'OS'", "'# Processors'", 
                            "'Memory'", "'Total Swap'", "'Free  Swap'", 
                            "'Machine supports'", "'Running'", "'-'", "'UTC'", 
                            "'TC environment variables:'", "'='", "'Versions of DLLs are:'", 
                            "'====================='", "'START SQL_PROFILE_DUMP'", 
                            "'END SQL_PROFILE_DUMP'", "'Nr Calls Time   DB-Time Exec-Time Trips Rows  SQL Query'", 
                            "'______________________________________________________'", 
                            "'START JOURNALLED_TIMES'", "'START JOURNALLED_TIMES_IN_ALL_FUNCTIONS'", 
                            "'END JOURNALLED_TIMES_IN_ALL_FUNCTIONS'", "'END JOURNALLED_TIMES'", 
                            "'POM enquiries statistics:'", "'@@@ End of session'", 
                            "'(truncated'", "'characters)'" ];
    static symbolicNames = [ null, null, null, null, null, null, null, null, 
                             null, null, null, null, null, null, null, null, 
                             null, null, null, null, null, null, null, null, 
                             null, null, null, null, null, null, "LEVEL", 
                             "TIMESTAMP", "ID", "MESSAGE", "KEY", "VALUE", 
                             "PATH", "VERSION", "ADDR", "SIZE", "HASH", 
                             "DATE", "NR", "CALLS", "TIME", "DBTIME", "EXECTIME", 
                             "TRIPS", "ROWS", "SQL_QUERY", "SQL_CONTINUATION", 
                             "HIERARCHY_PREFIX", "PERC_TOTAL", "PERC_PARENT", 
                             "DB_TRIPS", "DEPTH", "ROUTINE", "DIGIT", "WS", 
                             "NEWLINE" ];
    static ruleNames = [ "logFile", "header", "systemInfo", "logLine", "envSection", 
                         "envLine", "dllSection", "dllLine", "sqlDump", 
                         "sqlHeader", "sqlRow", "journalSection", "journalLine", 
                         "pomStats", "endSession", "truncated", "otherLine" ];

    constructor(input) {
        super(input);
        this._interp = new antlr4.atn.ParserATNSimulator(this, atn, decisionsToDFA, sharedContextCache);
        this.ruleNames = tcServerSyslogGrammarParser.ruleNames;
        this.literalNames = tcServerSyslogGrammarParser.literalNames;
        this.symbolicNames = tcServerSyslogGrammarParser.symbolicNames;
    }



	logFile() {
	    let localctx = new LogFileContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 0, tcServerSyslogGrammarParser.RULE_logFile);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 47;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while((((_la) & ~0x1f) === 0 && ((1 << _la) & 4294967294) !== 0) || ((((_la - 32)) & ~0x1f) === 0 && ((1 << (_la - 32)) & 268435455) !== 0)) {
	            this.state = 45;
	            this._errHandler.sync(this);
	            var la_ = this._interp.adaptivePredict(this._input,0,this._ctx);
	            switch(la_) {
	            case 1:
	                this.state = 34;
	                this.header();
	                break;

	            case 2:
	                this.state = 35;
	                this.systemInfo();
	                break;

	            case 3:
	                this.state = 36;
	                this.logLine();
	                break;

	            case 4:
	                this.state = 37;
	                this.envSection();
	                break;

	            case 5:
	                this.state = 38;
	                this.dllSection();
	                break;

	            case 6:
	                this.state = 39;
	                this.sqlDump();
	                break;

	            case 7:
	                this.state = 40;
	                this.journalSection();
	                break;

	            case 8:
	                this.state = 41;
	                this.pomStats();
	                break;

	            case 9:
	                this.state = 42;
	                this.endSession();
	                break;

	            case 10:
	                this.state = 43;
	                this.truncated();
	                break;

	            case 11:
	                this.state = 44;
	                this.otherLine();
	                break;

	            }
	            this.state = 49;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        }
	        this.state = 50;
	        this.match(tcServerSyslogGrammarParser.EOF);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	header() {
	    let localctx = new HeaderContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 2, tcServerSyslogGrammarParser.RULE_header);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 52;
	        this.match(tcServerSyslogGrammarParser.T__0);
	        this.state = 56;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input,2,this._ctx)
	        while(_alt!=1 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if(_alt===1+1) {
	                this.state = 53;
	                this.matchWildcard(); 
	            }
	            this.state = 58;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input,2,this._ctx);
	        }

	        this.state = 59;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	        this.state = 60;
	        this.match(tcServerSyslogGrammarParser.T__1);
	        this.state = 64;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input,3,this._ctx)
	        while(_alt!=1 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if(_alt===1+1) {
	                this.state = 61;
	                this.matchWildcard(); 
	            }
	            this.state = 66;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input,3,this._ctx);
	        }

	        this.state = 67;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	systemInfo() {
	    let localctx = new SystemInfoContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 4, tcServerSyslogGrammarParser.RULE_systemInfo);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 69;
	        this.match(tcServerSyslogGrammarParser.T__2);
	        this.state = 73;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input,4,this._ctx)
	        while(_alt!=1 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if(_alt===1+1) {
	                this.state = 70;
	                this.matchWildcard(); 
	            }
	            this.state = 75;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input,4,this._ctx);
	        }

	        this.state = 76;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	        this.state = 77;
	        this.match(tcServerSyslogGrammarParser.T__3);
	        this.state = 81;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input,5,this._ctx)
	        while(_alt!=1 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if(_alt===1+1) {
	                this.state = 78;
	                this.matchWildcard(); 
	            }
	            this.state = 83;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input,5,this._ctx);
	        }

	        this.state = 84;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	        this.state = 85;
	        this.match(tcServerSyslogGrammarParser.T__4);
	        this.state = 89;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input,6,this._ctx)
	        while(_alt!=1 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if(_alt===1+1) {
	                this.state = 86;
	                this.matchWildcard(); 
	            }
	            this.state = 91;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input,6,this._ctx);
	        }

	        this.state = 92;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	        this.state = 93;
	        this.match(tcServerSyslogGrammarParser.T__5);
	        this.state = 97;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input,7,this._ctx)
	        while(_alt!=1 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if(_alt===1+1) {
	                this.state = 94;
	                this.matchWildcard(); 
	            }
	            this.state = 99;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input,7,this._ctx);
	        }

	        this.state = 100;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	        this.state = 101;
	        this.match(tcServerSyslogGrammarParser.T__6);
	        this.state = 105;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input,8,this._ctx)
	        while(_alt!=1 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if(_alt===1+1) {
	                this.state = 102;
	                this.matchWildcard(); 
	            }
	            this.state = 107;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input,8,this._ctx);
	        }

	        this.state = 108;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	        this.state = 109;
	        this.match(tcServerSyslogGrammarParser.T__7);
	        this.state = 113;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input,9,this._ctx)
	        while(_alt!=1 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if(_alt===1+1) {
	                this.state = 110;
	                this.matchWildcard(); 
	            }
	            this.state = 115;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input,9,this._ctx);
	        }

	        this.state = 116;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	        this.state = 117;
	        this.match(tcServerSyslogGrammarParser.T__8);
	        this.state = 121;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input,10,this._ctx)
	        while(_alt!=1 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if(_alt===1+1) {
	                this.state = 118;
	                this.matchWildcard(); 
	            }
	            this.state = 123;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input,10,this._ctx);
	        }

	        this.state = 124;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	        this.state = 125;
	        this.match(tcServerSyslogGrammarParser.T__9);
	        this.state = 129;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input,11,this._ctx)
	        while(_alt!=1 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if(_alt===1+1) {
	                this.state = 126;
	                this.matchWildcard(); 
	            }
	            this.state = 131;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input,11,this._ctx);
	        }

	        this.state = 132;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	        this.state = 133;
	        this.match(tcServerSyslogGrammarParser.T__10);
	        this.state = 137;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input,12,this._ctx)
	        while(_alt!=1 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if(_alt===1+1) {
	                this.state = 134;
	                this.matchWildcard(); 
	            }
	            this.state = 139;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input,12,this._ctx);
	        }

	        this.state = 140;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	logLine() {
	    let localctx = new LogLineContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 6, tcServerSyslogGrammarParser.RULE_logLine);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 142;
	        this.match(tcServerSyslogGrammarParser.LEVEL);
	        this.state = 143;
	        this.match(tcServerSyslogGrammarParser.WS);
	        this.state = 144;
	        this.match(tcServerSyslogGrammarParser.T__11);
	        this.state = 145;
	        this.match(tcServerSyslogGrammarParser.WS);
	        this.state = 146;
	        this.match(tcServerSyslogGrammarParser.TIMESTAMP);
	        this.state = 147;
	        this.match(tcServerSyslogGrammarParser.WS);
	        this.state = 148;
	        this.match(tcServerSyslogGrammarParser.T__12);
	        this.state = 149;
	        this.match(tcServerSyslogGrammarParser.WS);
	        this.state = 150;
	        this.match(tcServerSyslogGrammarParser.T__11);
	        this.state = 151;
	        this.match(tcServerSyslogGrammarParser.WS);
	        this.state = 152;
	        this.match(tcServerSyslogGrammarParser.ID);
	        this.state = 153;
	        this.match(tcServerSyslogGrammarParser.WS);
	        this.state = 154;
	        this.match(tcServerSyslogGrammarParser.T__11);
	        this.state = 155;
	        this.match(tcServerSyslogGrammarParser.WS);
	        this.state = 156;
	        this.match(tcServerSyslogGrammarParser.MESSAGE);
	        this.state = 157;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	envSection() {
	    let localctx = new EnvSectionContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 8, tcServerSyslogGrammarParser.RULE_envSection);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 159;
	        this.match(tcServerSyslogGrammarParser.T__13);
	        this.state = 160;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	        this.state = 164;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input,13,this._ctx)
	        while(_alt!=2 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if(_alt===1) {
	                this.state = 161;
	                this.envLine(); 
	            }
	            this.state = 166;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input,13,this._ctx);
	        }

	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	envLine() {
	    let localctx = new EnvLineContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 10, tcServerSyslogGrammarParser.RULE_envLine);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 170;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while(_la===58) {
	            this.state = 167;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 172;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        }
	        this.state = 173;
	        this.match(tcServerSyslogGrammarParser.KEY);
	        this.state = 174;
	        this.match(tcServerSyslogGrammarParser.T__14);
	        this.state = 175;
	        this.match(tcServerSyslogGrammarParser.VALUE);
	        this.state = 176;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	dllSection() {
	    let localctx = new DllSectionContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 12, tcServerSyslogGrammarParser.RULE_dllSection);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 178;
	        this.match(tcServerSyslogGrammarParser.T__15);
	        this.state = 179;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	        this.state = 180;
	        this.match(tcServerSyslogGrammarParser.T__16);
	        this.state = 181;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	        this.state = 185;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input,15,this._ctx)
	        while(_alt!=2 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if(_alt===1) {
	                this.state = 182;
	                this.dllLine(); 
	            }
	            this.state = 187;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input,15,this._ctx);
	        }

	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	dllLine() {
	    let localctx = new DllLineContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 14, tcServerSyslogGrammarParser.RULE_dllLine);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 191;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while(_la===58) {
	            this.state = 188;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 193;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        }
	        this.state = 194;
	        this.match(tcServerSyslogGrammarParser.PATH);
	        this.state = 196; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 195;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 198; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 200;
	        this.match(tcServerSyslogGrammarParser.VERSION);
	        this.state = 202; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 201;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 204; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 206;
	        this.match(tcServerSyslogGrammarParser.ADDR);
	        this.state = 208; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 207;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 210; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 212;
	        this.match(tcServerSyslogGrammarParser.SIZE);
	        this.state = 214; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 213;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 216; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 218;
	        this.match(tcServerSyslogGrammarParser.HASH);
	        this.state = 220; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 219;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 222; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 224;
	        this.match(tcServerSyslogGrammarParser.DATE);
	        this.state = 225;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	sqlDump() {
	    let localctx = new SqlDumpContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 16, tcServerSyslogGrammarParser.RULE_sqlDump);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 227;
	        this.match(tcServerSyslogGrammarParser.T__17);
	        this.state = 228;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	        this.state = 229;
	        this.sqlHeader();
	        this.state = 230;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	        this.state = 234;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while(_la===42 || _la===58) {
	            this.state = 231;
	            this.sqlRow();
	            this.state = 236;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        }
	        this.state = 237;
	        this.match(tcServerSyslogGrammarParser.T__18);
	        this.state = 238;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	sqlHeader() {
	    let localctx = new SqlHeaderContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 18, tcServerSyslogGrammarParser.RULE_sqlHeader);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 240;
	        this.match(tcServerSyslogGrammarParser.T__19);
	        this.state = 241;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	        this.state = 242;
	        this.match(tcServerSyslogGrammarParser.T__20);
	        this.state = 243;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	sqlRow() {
	    let localctx = new SqlRowContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 20, tcServerSyslogGrammarParser.RULE_sqlRow);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 248;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while(_la===58) {
	            this.state = 245;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 250;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        }
	        this.state = 251;
	        this.match(tcServerSyslogGrammarParser.NR);
	        this.state = 253; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 252;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 255; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 257;
	        this.match(tcServerSyslogGrammarParser.CALLS);
	        this.state = 259; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 258;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 261; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 263;
	        this.match(tcServerSyslogGrammarParser.TIME);
	        this.state = 265; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 264;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 267; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 269;
	        this.match(tcServerSyslogGrammarParser.DBTIME);
	        this.state = 271; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 270;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 273; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 275;
	        this.match(tcServerSyslogGrammarParser.EXECTIME);
	        this.state = 277; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 276;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 279; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 281;
	        this.match(tcServerSyslogGrammarParser.TRIPS);
	        this.state = 283; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 282;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 285; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 287;
	        this.match(tcServerSyslogGrammarParser.ROWS);
	        this.state = 289; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 288;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 291; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 293;
	        this.match(tcServerSyslogGrammarParser.SQL_QUERY);
	        this.state = 298;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while(_la===59) {
	            this.state = 294;
	            this.match(tcServerSyslogGrammarParser.NEWLINE);
	            this.state = 295;
	            this.match(tcServerSyslogGrammarParser.SQL_CONTINUATION);
	            this.state = 300;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        }
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	journalSection() {
	    let localctx = new JournalSectionContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 22, tcServerSyslogGrammarParser.RULE_journalSection);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 301;
	        _la = this._input.LA(1);
	        if(!(_la===22 || _la===23)) {
	        this._errHandler.recoverInline(this);
	        }
	        else {
	        	this._errHandler.reportMatch(this);
	            this.consume();
	        }
	        this.state = 302;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	        this.state = 306;
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        while(_la===51) {
	            this.state = 303;
	            this.journalLine();
	            this.state = 308;
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        }
	        this.state = 309;
	        this.match(tcServerSyslogGrammarParser.T__23);
	        this.state = 310;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	        this.state = 311;
	        this.match(tcServerSyslogGrammarParser.T__24);
	        this.state = 312;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	journalLine() {
	    let localctx = new JournalLineContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 24, tcServerSyslogGrammarParser.RULE_journalLine);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 314;
	        this.match(tcServerSyslogGrammarParser.HIERARCHY_PREFIX);
	        this.state = 316; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 315;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 318; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 320;
	        this.match(tcServerSyslogGrammarParser.PERC_TOTAL);
	        this.state = 322; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 321;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 324; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 326;
	        this.match(tcServerSyslogGrammarParser.PERC_PARENT);
	        this.state = 328; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 327;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 330; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 332;
	        this.match(tcServerSyslogGrammarParser.TIME);
	        this.state = 334; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 333;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 336; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 338;
	        this.match(tcServerSyslogGrammarParser.DB_TRIPS);
	        this.state = 340; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 339;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 342; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 344;
	        this.match(tcServerSyslogGrammarParser.CALLS);
	        this.state = 346; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 345;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 348; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 350;
	        this.match(tcServerSyslogGrammarParser.DEPTH);
	        this.state = 352; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 351;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 354; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 356;
	        this.match(tcServerSyslogGrammarParser.ROUTINE);
	        this.state = 357;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	pomStats() {
	    let localctx = new PomStatsContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 26, tcServerSyslogGrammarParser.RULE_pomStats);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 359;
	        this.match(tcServerSyslogGrammarParser.T__25);
	        this.state = 363;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input,40,this._ctx)
	        while(_alt!=1 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if(_alt===1+1) {
	                this.state = 360;
	                this.matchWildcard(); 
	            }
	            this.state = 365;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input,40,this._ctx);
	        }

	        this.state = 366;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	endSession() {
	    let localctx = new EndSessionContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 28, tcServerSyslogGrammarParser.RULE_endSession);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 368;
	        this.match(tcServerSyslogGrammarParser.T__26);
	        this.state = 372;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input,41,this._ctx)
	        while(_alt!=1 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if(_alt===1+1) {
	                this.state = 369;
	                this.matchWildcard(); 
	            }
	            this.state = 374;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input,41,this._ctx);
	        }

	        this.state = 375;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	truncated() {
	    let localctx = new TruncatedContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 30, tcServerSyslogGrammarParser.RULE_truncated);
	    var _la = 0;
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 377;
	        this.match(tcServerSyslogGrammarParser.T__27);
	        this.state = 379; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 378;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 381; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 384; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 383;
	            this.match(tcServerSyslogGrammarParser.DIGIT);
	            this.state = 386; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===57);
	        this.state = 389; 
	        this._errHandler.sync(this);
	        _la = this._input.LA(1);
	        do {
	            this.state = 388;
	            this.match(tcServerSyslogGrammarParser.WS);
	            this.state = 391; 
	            this._errHandler.sync(this);
	            _la = this._input.LA(1);
	        } while(_la===58);
	        this.state = 393;
	        this.match(tcServerSyslogGrammarParser.T__28);
	        this.state = 397;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input,45,this._ctx)
	        while(_alt!=1 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if(_alt===1+1) {
	                this.state = 394;
	                this.matchWildcard(); 
	            }
	            this.state = 399;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input,45,this._ctx);
	        }

	        this.state = 400;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}



	otherLine() {
	    let localctx = new OtherLineContext(this, this._ctx, this.state);
	    this.enterRule(localctx, 32, tcServerSyslogGrammarParser.RULE_otherLine);
	    try {
	        this.enterOuterAlt(localctx, 1);
	        this.state = 405;
	        this._errHandler.sync(this);
	        var _alt = this._interp.adaptivePredict(this._input,46,this._ctx)
	        while(_alt!=1 && _alt!=antlr4.atn.ATN.INVALID_ALT_NUMBER) {
	            if(_alt===1+1) {
	                this.state = 402;
	                this.matchWildcard(); 
	            }
	            this.state = 407;
	            this._errHandler.sync(this);
	            _alt = this._interp.adaptivePredict(this._input,46,this._ctx);
	        }

	        this.state = 408;
	        this.match(tcServerSyslogGrammarParser.NEWLINE);
	    } catch (re) {
	    	if(re instanceof antlr4.error.RecognitionException) {
		        localctx.exception = re;
		        this._errHandler.reportError(this, re);
		        this._errHandler.recover(this, re);
		    } else {
		    	throw re;
		    }
	    } finally {
	        this.exitRule();
	    }
	    return localctx;
	}


}

tcServerSyslogGrammarParser.EOF = antlr4.Token.EOF;
tcServerSyslogGrammarParser.T__0 = 1;
tcServerSyslogGrammarParser.T__1 = 2;
tcServerSyslogGrammarParser.T__2 = 3;
tcServerSyslogGrammarParser.T__3 = 4;
tcServerSyslogGrammarParser.T__4 = 5;
tcServerSyslogGrammarParser.T__5 = 6;
tcServerSyslogGrammarParser.T__6 = 7;
tcServerSyslogGrammarParser.T__7 = 8;
tcServerSyslogGrammarParser.T__8 = 9;
tcServerSyslogGrammarParser.T__9 = 10;
tcServerSyslogGrammarParser.T__10 = 11;
tcServerSyslogGrammarParser.T__11 = 12;
tcServerSyslogGrammarParser.T__12 = 13;
tcServerSyslogGrammarParser.T__13 = 14;
tcServerSyslogGrammarParser.T__14 = 15;
tcServerSyslogGrammarParser.T__15 = 16;
tcServerSyslogGrammarParser.T__16 = 17;
tcServerSyslogGrammarParser.T__17 = 18;
tcServerSyslogGrammarParser.T__18 = 19;
tcServerSyslogGrammarParser.T__19 = 20;
tcServerSyslogGrammarParser.T__20 = 21;
tcServerSyslogGrammarParser.T__21 = 22;
tcServerSyslogGrammarParser.T__22 = 23;
tcServerSyslogGrammarParser.T__23 = 24;
tcServerSyslogGrammarParser.T__24 = 25;
tcServerSyslogGrammarParser.T__25 = 26;
tcServerSyslogGrammarParser.T__26 = 27;
tcServerSyslogGrammarParser.T__27 = 28;
tcServerSyslogGrammarParser.T__28 = 29;
tcServerSyslogGrammarParser.LEVEL = 30;
tcServerSyslogGrammarParser.TIMESTAMP = 31;
tcServerSyslogGrammarParser.ID = 32;
tcServerSyslogGrammarParser.MESSAGE = 33;
tcServerSyslogGrammarParser.KEY = 34;
tcServerSyslogGrammarParser.VALUE = 35;
tcServerSyslogGrammarParser.PATH = 36;
tcServerSyslogGrammarParser.VERSION = 37;
tcServerSyslogGrammarParser.ADDR = 38;
tcServerSyslogGrammarParser.SIZE = 39;
tcServerSyslogGrammarParser.HASH = 40;
tcServerSyslogGrammarParser.DATE = 41;
tcServerSyslogGrammarParser.NR = 42;
tcServerSyslogGrammarParser.CALLS = 43;
tcServerSyslogGrammarParser.TIME = 44;
tcServerSyslogGrammarParser.DBTIME = 45;
tcServerSyslogGrammarParser.EXECTIME = 46;
tcServerSyslogGrammarParser.TRIPS = 47;
tcServerSyslogGrammarParser.ROWS = 48;
tcServerSyslogGrammarParser.SQL_QUERY = 49;
tcServerSyslogGrammarParser.SQL_CONTINUATION = 50;
tcServerSyslogGrammarParser.HIERARCHY_PREFIX = 51;
tcServerSyslogGrammarParser.PERC_TOTAL = 52;
tcServerSyslogGrammarParser.PERC_PARENT = 53;
tcServerSyslogGrammarParser.DB_TRIPS = 54;
tcServerSyslogGrammarParser.DEPTH = 55;
tcServerSyslogGrammarParser.ROUTINE = 56;
tcServerSyslogGrammarParser.DIGIT = 57;
tcServerSyslogGrammarParser.WS = 58;
tcServerSyslogGrammarParser.NEWLINE = 59;

tcServerSyslogGrammarParser.RULE_logFile = 0;
tcServerSyslogGrammarParser.RULE_header = 1;
tcServerSyslogGrammarParser.RULE_systemInfo = 2;
tcServerSyslogGrammarParser.RULE_logLine = 3;
tcServerSyslogGrammarParser.RULE_envSection = 4;
tcServerSyslogGrammarParser.RULE_envLine = 5;
tcServerSyslogGrammarParser.RULE_dllSection = 6;
tcServerSyslogGrammarParser.RULE_dllLine = 7;
tcServerSyslogGrammarParser.RULE_sqlDump = 8;
tcServerSyslogGrammarParser.RULE_sqlHeader = 9;
tcServerSyslogGrammarParser.RULE_sqlRow = 10;
tcServerSyslogGrammarParser.RULE_journalSection = 11;
tcServerSyslogGrammarParser.RULE_journalLine = 12;
tcServerSyslogGrammarParser.RULE_pomStats = 13;
tcServerSyslogGrammarParser.RULE_endSession = 14;
tcServerSyslogGrammarParser.RULE_truncated = 15;
tcServerSyslogGrammarParser.RULE_otherLine = 16;

class LogFileContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = tcServerSyslogGrammarParser.RULE_logFile;
    }

	EOF() {
	    return this.getToken(tcServerSyslogGrammarParser.EOF, 0);
	};

	header = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(HeaderContext);
	    } else {
	        return this.getTypedRuleContext(HeaderContext,i);
	    }
	};

	systemInfo = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(SystemInfoContext);
	    } else {
	        return this.getTypedRuleContext(SystemInfoContext,i);
	    }
	};

	logLine = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(LogLineContext);
	    } else {
	        return this.getTypedRuleContext(LogLineContext,i);
	    }
	};

	envSection = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(EnvSectionContext);
	    } else {
	        return this.getTypedRuleContext(EnvSectionContext,i);
	    }
	};

	dllSection = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(DllSectionContext);
	    } else {
	        return this.getTypedRuleContext(DllSectionContext,i);
	    }
	};

	sqlDump = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(SqlDumpContext);
	    } else {
	        return this.getTypedRuleContext(SqlDumpContext,i);
	    }
	};

	journalSection = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(JournalSectionContext);
	    } else {
	        return this.getTypedRuleContext(JournalSectionContext,i);
	    }
	};

	pomStats = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(PomStatsContext);
	    } else {
	        return this.getTypedRuleContext(PomStatsContext,i);
	    }
	};

	endSession = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(EndSessionContext);
	    } else {
	        return this.getTypedRuleContext(EndSessionContext,i);
	    }
	};

	truncated = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(TruncatedContext);
	    } else {
	        return this.getTypedRuleContext(TruncatedContext,i);
	    }
	};

	otherLine = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(OtherLineContext);
	    } else {
	        return this.getTypedRuleContext(OtherLineContext,i);
	    }
	};

	enterRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.enterLogFile(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.exitLogFile(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof tcServerSyslogGrammarVisitor ) {
	        return visitor.visitLogFile(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class HeaderContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = tcServerSyslogGrammarParser.RULE_header;
    }

	NEWLINE = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(tcServerSyslogGrammarParser.NEWLINE);
	    } else {
	        return this.getToken(tcServerSyslogGrammarParser.NEWLINE, i);
	    }
	};


	enterRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.enterHeader(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.exitHeader(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof tcServerSyslogGrammarVisitor ) {
	        return visitor.visitHeader(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class SystemInfoContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = tcServerSyslogGrammarParser.RULE_systemInfo;
    }

	NEWLINE = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(tcServerSyslogGrammarParser.NEWLINE);
	    } else {
	        return this.getToken(tcServerSyslogGrammarParser.NEWLINE, i);
	    }
	};


	enterRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.enterSystemInfo(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.exitSystemInfo(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof tcServerSyslogGrammarVisitor ) {
	        return visitor.visitSystemInfo(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class LogLineContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = tcServerSyslogGrammarParser.RULE_logLine;
    }

	LEVEL() {
	    return this.getToken(tcServerSyslogGrammarParser.LEVEL, 0);
	};

	WS = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(tcServerSyslogGrammarParser.WS);
	    } else {
	        return this.getToken(tcServerSyslogGrammarParser.WS, i);
	    }
	};


	TIMESTAMP() {
	    return this.getToken(tcServerSyslogGrammarParser.TIMESTAMP, 0);
	};

	ID() {
	    return this.getToken(tcServerSyslogGrammarParser.ID, 0);
	};

	MESSAGE() {
	    return this.getToken(tcServerSyslogGrammarParser.MESSAGE, 0);
	};

	NEWLINE() {
	    return this.getToken(tcServerSyslogGrammarParser.NEWLINE, 0);
	};

	enterRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.enterLogLine(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.exitLogLine(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof tcServerSyslogGrammarVisitor ) {
	        return visitor.visitLogLine(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class EnvSectionContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = tcServerSyslogGrammarParser.RULE_envSection;
    }

	NEWLINE() {
	    return this.getToken(tcServerSyslogGrammarParser.NEWLINE, 0);
	};

	envLine = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(EnvLineContext);
	    } else {
	        return this.getTypedRuleContext(EnvLineContext,i);
	    }
	};

	enterRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.enterEnvSection(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.exitEnvSection(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof tcServerSyslogGrammarVisitor ) {
	        return visitor.visitEnvSection(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class EnvLineContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = tcServerSyslogGrammarParser.RULE_envLine;
    }

	KEY() {
	    return this.getToken(tcServerSyslogGrammarParser.KEY, 0);
	};

	VALUE() {
	    return this.getToken(tcServerSyslogGrammarParser.VALUE, 0);
	};

	NEWLINE() {
	    return this.getToken(tcServerSyslogGrammarParser.NEWLINE, 0);
	};

	WS = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(tcServerSyslogGrammarParser.WS);
	    } else {
	        return this.getToken(tcServerSyslogGrammarParser.WS, i);
	    }
	};


	enterRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.enterEnvLine(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.exitEnvLine(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof tcServerSyslogGrammarVisitor ) {
	        return visitor.visitEnvLine(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class DllSectionContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = tcServerSyslogGrammarParser.RULE_dllSection;
    }

	NEWLINE = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(tcServerSyslogGrammarParser.NEWLINE);
	    } else {
	        return this.getToken(tcServerSyslogGrammarParser.NEWLINE, i);
	    }
	};


	dllLine = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(DllLineContext);
	    } else {
	        return this.getTypedRuleContext(DllLineContext,i);
	    }
	};

	enterRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.enterDllSection(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.exitDllSection(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof tcServerSyslogGrammarVisitor ) {
	        return visitor.visitDllSection(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class DllLineContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = tcServerSyslogGrammarParser.RULE_dllLine;
    }

	PATH() {
	    return this.getToken(tcServerSyslogGrammarParser.PATH, 0);
	};

	VERSION() {
	    return this.getToken(tcServerSyslogGrammarParser.VERSION, 0);
	};

	ADDR() {
	    return this.getToken(tcServerSyslogGrammarParser.ADDR, 0);
	};

	SIZE() {
	    return this.getToken(tcServerSyslogGrammarParser.SIZE, 0);
	};

	HASH() {
	    return this.getToken(tcServerSyslogGrammarParser.HASH, 0);
	};

	DATE() {
	    return this.getToken(tcServerSyslogGrammarParser.DATE, 0);
	};

	NEWLINE() {
	    return this.getToken(tcServerSyslogGrammarParser.NEWLINE, 0);
	};

	WS = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(tcServerSyslogGrammarParser.WS);
	    } else {
	        return this.getToken(tcServerSyslogGrammarParser.WS, i);
	    }
	};


	enterRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.enterDllLine(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.exitDllLine(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof tcServerSyslogGrammarVisitor ) {
	        return visitor.visitDllLine(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class SqlDumpContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = tcServerSyslogGrammarParser.RULE_sqlDump;
    }

	NEWLINE = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(tcServerSyslogGrammarParser.NEWLINE);
	    } else {
	        return this.getToken(tcServerSyslogGrammarParser.NEWLINE, i);
	    }
	};


	sqlHeader() {
	    return this.getTypedRuleContext(SqlHeaderContext,0);
	};

	sqlRow = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(SqlRowContext);
	    } else {
	        return this.getTypedRuleContext(SqlRowContext,i);
	    }
	};

	enterRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.enterSqlDump(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.exitSqlDump(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof tcServerSyslogGrammarVisitor ) {
	        return visitor.visitSqlDump(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class SqlHeaderContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = tcServerSyslogGrammarParser.RULE_sqlHeader;
    }

	NEWLINE = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(tcServerSyslogGrammarParser.NEWLINE);
	    } else {
	        return this.getToken(tcServerSyslogGrammarParser.NEWLINE, i);
	    }
	};


	enterRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.enterSqlHeader(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.exitSqlHeader(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof tcServerSyslogGrammarVisitor ) {
	        return visitor.visitSqlHeader(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class SqlRowContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = tcServerSyslogGrammarParser.RULE_sqlRow;
    }

	NR() {
	    return this.getToken(tcServerSyslogGrammarParser.NR, 0);
	};

	CALLS() {
	    return this.getToken(tcServerSyslogGrammarParser.CALLS, 0);
	};

	TIME() {
	    return this.getToken(tcServerSyslogGrammarParser.TIME, 0);
	};

	DBTIME() {
	    return this.getToken(tcServerSyslogGrammarParser.DBTIME, 0);
	};

	EXECTIME() {
	    return this.getToken(tcServerSyslogGrammarParser.EXECTIME, 0);
	};

	TRIPS() {
	    return this.getToken(tcServerSyslogGrammarParser.TRIPS, 0);
	};

	ROWS() {
	    return this.getToken(tcServerSyslogGrammarParser.ROWS, 0);
	};

	SQL_QUERY() {
	    return this.getToken(tcServerSyslogGrammarParser.SQL_QUERY, 0);
	};

	WS = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(tcServerSyslogGrammarParser.WS);
	    } else {
	        return this.getToken(tcServerSyslogGrammarParser.WS, i);
	    }
	};


	NEWLINE = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(tcServerSyslogGrammarParser.NEWLINE);
	    } else {
	        return this.getToken(tcServerSyslogGrammarParser.NEWLINE, i);
	    }
	};


	SQL_CONTINUATION = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(tcServerSyslogGrammarParser.SQL_CONTINUATION);
	    } else {
	        return this.getToken(tcServerSyslogGrammarParser.SQL_CONTINUATION, i);
	    }
	};


	enterRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.enterSqlRow(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.exitSqlRow(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof tcServerSyslogGrammarVisitor ) {
	        return visitor.visitSqlRow(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class JournalSectionContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = tcServerSyslogGrammarParser.RULE_journalSection;
    }

	NEWLINE = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(tcServerSyslogGrammarParser.NEWLINE);
	    } else {
	        return this.getToken(tcServerSyslogGrammarParser.NEWLINE, i);
	    }
	};


	journalLine = function(i) {
	    if(i===undefined) {
	        i = null;
	    }
	    if(i===null) {
	        return this.getTypedRuleContexts(JournalLineContext);
	    } else {
	        return this.getTypedRuleContext(JournalLineContext,i);
	    }
	};

	enterRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.enterJournalSection(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.exitJournalSection(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof tcServerSyslogGrammarVisitor ) {
	        return visitor.visitJournalSection(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class JournalLineContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = tcServerSyslogGrammarParser.RULE_journalLine;
    }

	HIERARCHY_PREFIX() {
	    return this.getToken(tcServerSyslogGrammarParser.HIERARCHY_PREFIX, 0);
	};

	PERC_TOTAL() {
	    return this.getToken(tcServerSyslogGrammarParser.PERC_TOTAL, 0);
	};

	PERC_PARENT() {
	    return this.getToken(tcServerSyslogGrammarParser.PERC_PARENT, 0);
	};

	TIME() {
	    return this.getToken(tcServerSyslogGrammarParser.TIME, 0);
	};

	DB_TRIPS() {
	    return this.getToken(tcServerSyslogGrammarParser.DB_TRIPS, 0);
	};

	CALLS() {
	    return this.getToken(tcServerSyslogGrammarParser.CALLS, 0);
	};

	DEPTH() {
	    return this.getToken(tcServerSyslogGrammarParser.DEPTH, 0);
	};

	ROUTINE() {
	    return this.getToken(tcServerSyslogGrammarParser.ROUTINE, 0);
	};

	NEWLINE() {
	    return this.getToken(tcServerSyslogGrammarParser.NEWLINE, 0);
	};

	WS = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(tcServerSyslogGrammarParser.WS);
	    } else {
	        return this.getToken(tcServerSyslogGrammarParser.WS, i);
	    }
	};


	enterRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.enterJournalLine(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.exitJournalLine(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof tcServerSyslogGrammarVisitor ) {
	        return visitor.visitJournalLine(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class PomStatsContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = tcServerSyslogGrammarParser.RULE_pomStats;
    }

	NEWLINE() {
	    return this.getToken(tcServerSyslogGrammarParser.NEWLINE, 0);
	};

	enterRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.enterPomStats(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.exitPomStats(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof tcServerSyslogGrammarVisitor ) {
	        return visitor.visitPomStats(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class EndSessionContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = tcServerSyslogGrammarParser.RULE_endSession;
    }

	NEWLINE() {
	    return this.getToken(tcServerSyslogGrammarParser.NEWLINE, 0);
	};

	enterRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.enterEndSession(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.exitEndSession(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof tcServerSyslogGrammarVisitor ) {
	        return visitor.visitEndSession(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class TruncatedContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = tcServerSyslogGrammarParser.RULE_truncated;
    }

	NEWLINE() {
	    return this.getToken(tcServerSyslogGrammarParser.NEWLINE, 0);
	};

	WS = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(tcServerSyslogGrammarParser.WS);
	    } else {
	        return this.getToken(tcServerSyslogGrammarParser.WS, i);
	    }
	};


	DIGIT = function(i) {
		if(i===undefined) {
			i = null;
		}
	    if(i===null) {
	        return this.getTokens(tcServerSyslogGrammarParser.DIGIT);
	    } else {
	        return this.getToken(tcServerSyslogGrammarParser.DIGIT, i);
	    }
	};


	enterRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.enterTruncated(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.exitTruncated(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof tcServerSyslogGrammarVisitor ) {
	        return visitor.visitTruncated(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}



class OtherLineContext extends antlr4.ParserRuleContext {

    constructor(parser, parent, invokingState) {
        if(parent===undefined) {
            parent = null;
        }
        if(invokingState===undefined || invokingState===null) {
            invokingState = -1;
        }
        super(parent, invokingState);
        this.parser = parser;
        this.ruleIndex = tcServerSyslogGrammarParser.RULE_otherLine;
    }

	NEWLINE() {
	    return this.getToken(tcServerSyslogGrammarParser.NEWLINE, 0);
	};

	enterRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.enterOtherLine(this);
		}
	}

	exitRule(listener) {
	    if(listener instanceof tcServerSyslogGrammarListener ) {
	        listener.exitOtherLine(this);
		}
	}

	accept(visitor) {
	    if ( visitor instanceof tcServerSyslogGrammarVisitor ) {
	        return visitor.visitOtherLine(this);
	    } else {
	        return visitor.visitChildren(this);
	    }
	}


}




tcServerSyslogGrammarParser.LogFileContext = LogFileContext; 
tcServerSyslogGrammarParser.HeaderContext = HeaderContext; 
tcServerSyslogGrammarParser.SystemInfoContext = SystemInfoContext; 
tcServerSyslogGrammarParser.LogLineContext = LogLineContext; 
tcServerSyslogGrammarParser.EnvSectionContext = EnvSectionContext; 
tcServerSyslogGrammarParser.EnvLineContext = EnvLineContext; 
tcServerSyslogGrammarParser.DllSectionContext = DllSectionContext; 
tcServerSyslogGrammarParser.DllLineContext = DllLineContext; 
tcServerSyslogGrammarParser.SqlDumpContext = SqlDumpContext; 
tcServerSyslogGrammarParser.SqlHeaderContext = SqlHeaderContext; 
tcServerSyslogGrammarParser.SqlRowContext = SqlRowContext; 
tcServerSyslogGrammarParser.JournalSectionContext = JournalSectionContext; 
tcServerSyslogGrammarParser.JournalLineContext = JournalLineContext; 
tcServerSyslogGrammarParser.PomStatsContext = PomStatsContext; 
tcServerSyslogGrammarParser.EndSessionContext = EndSessionContext; 
tcServerSyslogGrammarParser.TruncatedContext = TruncatedContext; 
tcServerSyslogGrammarParser.OtherLineContext = OtherLineContext; 
