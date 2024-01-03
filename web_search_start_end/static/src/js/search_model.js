/** @odoo-module **/

import { patch } from "@web/core/utils/patch";
import { useGetDomainTreeDescriptionCustom } from "@web_search_start_end/utils";
import { SearchModel } from "@web/search/search_model";

patch(SearchModel.prototype, {
    setup(services) {
        super.setup(services);
        const { field: fieldService, name: nameService, orm, user, view } = services;
        this.getDomainTreeDescription = useGetDomainTreeDescriptionCustom(fieldService, nameService);
    }
});