/** @odoo-module **/

import { _t } from "@web/core/l10n/translation";
import {
    formatValue,
    TERM_OPERATORS_NEGATION,
    toValue,
} from "@web/core/tree_editor/condition_tree";
import { sprintf } from "@web/core/utils/strings";
import { parseExpr } from "@web/core/py_js/py";
import { Select } from "@web/core/tree_editor/tree_editor_components";

const OPERATOR_DESCRIPTIONS = {
    // valid operators (see TERM_OPERATORS in expression.py)
    "=": "=",
    "!=": "!=",
    "<=": "<=",
    "<": "<",
    ">": ">",
    ">=": ">=",
    "=?": "=?",
    "=like": _t("=like"),
    "=ilike": _t("=ilike"),
    like: _t("like"),
    "not like": _t("not like"),
    ilike: _t("contains"),
    startlike: _t("Starts With"),
    endlike: _t("Ends With"),
    "not ilike": _t("does not contain"),
    in: _t("is in"),
    "not in": _t("is not in"),
    child_of: _t("child of"),
    parent_of: _t("parent of"),

    // virtual operators (replace = and != in some cases)
    is: _t("is"),
    is_not: _t("is not"),
    set: _t("is set"),
    not_set: _t("is not set"),

    // virtual operator (equivalent to a couple (>=,<=))
    between: _t("is between"),
};

function toKey(operator, negate = false) {
    if (!negate && typeof operator === "string" && operator in OPERATOR_DESCRIPTIONS) {
        // this case is the main one. We keep it simple
        return operator;
    }
    return JSON.stringify([formatValue(operator), negate]);
}

function toOperator(key) {
    if (!key.includes("[")) {
        return [key, false];
    }
    const [expr, negate] = JSON.parse(key);
    return [toValue(parseExpr(expr)), negate];
}

export function getOperatorLabelCustom(operator, negate = false) {
    let label;
    if (typeof operator === "string" && operator in OPERATOR_DESCRIPTIONS) {
        if (negate && operator in TERM_OPERATORS_NEGATION) {
            return OPERATOR_DESCRIPTIONS[TERM_OPERATORS_NEGATION[operator]];
        }
        label = OPERATOR_DESCRIPTIONS[operator];
    } else {
        label = formatValue(operator);
    }
    if (negate) {
        return sprintf(`not %s`, label);
    }
    return label;
}

function getOperatorInfo(operator, negate = false) {
    const key = toKey(operator, negate);
    const label = getOperatorLabelCustom(operator, negate);
    return [key, label];
}

export function getOperatorEditorInfoCustom(operators) {
    const defaultOperator = operators[0];
    const operatorsInfo = operators.map((operator) => getOperatorInfo(operator));
    return {
        component: Select,
        extractProps: ({ update, value: [operator, negate] }) => {
            const [operatorKey, operatorLabel] = getOperatorInfo(operator, negate);
            const options = [...operatorsInfo];
            if (!options.some(([key]) => key === operatorKey)) {
                options.push([operatorKey, operatorLabel]);
            }
            return {
                value: operatorKey,
                update: (operatorKey) => update(...toOperator(operatorKey)),
                options,
            };
        },
        defaultValue: () => defaultOperator,
        isSupported: ([operator]) =>
            typeof operator === "string" && operator in OPERATOR_DESCRIPTIONS, // should depend on fieldDef too... (e.g. parent_id does not always make sense)
        message: _t("Operator not supported"),
        stringify: ([operator, negate]) => getOperatorLabelCustom(operator, negate)
    };
}

export function disambiguate(value, displayNames) {
    if (!Array.isArray(value)) {
        return value === "";
    }
    let hasSomeString = false;
    let hasSomethingElse = false;
    for (const val of value) {
        if (val === "") {
            return true;
        }
        if (typeof val === "string" || (displayNames && isId(val))) {
            hasSomeString = true;
        } else {
            hasSomethingElse = true;
        }
    }
    return hasSomeString && hasSomethingElse;
}

export function leafToStringCustom(tree, fieldDef, displayNames) {
    let { operator, negate, value } = tree;
    if(operator == "startlike" && value) {
        value = value.replace("%", "")
    }
    if(operator == "endlike" && value) {
        value = value.replace("%", "")
    }
    const operatorLabel = getOperatorLabelCustom(operator, negate);
    const description = {
        operatorDescription: `${operatorLabel}`,
        valueDescription: null,
    };

    if (["set", "not_set"].includes(operator)) {
        return description;
    }
    if (["is", "is_not"].includes(operator)) {
        description.valueDescription = {
            values: [value ? _t("set") : _t("not set")],
            join: "",
            addParenthesis: false,
        };
        return description;
    }

    const dis = disambiguate(value, displayNames);
    const values = (Array.isArray(value) ? value : [value]).map((val) =>
        formatValue(val, dis, fieldDef, displayNames)
    );
    let join;
    let addParenthesis = Array.isArray(value);
    switch (operator) {
        case "between":
            join = _t("and");
            addParenthesis = false;
            break;
        case "in":
        case "not in":
            join = ",";
            break;
        default:
            join = _t("or");
    }
    description.valueDescription = { values, join, addParenthesis };
    return description;
}