/** @odoo-module **/
//import {
//    leafToString,
//} from "@web/core/tree_editor/utils";
import {patch} from "@web/core/utils/patch";
import { deepEqual } from "@web/core/utils/objects";
import {
    cloneTree,
    removeVirtualOperators,
} from "@web/core/tree_editor/condition_tree";
import { TreeEditor } from "@web/core/tree_editor/tree_editor";
//import {
//    getValueEditorInfo,
//} from "@web/core/tree_editor/tree_editor_value_editors";
import { getDomainDisplayedOperators } from "@web/core/domain_selector/domain_selector_operator_editor";
import { getOperatorEditorInfo, getOperatorLabel } from "@web/core/tree_editor/tree_editor_operator_editor";
import { getOperatorEditorInfoCustom, getOperatorLabelCustom } from "@web_search_start_end/js/tree_editor_operator_editor";
import { getValueEditorInfo, getDefaultValue } from "@web_search_start_end/js/tree_editor_value_editors";

patch(TreeEditor.prototype, {
    async updatePath(node, path) {
        if(node.operator == 'startlike' && node.value) {
            node.value = node.value.replace("%", "") + "%"
        }
        if(node.operator == 'endlike' && node.value) {
            node.value = "%" + node.value.replace("%", "") 
        }
        super.updatePath(node, path)
    },
    updateLeafOperator(node, operator, negate) {
        const previousNode = cloneTree(node);
        const fieldDef = this.getFieldDef(node.path);
        node.negate = negate;
        node.operator = operator;
        node.value = getDefaultValue(fieldDef, operator, node.value);
        if(node.operator == 'startlike' && node.value) {
            node.value = node.value.replace("%", "") + "%"
        }
        if(node.operator == 'endlike' && node.value) {
            node.value = "%" + node.value.replace("%", "")
        }
        if (deepEqual(removeVirtualOperators(node), removeVirtualOperators(previousNode))) {
            // no interesting changes for parent
            // this means that parent might not render the domain selector
            // but we need to udpate editors
            this.render();
        }
        this.notifyChanges();
    },
    updateLeafValue(node, value) {
        if(node.operator == 'startlike' && value) {
            value = value.replace("%", "") + "%"
        }
        if(node.operator == 'endlike' && value) {
            value = "%" + value.replace("%", "");
        }
        super.updateLeafValue(node, value)
    },
    updateedValue(node) {
        var value= node.value
        if(node.operator == 'startlike' && value) {
            value = value.replace("%", "")
        }
        if(node.operator == 'endlike' && value) {
            value = value.replace("%", "")
        }
        return value
    },
    getValueEditorInfo(node) {
        if(node.operator == 'startlike' || node.operator == 'endlike') {
            const fieldDef = this.getFieldDef(node.path);
            return getValueEditorInfo(fieldDef, node.operator);
        }else {
            return super.getValueEditorInfo(node);
        }
    },
    getOperatorEditorInfo(node){
        const fieldDef = this.getFieldDef(node.path);
        var operators = getDomainDisplayedOperators(fieldDef);
        if(operators && operators.includes("ilike")) {
            if( ! operators.includes("startlike")) {
                operators.push("startlike")
            }
            if( ! operators.includes("endlike")) {
                operators.push("endlike")
            }
        }
        return getOperatorEditorInfoCustom(operators);
    },
//    leafToStringCustom(tree, fieldDef, displayNames) {
//        const { operator, negate, value } = tree;
//        const operatorLabel = getOperatorLabelCustom(operator, negate);
//        const description = {
//            operatorDescription: `${operatorLabel}`,
//            valueDescription: null,
//        };
//
//        if (["set", "not_set"].includes(operator)) {
//            return description;
//        }
//        if (["is", "is_not"].includes(operator)) {
//            description.valueDescription = {
//                values: [value ? _t("set") : _t("not set")],
//                join: "",
//                addParenthesis: false,
//            };
//            return description;
//        }
//
//        const dis = disambiguate(value, displayNames);
//        const values = (Array.isArray(value) ? value : [value]).map((val) =>
//            formatValue(val, dis, fieldDef, displayNames)
//        );
//        let join;
//        let addParenthesis = Array.isArray(value);
//        switch (operator) {
//            case "between":
//                join = _t("and");
//                addParenthesis = false;
//                break;
//            case "in":
//            case "not in":
//                join = ",";
//                break;
//            default:
//                join = _t("or");
//        }
//        description.valueDescription = { values, join, addParenthesis };
//        return description;
//    },
//    getDescription(node) {
//        const fieldDef = this.getFieldDef(node.path);
//        if(node && node.operator == 'startlike') {
//            return leafToStringCustom(node, fieldDef, this.displayNames[getResModel(fieldDef)]);
//        }
//        if(node && node.operator == 'endlike') {
//            return leafToStringCustom(node, fieldDef, this.displayNames[getResModel(fieldDef)]);
//        }
//        return leafToString(node, fieldDef, this.displayNames[getResModel(fieldDef)]);
//    }
});

