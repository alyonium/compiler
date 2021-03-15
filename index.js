import fs from 'fs/promises';

const END_ARG = ')';
const START_ARG = '(';

class Cell {
    value
    action

    constructor(value, action) {
        this.value = value;
        this.action = action;
    }

    getValue() {
        return this.value;
    }

    setValue(value) {
        this.value = value;
    }

    getAction() {
        return this.action;
    }

    setAction(action) {
        this.action = action;
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

const canMergeCells = (leftCell, rightCell) => getPriority(leftCell.getAction()) >= getPriority(rightCell.getAction())

const mergeCells = (leftCell, rightCell) => {
    switch (leftCell.getAction()) {
        case '*':
            leftCell.setValue(leftCell.getValue() * rightCell.getValue());
            break;
        case '/':
            leftCell.setValue(leftCell.getValue() / rightCell.getValue());
            break;
        case '+':
            leftCell.setValue(leftCell.getValue() + rightCell.getValue());
            break;
        case '-':
            leftCell.setValue(leftCell.getValue() - rightCell.getValue());
            break;
        default:
    }
    leftCell.setAction(rightCell.getAction());
};

const merge = (listToMerge) => {
    let index = 1;

    const iter = (currentCell, mergeOneOnly) => {
        while (index < listToMerge.length) {
            const next = listToMerge[index];
            index += 1;
            while (!canMergeCells(currentCell, next)) {
                iter(next, true);
            }

            mergeCells(currentCell, next);

            if (mergeOneOnly) {
                return currentCell.getValue();
            }
        }
        return currentCell.getValue();
    };
    return iter(listToMerge[0], false);
};

const isActionValid = (ch) => {
    const actions = ['*', '/', '+', '-'];
    return actions.includes(ch);
};

const isStillCollecting = (item, ch, to, defaultTo) => {
    const stopCollecting = to === END_ARG || to === defaultTo ? END_ARG : to;
    return (
        (item.length === 0 && (ch === '-' || ch === END_ARG)) ||
        !(isActionValid(ch) || ch === START_ARG || ch === stopCollecting)
    );
};

const stringToNumber = (data, item) => {
    const number = +item;
    if (Number.isNaN(number)) {
        throw new Error(`Error parsing number from string ${item}`);
    }
    return number;
};

const calculateExpression = (expression, defaultTo = '\0') => {
    let from = 0;

    const updateAction = (item, ch, to) => {
        if (from >= item.length || item[from] === END_ARG || item[from] === to) {
            return END_ARG;
        }

        let index = from;
        let res = ch;
        while (!isActionValid(res) && index < item.length) {
            // смотрим на следующий символ в строке,
            // пока не найдем допустимое действие
            res = item[index];
            index += 1;
        }
        if (isActionValid(res)) {
            from = index;
        } else if (index > from) {
            from = index - 1;
        }
        return res;
    };

    const getParserFunction = (data, item, ch) => {
        if (item.length === 0 && ch === START_ARG) {
            return () => loadAndCalculate(data, END_ARG);
        }
        return stringToNumber;
    };

    const loadAndCalculate = (data, to) => {
        const listToMerge = [];
        let item = '';

        do {
            const ch = data[from];
            from += 1;

            if (isStillCollecting(item, ch, to, defaultTo)) {
                item += ch;
                if (from < data.length && data[from] !== to) {
                    continue;
                }
            }
            const fn = getParserFunction(data, item, ch);

            const value = fn(data, item);

            const action = isActionValid(ch) ? ch : updateAction(data, ch, to);
            listToMerge.push(new Cell(value, action));
            item = '';
        } while (from < data.length && data[from] !== to);

        if (from < data.length && (data[from] === END_ARG || data[from] === to)) {
            from += 1;
        }

        return merge(listToMerge);
    };

    return loadAndCalculate(expression, defaultTo);
};

const calculateFileExpression = async (filepath) => {
    const expression = await fs.readFile(filepath, 'utf-8');

    return calculateExpression(expression);
};

const main = async () => console.log(await calculateFileExpression('expressionExample.txt', '\0'))

main();
