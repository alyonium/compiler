import fs from 'fs/promises';

const START_ARG = '(';
const END_ARG = ')';
const END_LINE = '\n';
let INDEX = 1

class Cell {
    value
    action

    constructor(value, action) {
        this.value = value;
        this.action = action;
    }
}

class Parser {
    convertStringToNumber(data, item) {
        const num = parseFloat(item);
        if (Number.isNaN(num)) {
            throw new Error(`Couldn't parse number from string ${item}`);
        }
        return num;
    };
}

class Calculator {
    from = 0

    loadAndCalculate(data, to) {
        if (this.from >= data.length || data[this.from] === to)  {
            throw new Error(`Loaded invalid data ${data}`);
        }

        const listToMerge = [];
        let item = '';

        do {
            const ch = data[this.from++];

            if (stillCollecting(item, ch, to)) {
                item += ch;
                if (this.from < data.length && data[this.from] !== to) {
                    continue;
                }
            }
            const func = this.parserFunction(data, item, ch);

            const value = func(data, item);

            const action = validAction(ch) ? ch : this.updateAction(data, ch, to);
            listToMerge.push(new Cell(value, action));
            item = item.replace(`${item}`, '');

        } while (this.from < data.length && data[this.from] !== to);

        if (this.from < data.length && (data[this.from] === END_ARG || data[this.from] === to)) {
            this.from++;
        }

        return merge(listToMerge)
    }

    updateAction(item, ch, to) {
        if (this.from >= item.length || item[this.from] === END_ARG || item[this.from] === to) {
            return END_ARG;
        }

        let index = this.from;
        let res = ch;

        while (!validAction(res) && index < item.length) {
            res = item[index++];
        }

        this.from = validAction(res) ? index : index > this.from ? index - 1 : this.from;

        return res;
    };

    parserFunction(data, item, ch) {
        if (item.length === 0 && ch === START_ARG) {
            return () => this.loadAndCalculate(data, END_ARG);
        }
        const parser = new Parser();
        return parser.convertStringToNumber;
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

const validAction = (ch) => ['*', '/', '+', '-'].indexOf(ch) !== -1;

const stillCollecting = (item, ch, to) => {
    const stopCollecting = to === END_ARG || to === END_LINE ? END_ARG : to;
    return ((item.length === 0 && (ch === '-' || ch === END_ARG)) || !(validAction(ch) || ch === START_ARG || ch === stopCollecting));
};

const main = async (filepath) => {
    const file = await fs.readFile(filepath, 'utf8')
    const expressions = file.toString().split(END_LINE);
    expressions.forEach((expression) => {
        const calculator = new Calculator();
        const answer = calculator.loadAndCalculate(expression);
        console.log(`${ expression } = ${ answer }`);
    })
};

await main('file.txt')
