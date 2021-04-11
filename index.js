import fs from 'fs/promises';

const START_ARG = '(';
const END_ARG = ')';
const SPACE = ' ';
const EMPTY = '';
const END_LINE = '\n';
const END_STATEMENT = ';';
const ACTIONS = ['*', '/', '+', '-', '^'];
let INDEX = 1

class Cell {
    value
    action

    constructor(value, action) {
        this.value = value;
        this.action = action;
    }
}

class ParsingScript {
    data
    from

    constructor(data, from = 0) {
        this.data = data;
        this.from = from;
    }

    stillValid() {
        return this.from < this.data.length;
    }

    getCurrentChar() {
        return this.data[this.from];
    }

    forward() {
        this.from += 1;
    }
}

class Parser {
    parserFunctions = {
        sin: (script) => {
            const arg = this.loadAndCalculate(script, END_ARG);
            return Math.sin(arg);
        },
        cos: (script) => {
            const arg = this.loadAndCalculate(script, END_ARG);
            return Math.cos(arg);
        },
        tan: (script) => {
            const arg = this.loadAndCalculate(script, END_ARG);
            return Math.tan(arg);
        },
        abs: (script) => {
            const arg = this.loadAndCalculate(script, END_ARG);
            return Math.abs(arg);
        },
        sqrt: (script) => {
            const arg = this.loadAndCalculate(script, END_ARG);
            return Math.sqrt(arg);
        },
        log: (script) => {
            const arg = this.loadAndCalculate(script, END_ARG);
            return Math.log(arg);
        },
    };

    loadAndCalculate = (script, to) => {
        const listToMerge = [];
        let item = '';

        do {
            const ch = script.data[script.from];
            script.from += 1;

            if (this.stillCollecting(item, ch, to)) {
                item += ch;
                if (script.from < script.data.length && !to.includes(script.data[script.from])) {
                    continue;
                }
            }
            const func = this.parserFunction(script, item, ch);

            const value = func(script);
            const action = validAction(ch) ? ch : this.updateAction(script, ch, to);
            listToMerge.push(new Cell(value, action));
            item = item.replace(`${item}`, '');
        } while (script.from < script.data.length && !to.includes(script.data[script.from]));

        if (script.from < script.data.length && (script.data[script.from] === END_ARG || to.includes(script.data[script.from]))) {
            script.from++;
        }

        return merge(listToMerge)
    }

    updateAction = (script, ch, to) => {
        if (script.from >= script.data.length || script.data[script.from] === END_ARG || script.data[script.from] === to) {
            return END_ARG;
        }

        let index = script.from;
        let res = ch;

        while (!validAction(res) && index < script.data.length) {
            res = script.data[index];
            index += 1;
        }

        if (validAction(res)) {
            script.from = index;
        } else if (index > script.from) {
            script.from = index - 1;
        }

        return res;
    };

    stillCollecting = (item, ch, to) => {
        const stopCollecting = to === END_ARG || to === EMPTY ? END_ARG : to;
        return ((item.length === 0 && (ch === '-' || ch === END_ARG)) || !(validAction(ch) || ch === START_ARG || ch === stopCollecting));
    };

    convertStringToNumber = (item) => () => {
        const num = +item;
        if (Number.isNaN(num)) {
            throw new Error(`Couldn't parse number from string ${item}`);
        }
        return num;
    };

    parserFunction = (script, item, ch) => {
        if (item.length === 0 && ch === START_ARG) {
            return () => this.loadAndCalculate(script, END_ARG);
        }
        if (this.parserFunctions[item] !== undefined) {
            return this.parserFunctions[item];
        }
        return this.convertStringToNumber(item);
    }
}

const getPriority = (action) => {
    switch (action) {
        case '*':
        case '/':
            return 3;
        case '+':
        case '-':
            return 2;
        default:
            return 0;
    }
};

const canMergeCells = (leftCell, rightCell) => getPriority(leftCell.action) >= getPriority(rightCell.action)

const mergeCells = (leftCell, rightCell) => {
    switch (leftCell.action) {
        case '*': leftCell.value *= rightCell.value;
            break;
        case '/': leftCell.value /= rightCell.value;
            break;
        case '+': leftCell.value += rightCell.value;
            break;
        case '-': leftCell.value -= rightCell.value;
            break;
        case '^': leftCell.value **= rightCell.value;
            break;
        default:
    }
    leftCell.action = rightCell.action;
};

const merge = (listToMerge) => {
    const mergeCycle = (current, mergeOneOnly = false) => {
        while (INDEX < listToMerge.length) {
            const next = listToMerge[INDEX++];

            while (!canMergeCells(current, next)) {
                mergeCycle(next, true);
            }

            mergeCells(current, next);

            if (mergeOneOnly) {
                return current.value;
            }
        }
        return current.value;
    };
    INDEX = 1
    return mergeCycle(listToMerge[0], false);
};

const validAction = (ch) => ACTIONS.indexOf(ch) !== -1;

const goToNextStatement = (script) => {
    let endGroupRead = 0;

    while (script.stillValid()) {
        const currentChar = script.getCurrentChar();
        switch (currentChar) {
            case END_GROUP:
                endGroupRead += 1;
                script.forward();
                return endGroupRead;
            case START_GROUP:
            case END_ARG:
            case END_LINE:
            case SPACE:
                script.forward();
                break;
            default:
                return endGroupRead;
        }
    }
    return endGroupRead;
};

const main = async (filepath) => {
    const file = await fs.readFile(filepath, 'utf8')
    let answer;
    const expressions = file.toString().split(END_LINE);

    expressions.forEach((expression) => {
        const script = new ParsingScript(expression);

        if (expression !== EMPTY) {
            while (script.stillValid()) {
                const parser = new Parser();
                answer = parser.loadAndCalculate(script, END_STATEMENT);
                goToNextStatement(script);
            }

            console.log(`${expression} = ${answer}`);
        }
    })
};

await main('test.txt')
