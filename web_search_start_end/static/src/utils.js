/** @odoo-module **/

import { getDomainTreeDescription } from "@web/core/domain_selector/utils";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";
import {
    normalizeValue,
    formatValue as toString,
    createVirtualOperators,
    condition,
} from "@web/core/tree_editor/condition_tree";
import { useLoadFieldInfo, useLoadPathDescription } from "@web/core/model_field_selector/utils";
import {
    leafToString,
    extractIdsFromTree,
    getPathsInTree,
    useLoadDisplayNames,
} from "@web/core/tree_editor/utils";
import { leafToStringCustom } from "@web_search_start_end/js/tree_editor_operator_editor";


/**
 * @param {Tree} tree
 * @returns {tree}
 */
function simplifyTree(tree) {
    if (tree.type === "condition") {
        return tree;
    }
    const processedChildren = tree.children.map(simplifyTree);
    if (tree.value === "&") {
        return { ...tree, children: processedChildren };
    }
    const children = [];
    const childrenByPath = {};
    for (const child of processedChildren) {
        if (
            child.type === "connector" ||
            typeof child.path !== "string" ||
            !["=", "in"].includes(child.operator)
        ) {
            children.push(child);
        } else {
            if (!childrenByPath[child.path]) {
                childrenByPath[child.path] = [];
            }
            childrenByPath[child.path].push(child);
        }
    }
    for (const path in childrenByPath) {
        if (childrenByPath[path].length === 1) {
            children.push(childrenByPath[path][0]);
            continue;
        }
        const value = [];
        for (const child of childrenByPath[path]) {
            if (child.operator === "=") {
                value.push(child.value);
            } else {
                value.push(...child.value);
            }
        }
        children.push(condition(path, "in", normalizeValue(value)));
    }
    if (children.length === 1) {
        return { ...children[0] };
    }
    return { ...tree, children };
}

/**
 * @param {Tree} tree
 * @param {Function} getDescription
 * @param {boolean} [isSubExpression=true]
 * @returns {string}
 */
export function getDomainTreeDescriptionCustom(
    tree,
    getFieldDef,
    getDescription,
    displayNames,
    isSubExpression = true
) {
 //   if(tree.operator == "startlike" || tree.operator == "endlike") {
        if (tree.type === "connector") {
            // we assume that the domain tree is normalized (--> there is at least two children)
            const childDescriptions = tree.children.map((c) =>
                getDomainTreeDescriptionCustom(c, getFieldDef, getDescription, displayNames)
            );
            const separator = tree.value === "&" ? _t("and") : _t("or");
            let description = childDescriptions.join(` ${separator} `);
            if (isSubExpression || tree.negate) {
                description = `( ${description} )`;
            }
            if (tree.negate) {
                description = `! ${description}`;
            }
            return description;
        }
        const { path } = tree;
        const fieldDef = getFieldDef(path);
        if(tree.operator == "startlike" || tree.operator == "endlike") {
            const { operatorDescription, valueDescription } = leafToStringCustom(
                    tree,
                    fieldDef,
                    displayNames[fieldDef?.relation || fieldDef?.comodel]
                );
            let description = `${getDescription(path)} ${operatorDescription} `;
            if (valueDescription) {
                const { values, join, addParenthesis } = valueDescription;
                const jointedValues = values.join(` ${join} `);
                description += addParenthesis ? `( ${jointedValues} )` : jointedValues;
            }
            return description;
        }else {
            const { operatorDescription, valueDescription } = leafToString(
                    tree,
                    fieldDef,
                    displayNames[fieldDef?.relation || fieldDef?.comodel]
                );
            let description = `${getDescription(path)} ${operatorDescription} `;
            if (valueDescription) {
                const { values, join, addParenthesis } = valueDescription;
                const jointedValues = values.join(` ${join} `);
                description += addParenthesis ? `( ${jointedValues} )` : jointedValues;
            }
            return description;
        }
   // }
//    else {
//        return getDomainTreeDescription(
//                tree,
//                getFieldDef,
//                getDescription,
//                displayNames,
//                isSubExpression
//        ) 
//    }
}

export function useGetDomainTreeDescriptionCustom(fieldService, nameService) {
    fieldService ||= useService("field");
    nameService ||= useService("name");
    const loadFieldInfo = useLoadFieldInfo(fieldService);
    const loadPathDescription = useLoadPathDescription(fieldService);
    const loadDisplayNames = useLoadDisplayNames(nameService);
    return async (resModel, tree) => {
        tree = simplifyTree(tree);
        const paths = getPathsInTree(tree);
        const promises = [];
        const pathFieldDefs = {};
        const pathDescriptions = {};
        for (const path of paths) {
            promises.push(
                loadPathDescription(resModel, path).then(({ displayNames }) => {
                    pathDescriptions[toString(path)] = displayNames.join(" 🠒 ");
                }),
                loadFieldInfo(resModel, path).then(({ fieldDef }) => {
                    pathFieldDefs[toString(path)] = fieldDef;
                })
            );
        }
        await Promise.all(promises);
        const getFieldDef = (path) => pathFieldDefs[toString(path)];
        const getDescription = (path) => pathDescriptions[toString(path)];
        const idsByModel = extractIdsFromTree(tree, getFieldDef);
        const treeWithVirtualOperators = createVirtualOperators(tree, { getFieldDef });
        const displayNames = await loadDisplayNames(idsByModel);
        return getDomainTreeDescriptionCustom(
            treeWithVirtualOperators,
            getFieldDef,
            getDescription,
            displayNames,
            false
        );
    };
}
