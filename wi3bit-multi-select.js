/**
 * WI3BIT Custom Multi-Select Dropdown Plugin
 * Version: 1.0.0
 * Description: A dynamic, searchable, grouped, tree-nesting multi-select plugin.
 */
(function ($) {
    $.fn.wi3bitMultiSelect = function (options) {
        let settings = $.extend(
            {
                nestedGroups: false,
                showSelectAll: true,
                showClearAll: true,
                showReset: false,
                showSearch: false,
                showTotalCount: false,
                width: "100%",
                height: "36px",
                dropdownHeight: "400px",
            },
            options,
        );

        return this.each(function () {
            let $originalSelect = $(this);
            let $btnAll = null;
            let $btnClear = null;
            let $btnReset = null;

            let existingWrapper = $originalSelect.data(
                "wi3bit-multi-select-wrapper",
            );
            let existingEvent = $originalSelect.data(
                "wi3bit-multi-select-event",
            );
            if (existingWrapper) {
                existingWrapper
                    .find('[data-bs-toggle="tooltip"]')
                    .each(function () {
                        let t = bootstrap.Tooltip.getInstance(this);
                        if (t) t.dispose();
                    });
                let $oldDisplay = existingWrapper.find(
                    ".wi3bit-select-display",
                );
                if ($oldDisplay.length) {
                    let t = bootstrap.Tooltip.getInstance($oldDisplay[0]);
                    if (t) t.dispose();
                }
                existingWrapper.remove();
                if (existingEvent) {
                    $(document).off(existingEvent);
                }
                $originalSelect.show();
            }

            if (!$originalSelect.prop("multiple")) {
                return;
            }

            let defaultSelectedValues = $originalSelect
                .find("option")
                .filter(function () {
                    let valAttr = $(this).attr("value");
                    if (
                        valAttr === undefined ||
                        valAttr === null ||
                        valAttr === ""
                    ) {
                        return false;
                    }
                    return (
                        $(this).prop("defaultSelected") ||
                        $(this).attr("selected") !== undefined
                    );
                })
                .map(function () {
                    return $(this).val();
                })
                .get();

            let totalOptions = $originalSelect
                .find("option")
                .filter(function () {
                    let valAttr = $(this).attr("value");
                    return (
                        valAttr !== undefined &&
                        valAttr !== null &&
                        valAttr !== ""
                    );
                }).length;

            let originalClasses = ($originalSelect.attr("class") || "")
                .split(/\s+/)
                .filter(Boolean);
            let originalStyles = ($originalSelect.attr("style") || "")
                .replace(/display\s*:\s*none\s*;?/gi, "")
                .trim();

            $originalSelect.hide();

            let $wrapper = $(
                '<div class="wi3bit-multi-select position-relative"></div>',
            );
            if (settings.width) {
                $wrapper.css("width", settings.width);
            }

            let requiredClasses = ["form-select", "wi3bit-select-display"];
            let uniqueClasses = [
                ...new Set([...requiredClasses, ...originalClasses]),
            ].join(" ");

            let $display = $(
                `<div class="${uniqueClasses}" style="${originalStyles}"></div>`,
            );
            if (settings.height) {
                $display.css({
                    height: settings.height,
                    "min-height": settings.height,
                });
            }

            let pText = $originalSelect.data("placeholder") || "Select...";
            let $placeholder = $(
                `<span class="text-muted placeholder-text"><i class="fa-solid fa-list-check me-2"></i>${pText}</span>`,
            );
            let $selectedText = $(
                '<span class="wi3bit-selected-text" style="display:none;"></span>',
            );
            let $countBadge = $(
                '<span class="badge bg-primary rounded-pill wi3bit-select-badge text-white" style="display:none;"></span>',
            );
            let $chevron = $(
                '<i class="fa-solid fa-chevron-down position-absolute wi3bit-select-chevron"></i>',
            );

            let $dropdown = $(
                '<div class="dropdown-menu shadow p-2 mt-1 w-100"></div>',
            );
            if (settings.dropdownHeight) {
                $dropdown.css("max-height", settings.dropdownHeight);
            }

            let $optionsContainer = $("<div></div>");
            let $notFound = $(
                '<div class="wi3bit-not-found text-muted text-center" style="display:none;"><i class="fa-solid fa-triangle-exclamation me-2"></i>No matches found</div>',
            );

            let showHeader =
                settings.showSelectAll ||
                settings.showClearAll ||
                settings.showReset ||
                settings.showSearch ||
                settings.showTotalCount;
            let $searchContainer;

            if (showHeader) {
                let $btnGroup = $(
                    '<div class="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom wi3bit-action-header"></div>',
                );

                if (settings.showSearch) {
                    $searchContainer = $(`
                        <div class="wi3bit-search-container flex-grow-1">
                            <div class="input-group input-group-sm">
                                <span class="input-group-text bg-transparent border-end-0 text-muted" style="border-color: var(--bs-gray-200); padding: 0.25rem 0.5rem;"><i class="fa-solid fa-magnifying-glass"></i></span>
                                <input type="text" class="form-control border-start-0 wi3bit-search-input ps-0" placeholder="Search..." style="border-color: var(--bs-gray-200); font-size: 0.82rem; height: 30px;">
                            </div>
                        </div>
                    `);
                    $btnGroup.append($searchContainer);

                    let $searchInput = $searchContainer.find(
                        ".wi3bit-search-input",
                    );
                    $searchInput.on("input", function () {
                        let query = $(this).val().toLowerCase().trim();
                        if (query === "") {
                            $optionsContainer
                                .find(
                                    ".wi3bit-group-wrapper, .wi3bit-group-header, .wi3bit-subgroup-wrapper, .wi3bit-subgroup-header, .wi3bit-select-option",
                                )
                                .show();
                            $notFound.hide();
                        } else {
                            $optionsContainer
                                .find(
                                    ".wi3bit-group-wrapper, .wi3bit-group-header, .wi3bit-subgroup-wrapper, .wi3bit-subgroup-header, .wi3bit-select-option",
                                )
                                .hide();
                            $optionsContainer
                                .find(".wi3bit-select-option")
                                .each(function () {
                                    let optionText = $(this)
                                        .find("label")
                                        .text()
                                        .toLowerCase();
                                    if (optionText.indexOf(query) > -1) {
                                        $(this).show();
                                        $(this)
                                            .parents(".wi3bit-subgroup-wrapper")
                                            .show();
                                        $(this)
                                            .parents(".wi3bit-subgroup-wrapper")
                                            .find(".wi3bit-subgroup-header")
                                            .show();
                                        $(this)
                                            .parents(".wi3bit-group-wrapper")
                                            .show();
                                        $(this)
                                            .parents(".wi3bit-group-wrapper")
                                            .find(".wi3bit-group-header")
                                            .first()
                                            .show();
                                    }
                                });

                            let visibleOptions = $optionsContainer.find(
                                ".wi3bit-select-option:visible",
                            ).length;
                            if (visibleOptions === 0) {
                                $notFound.text("No matches found").show();
                            } else {
                                $notFound.hide();
                            }
                        }
                        updateHeaderButtons();
                    });
                }

                let hasButtons =
                    settings.showSelectAll ||
                    settings.showClearAll ||
                    settings.showReset ||
                    settings.showTotalCount;
                if (hasButtons) {
                    let $actionsWrapper = $(
                        '<div class="d-flex gap-1 align-items-center"></div>',
                    );
                    if (settings.showSearch) {
                        $actionsWrapper.addClass("ms-auto");
                    } else {
                        $actionsWrapper.addClass(
                            "w-100 justify-content-between",
                        );
                    }

                    if (settings.showTotalCount) {
                        let $totalBadge = $(
                            `<span class="badge bg-light text-dark border me-1 small wi3bit-total-options-badge" data-bs-toggle="tooltip" title="Total Options">${totalOptions}</span>`,
                        );
                        $actionsWrapper.append($totalBadge);
                        new bootstrap.Tooltip($totalBadge[0]);
                    }

                    if (settings.showSelectAll) {
                        $btnAll = $(
                            '<span class="p-2" data-bs-toggle="tooltip" data-bs-placement="top" title="Select All"><i class="fa-solid fa-check-double wi3bit-cursor-pointer wi3bit-text-hover-primary"></i></span>',
                        );
                        $actionsWrapper.append($btnAll);
                        new bootstrap.Tooltip($btnAll[0]);
                        $btnAll.on("click", function () {
                            if ($btnAll.hasClass("wi3bit-action-disabled")) return;
                            $optionsContainer
                                .find('input[type="checkbox"]:visible')
                                .prop("checked", true);
                            updateUI();
                            let tooltip = bootstrap.Tooltip.getInstance(this);
                            if (tooltip) tooltip.hide();
                        });
                    }
                    if (settings.showClearAll) {
                        $btnClear = $(
                            '<span class="p-2" data-bs-toggle="tooltip" data-bs-placement="top" title="Clear All"><i class="fa-solid fa-xmark wi3bit-cursor-pointer wi3bit-text-hover-danger"></i></span>',
                        );
                        $actionsWrapper.append($btnClear);
                        new bootstrap.Tooltip($btnClear[0]);
                        $btnClear.on("click", function () {
                            if ($btnClear.hasClass("wi3bit-action-disabled")) return;
                            $optionsContainer
                                .find('input[type="checkbox"]:visible')
                                .prop("checked", false);
                            updateUI();
                            let tooltip = bootstrap.Tooltip.getInstance(this);
                            if (tooltip) tooltip.hide();
                        });
                    }
                    if (settings.showReset) {
                        $btnReset = $(
                            '<span class="p-2" data-bs-toggle="tooltip" data-bs-placement="top" title="Reset to Default"><i class="fa-solid fa-arrow-rotate-left wi3bit-cursor-pointer wi3bit-text-hover-primary"></i></span>',
                        );
                        $actionsWrapper.append($btnReset);
                        new bootstrap.Tooltip($btnReset[0]);
                        $btnReset.on("click", function () {
                            if ($btnReset.hasClass("wi3bit-action-disabled")) return;
                            $optionsContainer
                                .find(".select-checkbox:visible")
                                .each(function () {
                                    let isDefault =
                                        defaultSelectedValues.includes(
                                            $(this).val(),
                                        );
                                    $(this).prop("checked", isDefault);
                                });
                            updateUI();
                            let tooltip = bootstrap.Tooltip.getInstance(this);
                            if (tooltip) tooltip.hide();
                        });
                    }

                    $btnGroup.append($actionsWrapper);
                }

                $dropdown.append($btnGroup);
            }

            // Initialize tooltip for truncated select options display
            let displayTooltip = new bootstrap.Tooltip($display[0], {
                title: function () {
                    return $selectedText.text();
                },
                trigger: "hover",
                placement: "top",
            });

            $display.on("show.bs.tooltip", function (e) {
                let el = $selectedText[0];
                let isDropdownOpen = $dropdown.hasClass("show");
                if (
                    isDropdownOpen ||
                    $selectedText.is(":hidden") ||
                    el.scrollWidth <= el.clientWidth
                ) {
                    e.preventDefault();
                }
            });

            if (totalOptions === 0) {
                $notFound.text("No options available").show();
            }

            if (settings.nestedGroups) {
                let hierarchy = {};
                let hasSubgroups = false;

                // 1. Build hierarchy object
                $originalSelect.find("option").each(function () {
                    let valAttr = $(this).attr("value");
                    if (
                        valAttr === undefined ||
                        valAttr === null ||
                        valAttr === ""
                    ) {
                        return;
                    }
                    let gId = $(this).data("group-id") || "root";
                    let gName = $(this).data("group-name") || "Other";
                    let sgId = $(this).data("subgroup-id") || "root_sub";
                    let sgName = $(this).data("subgroup-name") || "";

                    if ($(this).data("subgroup-id")) {
                        hasSubgroups = true;
                    }

                    if (!hierarchy[gId]) {
                        hierarchy[gId] = { name: gName, subgroups: {} };
                    }
                    if (!hierarchy[gId].subgroups[sgId]) {
                        hierarchy[gId].subgroups[sgId] = {
                            name: sgName,
                            options: [],
                        };
                    }

                    hierarchy[gId].subgroups[sgId].options.push($(this));
                });

                if (!hasSubgroups) {
                    $optionsContainer.addClass("wi3bit-flat-groups");
                }

                // 2. Render Tree HTML
                for (let gId in hierarchy) {
                    let gData = hierarchy[gId];
                    let safeGId = gId.replace(/[^a-zA-Z0-9_-]/g, "_");
                    let chkG1Id =
                        "grp1_" + Math.random().toString(36).substr(2, 9);

                    let $groupWrapper = $(
                        '<div class="wi3bit-group-wrapper mb-2"></div>',
                    );

                    let $groupHeader = $(`
                        <div class="dropdown-header wi3bit-group-header px-2 py-2 d-flex align-items-center">
                            <div class="form-check m-0">
                                <input class="form-check-input group-1-checkbox" type="checkbox" id="${chkG1Id}" data-g1-id="${safeGId}">
                                <label class="form-check-label w-100 fw-bold" for="${chkG1Id}" style="cursor:pointer;">${gData.name}</label>
                            </div>
                        </div>
                    `);
                    $groupWrapper.append($groupHeader);

                    // Subgroups container (creates the vertical line)
                    let $subgroupsContainer = $(
                        '<div class="wi3bit-tree-children"></div>',
                    );

                    for (let sgId in gData.subgroups) {
                        let sgData = gData.subgroups[sgId];
                        let safeSgId = sgId.replace(/[^a-zA-Z0-9_-]/g, "_");

                        let $subgroupWrapper = $(
                            '<div class="wi3bit-subgroup-wrapper wi3bit-tree-node"></div>',
                        );
                        let $optionsListContainer = $subgroupWrapper;

                        if (sgData.name) {
                            let chkG2Id =
                                "grp2_" +
                                Math.random().toString(36).substr(2, 9);
                            let $subgroupHeader = $(`
                                <div class="dropdown-header wi3bit-subgroup-header px-2 py-2">
                                    <div class="form-check m-0">
                                        <input class="form-check-input group-2-checkbox" type="checkbox" id="${chkG2Id}" data-g2-id="${safeSgId}" data-g1-parent="${safeGId}">
                                        <label class="form-check-label w-100 fw-bold" for="${chkG2Id}" style="cursor:pointer;">
                                            ${sgData.name}
                                        </label>
                                    </div>
                                </div>
                            `);
                            $subgroupWrapper.append($subgroupHeader);

                            $optionsListContainer = $(
                                '<div class="wi3bit-tree-children"></div>',
                            );
                            $subgroupWrapper.append($optionsListContainer);
                        } else {
                            $subgroupWrapper.removeClass("wi3bit-tree-node");
                        }

                        sgData.options.forEach(function ($optTag) {
                            let val = $optTag.val();
                            let text = $optTag.text();
                            let isChecked = $optTag.is(":selected")
                                ? "checked"
                                : "";
                            let uid =
                                "opt_" +
                                Math.random().toString(36).substr(2, 9);

                            let $opt = $(`
                                <div class="wi3bit-select-option py-2 px-2 m-0 wi3bit-tree-node">
                                    <div class="form-check m-0">
                                        <input class="form-check-input select-checkbox" type="checkbox" value="${val}" id="${uid}" data-g1-parent="${safeGId}" data-g2-parent="${safeSgId}" ${isChecked}>
                                        <label class="form-check-label w-100" for="${uid}" style="cursor:pointer;">${text}</label>
                                    </div>
                                </div>
                            `);
                            $optionsListContainer.append($opt);
                        });

                        $subgroupsContainer.append($subgroupWrapper);
                    }

                    $groupWrapper.append($subgroupsContainer);
                    $optionsContainer.append($groupWrapper);
                }
            } else {
                $originalSelect.find("option").each(function () {
                    let valAttr = $(this).attr("value");
                    if (
                        valAttr === undefined ||
                        valAttr === null ||
                        valAttr === ""
                    ) {
                        return;
                    }
                    let val = $(this).val();
                    let text = $(this).text();
                    let isChecked = $(this).is(":selected") ? "checked" : "";
                    let uid = "opt_" + Math.random().toString(36).substr(2, 9);

                    let $opt = $(`
                        <div class="wi3bit-select-option mb-1 py-2 px-2 m-0">
                            <div class="form-check m-0 ms-1">
                                <input class="form-check-input select-checkbox" type="checkbox" value="${val}" id="${uid}" ${isChecked}>
                                <label class="form-check-label w-100" for="${uid}" style="cursor:pointer;">${text}</label>
                            </div>
                        </div>
                    `);
                    $optionsContainer.append($opt);
                });
            }

            $dropdown.append($optionsContainer);
            $dropdown.append($notFound);

            $display.append($placeholder, $selectedText, $countBadge, $chevron);
            $wrapper.append($display, $dropdown);
            $originalSelect.after($wrapper);

            $originalSelect.data("wi3bit-multi-select-wrapper", $wrapper);

            function syncChainUp() {
                if (!settings.nestedGroups) return;

                let $allSelectCheckboxes =
                    $optionsContainer.find(".select-checkbox");

                $optionsContainer.find(".group-2-checkbox").each(function () {
                    let sgId = $(this).data("g2-id");
                    let $children = $allSelectCheckboxes.filter(
                        `[data-g2-parent="${sgId}"]`,
                    );
                    if ($children.length > 0) {
                        let checkedCount = $children.filter(":checked").length;
                        let allChecked = checkedCount === $children.length;
                        let noneChecked = checkedCount === 0;

                        $(this).prop("checked", allChecked);
                        $(this).prop(
                            "indeterminate",
                            !allChecked && !noneChecked,
                        );
                    }
                });

                $optionsContainer.find(".group-1-checkbox").each(function () {
                    let gId = $(this).data("g1-id");
                    let $children = $allSelectCheckboxes.filter(
                        `[data-g1-parent="${gId}"]`,
                    );
                    if ($children.length > 0) {
                        let checkedCount = $children.filter(":checked").length;
                        let allChecked = checkedCount === $children.length;
                        let noneChecked = checkedCount === 0;

                        $(this).prop("checked", allChecked);
                        $(this).prop(
                            "indeterminate",
                            !allChecked && !noneChecked,
                        );
                    }
                });
            }

            function syncChainForOption($optionCheckbox) {
                let g2Id = $optionCheckbox.data("g2-parent");
                let g1Id = $optionCheckbox.data("g1-parent");

                if (g2Id) {
                    let $g2Checkbox = $optionsContainer.find(
                        `.group-2-checkbox[data-g2-id="${g2Id}"]`,
                    );
                    let $siblings = $optionsContainer.find(
                        `.select-checkbox[data-g2-parent="${g2Id}"]`,
                    );
                    let checkedCount = $siblings.filter(":checked").length;
                    let allChecked = checkedCount === $siblings.length;
                    let noneChecked = checkedCount === 0;
                    $g2Checkbox
                        .prop("checked", allChecked)
                        .prop("indeterminate", !allChecked && !noneChecked);
                }

                if (g1Id) {
                    let $g1Checkbox = $optionsContainer.find(
                        `.group-1-checkbox[data-g1-id="${g1Id}"]`,
                    );
                    let $siblings = $optionsContainer.find(
                        `.select-checkbox[data-g1-parent="${g1Id}"]`,
                    );
                    let checkedCount = $siblings.filter(":checked").length;
                    let allChecked = checkedCount === $siblings.length;
                    let noneChecked = checkedCount === 0;
                    $g1Checkbox
                        .prop("checked", allChecked)
                        .prop("indeterminate", !allChecked && !noneChecked);
                }
            }

            function syncChainForGroup2($g2Checkbox) {
                let g1Id = $g2Checkbox.data("g1-parent");
                if (g1Id) {
                    let $g1Checkbox = $optionsContainer.find(
                        `.group-1-checkbox[data-g1-id="${g1Id}"]`,
                    );
                    let $siblings = $optionsContainer.find(
                        `.select-checkbox[data-g1-parent="${g1Id}"]`,
                    );
                    let checkedCount = $siblings.filter(":checked").length;
                    let allChecked = checkedCount === $siblings.length;
                    let noneChecked = checkedCount === 0;
                    $g1Checkbox
                        .prop("checked", allChecked)
                        .prop("indeterminate", !allChecked && !noneChecked);
                }
            }

            function getSmartSelectedText() {
                if (!settings.nestedGroups) {
                    let selectedTexts = [];
                    $optionsContainer
                        .find(".select-checkbox:checked")
                        .each(function () {
                            selectedTexts.push(
                                $(this).siblings("label").text().trim(),
                            );
                        });
                    return selectedTexts.join(", ");
                }

                let summaryItems = [];

                $optionsContainer
                    .find(".wi3bit-group-wrapper")
                    .each(function () {
                        let $g1Checkbox = $(this)
                            .find(".group-1-checkbox")
                            .first();
                        let g1Name = $g1Checkbox
                            .siblings("label")
                            .text()
                            .trim();

                        if (
                            $g1Checkbox.length &&
                            $g1Checkbox.prop("checked") &&
                            !$g1Checkbox.prop("indeterminate")
                        ) {
                            summaryItems.push(g1Name);
                        } else {
                            let $subgroupContainers = $(this).find(
                                ".wi3bit-subgroup-wrapper",
                            );

                            if ($subgroupContainers.length > 0) {
                                $subgroupContainers.each(function () {
                                    let $g2Checkbox = $(this)
                                        .find(".group-2-checkbox")
                                        .first();

                                    if ($g2Checkbox.length) {
                                        let g2Name = $g2Checkbox
                                            .siblings("label")
                                            .text()
                                            .trim();
                                        if (
                                            $g2Checkbox.prop("checked") &&
                                            !$g2Checkbox.prop("indeterminate")
                                        ) {
                                            summaryItems.push(g2Name);
                                        } else {
                                            $(this)
                                                .find(
                                                    ".select-checkbox:checked",
                                                )
                                                .each(function () {
                                                    summaryItems.push(
                                                        $(this)
                                                            .siblings("label")
                                                            .text()
                                                            .trim(),
                                                    );
                                                });
                                        }
                                    } else {
                                        $(this)
                                            .find(".select-checkbox:checked")
                                            .each(function () {
                                                summaryItems.push(
                                                    $(this)
                                                        .siblings("label")
                                                        .text()
                                                        .trim(),
                                                );
                                            });
                                    }
                                });
                            } else {
                                $(this)
                                    .find(".select-checkbox:checked")
                                    .each(function () {
                                        summaryItems.push(
                                            $(this)
                                                .siblings("label")
                                                .text()
                                                .trim(),
                                        );
                                    });
                            }
                        }
                    });

                return summaryItems.join(", ");
            }

            function updateHeaderButtons() {
                let query = "";
                if (settings.showSearch && $searchContainer) {
                    query = $searchContainer.find(".wi3bit-search-input").val().toLowerCase().trim();
                }

                let $visibleCheckboxes;
                if (query === "") {
                    $visibleCheckboxes = $optionsContainer.find(".select-checkbox");
                } else {
                    $visibleCheckboxes = $optionsContainer.find(".select-checkbox:visible");
                }

                let visibleTotal = $visibleCheckboxes.length;
                let visibleChecked = $visibleCheckboxes.filter(":checked").length;

                if ($btnAll) {
                    if (visibleTotal === 0 || visibleChecked === visibleTotal) {
                        $btnAll.addClass("wi3bit-action-disabled");
                        let tooltip = bootstrap.Tooltip.getInstance($btnAll[0]);
                        if (tooltip) tooltip.hide();
                    } else {
                        $btnAll.removeClass("wi3bit-action-disabled");
                    }
                }

                if ($btnClear) {
                    if (visibleTotal === 0 || visibleChecked === 0) {
                        $btnClear.addClass("wi3bit-action-disabled");
                        let tooltip = bootstrap.Tooltip.getInstance($btnClear[0]);
                        if (tooltip) tooltip.hide();
                    } else {
                        $btnClear.removeClass("wi3bit-action-disabled");
                    }
                }

                if ($btnReset) {
                    let isResetDisabled = true;
                    $visibleCheckboxes.each(function () {
                        let isChecked = $(this).prop("checked");
                        let isDefault = defaultSelectedValues.includes($(this).val());
                        if (isChecked !== isDefault) {
                            isResetDisabled = false;
                            return false;
                        }
                    });
                    if (isResetDisabled) {
                        $btnReset.addClass("wi3bit-action-disabled");
                        let tooltip = bootstrap.Tooltip.getInstance($btnReset[0]);
                        if (tooltip) tooltip.hide();
                    } else {
                        $btnReset.removeClass("wi3bit-action-disabled");
                    }
                }
            }

            function updateUI($changedElem) {
                let checkedCount = 0;
                let selectedValues = [];
                $optionsContainer
                    .find(".select-checkbox:checked")
                    .each(function () {
                        checkedCount++;
                        selectedValues.push($(this).val());
                    });
                $originalSelect.val(selectedValues).trigger("change");

                if ($changedElem && settings.nestedGroups) {
                    if ($changedElem.hasClass("select-checkbox")) {
                        syncChainForOption($changedElem);
                    } else if ($changedElem.hasClass("group-2-checkbox")) {
                        syncChainForGroup2($changedElem);
                    }
                } else {
                    syncChainUp();
                }

                let $btnAllIcon = $wrapper.find(".fa-check-double");
                if ($btnAllIcon.length) {
                    if (checkedCount === totalOptions && totalOptions > 0) {
                        $btnAllIcon.addClass("text-primary");
                    } else {
                        $btnAllIcon.removeClass("text-primary");
                    }
                }

                if (checkedCount > 0) {
                    $placeholder.hide();
                    let smartText = getSmartSelectedText();
                    $selectedText.text(smartText).show();
                    $countBadge.text(checkedCount).show();
                } else {
                    $placeholder.show();
                    $selectedText.hide();
                    $countBadge.hide();
                }

                updateHeaderButtons();
            }

            updateUI();

            $display.on("click", function () {
                $dropdown.toggleClass("show");
                displayTooltip.hide();
                if (
                    $dropdown.hasClass("show") &&
                    settings.showSearch &&
                    $searchContainer
                ) {
                    setTimeout(function () {
                        $searchContainer.find(".wi3bit-search-input").focus();
                    }, 50);
                }
            });

            let docClickEvent =
                "click.wi3bit-" + Math.random().toString(36).substr(2, 9);
            $(document).on(docClickEvent, function (e) {
                if (
                    !$wrapper.is(e.target) &&
                    $wrapper.has(e.target).length === 0
                )
                    $dropdown.removeClass("show");
            });
            $originalSelect.data("wi3bit-multi-select-event", docClickEvent);

            $optionsContainer.on(
                "click",
                ".wi3bit-group-header, .wi3bit-subgroup-header, .wi3bit-select-option",
                function (e) {
                    if (
                        $(e.target).is('input[type="checkbox"]') ||
                        $(e.target).is("label")
                    ) {
                        return;
                    }
                    let $checkbox = $(this)
                        .find('input[type="checkbox"]')
                        .first();
                    if ($checkbox.length) {
                        $checkbox
                            .prop("checked", !$checkbox.prop("checked"))
                            .trigger("change");
                    }
                },
            );

            $optionsContainer.on("change", ".select-checkbox", function () {
                updateUI($(this));
            });

            $optionsContainer.on("change", ".group-2-checkbox", function () {
                let isChecked = $(this).prop("checked");
                $optionsContainer
                    .find(
                        `.select-checkbox[data-g2-parent="${$(this).data("g2-id")}"]`,
                    )
                    .prop("checked", isChecked);
                updateUI($(this));
            });

            $optionsContainer.on("change", ".group-1-checkbox", function () {
                let isChecked = $(this).prop("checked");
                let gId = $(this).data("g1-id");
                $optionsContainer
                    .find(`.group-2-checkbox[data-g1-parent="${gId}"]`)
                    .prop("checked", isChecked);
                $optionsContainer
                    .find(`.select-checkbox[data-g1-parent="${gId}"]`)
                    .prop("checked", isChecked);
                updateUI();
            });
        });
    };
})(jQuery);
