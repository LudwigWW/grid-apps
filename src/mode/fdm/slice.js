/** Copyright Stewart Allen <sa@grid.space> -- All Rights Reserved */

"use strict";

(function() {

    const KIRI = self.kiri,
        BASE = self.base,
        DBUG = BASE.debug,
        POLY = BASE.polygons,
        UTIL = BASE.util,
        CONF = BASE.config,
        FDM = KIRI.driver.FDM,
        SLICER = KIRI.slicer,
        fillArea = POLY.fillArea,
        newPoint = BASE.newPoint,
        newSlice = KIRI.newSlice,
        FILL = KIRI.fill,
        FILLFIXED = KIRI.fill_fixed,
        COLOR = {
            shell: { check: 0x0077bb, face: 0x0077bb, line: 0x0077bb, opacity: 1 },
            fill: { check: 0x00bb77, face: 0x00bb77, line: 0x00bb77, opacity: 1 },
            infill: { check: 0x3322bb, face: 0x3322bb, line: 0x3322bb, opacity: 1 },
            support: { check: 0xaa5533, face: 0xaa5533, line: 0xaa5533, opacity: 1 }
        },
        PROTO = Object.clone(COLOR),
        bwcomp = (1 / Math.cos(Math.PI/4));

    let isThin = false; // force line rendering
    let isFlat = false; // force flat rendering
    let offset = 0; // poly line generation offsets

    function vopt(opt) {
        if (opt) {
            if (isFlat) {
                opt.flat = true;
                opt.outline = true;
                return opt
            }
            if (isThin) return null;
        }
        return opt;
    }

    /**
     * DRIVER SLICE CONTRACT
     *
     * Given a widget and settings object, call functions necessary to produce
     * slices and then the computations using those slices. This function is
     * designed to run client or server-side and provides all output via
     * callback functions.
     *
     * @param {Object} settings
     * @param {Widget} Widget
     * @param {Function} onupdate (called with % complete and optional message)
     * @param {Function} ondone (called when complete with an array of Slice objects)
     */
    FDM.slice = function(settings, widget, onupdate, ondone) {
        FDM.fixExtruders(settings);
        let render = settings.render !== false,
            spro = settings.process,
            sdev = settings.device,
            isBelt = sdev.bedBelt,
            isSynth = widget.track.synth,
            update_start = Date.now(),
            minSolid = spro.sliceSolidMinArea,
            solidLayers = spro.sliceSolidLayers,
            vaseMode = spro.sliceFillType === 'vase' && !isSynth,
            doSolidLayers = solidLayers && !vaseMode && !isSynth,
            doSparseFill = !vaseMode && spro.sliceFillSparse > 0.0,
            metadata = settings.widget[widget.id] || {},
            extruder = metadata.extruder || 0,
            sliceHeight = spro.sliceHeight,
            firstSliceHeight = isBelt ? sliceHeight : spro.firstSliceHeight,
            nozzleSize = sdev.extruders[extruder].extNozzle,
            lineWidth = nozzleSize,
            fillOffsetMult = 1.0 - bound(spro.sliceFillOverlap, 0, 0.8),
            firstWidthMult = spro.firstLayerShellMult || 1,
            shellOffset = lineWidth,
            fillSpacing = lineWidth,
            fillOffset = lineWidth * fillOffsetMult,
            sliceFillAngle = spro.sliceFillAngle,
            supportDensity = spro.sliceSupportDensity,
            view = widget.mesh && widget.mesh.newGroup ? widget.mesh.newGroup() : null;

        isFlat = settings.controller.lineType === "flat";
        isThin = !isFlat && settings.controller.lineType === "line";
        offset = lineWidth / 2;


        function parseSVGFromText(svg_text, offset) {
            // TODO: Fix ugly SVG import specifically from polyline text
            let points_start = svg_text.search('<polyline points="') + '<polyline points="'.length;
            let points_end = svg_text.search('" style="');
            let points_text = svg_text.substring(points_start, points_end);
            let point_numbers = points_text.split(" ");

            let points_array = [];
            for (let x_point_index = 2; x_point_index < point_numbers.length; x_point_index = x_point_index + 2) {
                if (offset) {
                    let offset_x = (parseFloat(point_numbers[x_point_index]) / 2.54) + offset.x;
                    let offset_y = (parseFloat(point_numbers[x_point_index+1]) / 2.54) + offset.y;
                    let one_svg_point = newPoint(offset_x, offset_y, 0.0);
                    points_array.push(one_svg_point);
                }
                else {
                    points_array.push(newPoint(parseFloat(point_numbers[x_point_index])/2.54,  parseFloat(point_numbers[x_point_index+1])/2.54, 0.0));
                }
            }


            return points_array;
        }
        // LWW TODO: Make array with promises for each SVG in source folder

        let loadedData = fetch('/obj/Surrogate_Option_Plate8.svg')
            .then(response => response.text())
            .then(data => {
                return data;
            });

        Promise.all([loadedData]).then((val) => {
            const offset = {
                x: origin.x,
                y: -origin.y,
                z: origin.z
            };
            //const output = KIRI.newPrint().parseSVG(val[0], offset);
            let output = parseSVGFromText(val[0]);
            console.log({svg_out:output});
        

            if (isFlat) {
                Object.values(COLOR).forEach(color => {
                    color.flat = true;
                    color.line = 1
                    color.opacity = 0.5;
                });
            } else {
                Object.keys(COLOR).forEach(key => {
                    const color = COLOR[key];
                    const proto = PROTO[key]
                    color.flat = proto.flat;
                    color.line = proto.line;
                    color.opacity = proto.opacity;
                });
            }

            if (!(sliceHeight > 0 && sliceHeight < 100)) {
                return ondone("invalid slice height");
            }
            if (!(nozzleSize >= 0.01 && nozzleSize < 100)) {
                return ondone("invalid nozzle size");
            }

            if (firstSliceHeight === 0) {
                firstSliceHeight = sliceHeight;
            }

            const sliceMinHeight = spro.sliceAdaptive && spro.sliceMinHeight > 0 ?
                Math.min(spro.sliceMinHeight, sliceHeight) : 0;

            if (firstSliceHeight < sliceHeight) {
                DBUG.log("invalid first layer height < slice height");
                DBUG.log("reverting to min valid slice height");
                firstSliceHeight = sliceMinHeight || sliceHeight;
            }

            // const slicer = new KIRI.slicer2(widget.getPoints(), { });
            // const levels = slicer.interval(sliceHeight, {
            //     zlist: true,
            //     zline: true,
            //     boff: spro.firstSliceHeight || spro.sliceHeight
            // });
            // const slices = [];
            // let last;
            // slicer.slice(levels, { genso: true, each: (data, idx, tot, time) => {
            //     const slice = data.slice;
            //     if (last) {
            //         slice.down = last;
            //         last.up = slice;
            //     }
            //     last = slice;
            //     slice.index = idx;
            //     slice.height = spro.firstSliceHeight || spro.sliceHeight;
            //     slices.push(slice);
            //     onupdate((idx / tot) * 0.5);
            // } });
            // onSliceDone(slices);

            SLICER.sliceWidget(widget, {
                height: sliceHeight,
                minHeight: sliceMinHeight,
                firstHeight: firstSliceHeight,
                // debug: true,
                // xray: 3,
                // view: view
            }, onSliceDone, onSliceUpdate);

            function onSliceUpdate(update) {
                return onupdate(0.0 + update * 0.5);
            }

            function onSliceDone(slices) {
                // remove all empty slices above part but leave below
                // for multi-part (multi-extruder) setups where the void is ok
                // also reverse because slicing occurs bottom-up
                let found = false;
                slices = slices.reverse().filter(slice => {
                    if (slice.tops.length) {
                        return found = true;
                    } else {
                        return found;
                    }
                }).reverse();

                widget.slices = slices;

                console.log({all_slices:slices});

                if (!slices) {
                    return;
                }

                // for synth support widgets, merge tops
                if (isSynth) {
                    for (let slice of slices) {
                        // union top support polys
                        let tops = slice.topPolys();
                        let union = POLY.union(tops, null, true);
                        if (union.length < tops.length) {
                            slice.tops = [];
                            for (let u of union) {
                                slice.addTop(u);
                            }
                        }
                        let gap = sliceHeight * spro.sliceSupportGap
                        // clip tops to other widgets in group
                        tops = slice.topPolys();
                        for (let peer of widget.group) {
                            if (peer === widget) {
                                continue;
                            }
                            for (let pslice of peer.slices) {
                                if (Math.abs(pslice.z - slice.z) > gap) {
                                    continue;
                                }
                                // offset pslice tops by spro.sliceSupportOffset
                                if (!pslice.synth_off) {
                                    pslice.synth_off = POLY.offset(pslice.topPolys(), nozzleSize/2 + spro.sliceSupportOffset);
                                }
                                let ptops = pslice.synth_off;
                                let ntops = [];
                                POLY.subtract(tops, ptops, ntops, null, slice.z, 0);
                                tops = ntops;
                            }
                        }
                        slice.tops = [];
                        for (let t of tops) {
                            slice.addTop(t);
                        }
                    }
                }

                // calculate % complete and call onupdate()
                function doupdate(index, from, to, msg) {
                    onupdate(0.5 + (from + ((index/slices.length) * (to-from))) * 0.5, msg);
                }

                // for each slice, performe a function and call doupdate()
                function forSlices(from, to, fn, msg, leave_one_out) {
                    slices.forEach(slice => {
                        fn(slice);
                        doupdate(slice.index, from, to, msg)
                    });
                }

                // do not hint polygin fill longer than a max span length
                CONF.hint_len_max = UTIL.sqr(spro.sliceBridgeMax);

                // reset for solids, support projections
                // and other annotations
                slices.forEach(slice => {
                    slice.widget = widget;
                    slice.extruder = extruder;
                    slice.solids = [];
                });

                // create shadow for clipping supports
                let shadow = null;
                if (true || spro.sliceSupportEnable) {
                    let alltops = slices.map(slice => slice.topPolys()).flat();
                    shadow = POLY.union(alltops,null,0.1);
                    if (spro.sliceSupportExtra) {
                        shadow = POLY.offset(shadow, spro.sliceSupportExtra);
                    }
                    // slices[0].output()
                    //     .setLayer('shadow', { line: 0xff0000, check: 0xff0000 })
                    //     .addPolys(shadow);
                }

                // create shells and diff inner fillable areas
                forSlices(0.0, 0.2, slice => {
                    let first = slice.index === 0;
                    let solid = (
                        slice.index < spro.sliceBottomLayers ||
                        slice.index > slices.length - spro.sliceTopLayers-1 ||
                        spro.sliceFillSparse > 0.95
                    ) && !vaseMode && !isSynth;
                    let spaceMult = first ? spro.firstLayerLineMult || 1 : 1;
                    let offset = shellOffset * spaceMult;
                    let fillOff = fillOffset * spaceMult;
                    let count = isSynth ? 1 : spro.sliceShells;
                    doShells(slice, count, offset, fillOff, {
                        vase: vaseMode,
                        thin: spro.detectThinWalls && !isSynth,
                        belt0: isBelt && first,
                        widget: widget
                    });
                    if (solid) {
                        let fillSpace = fillSpacing * spaceMult;
                        doSolidLayerFill(slice, fillSpace, sliceFillAngle);
                    }
                    sliceFillAngle += 90.0;
                }, "offsets");

                // calculations only relevant when solid layers are used
                if (doSolidLayers) {
                    forSlices(0.2, 0.34, slice => {
                        if (slice.index > 0) doDiff(slice, minSolid);
                    }, "diff");
                    forSlices(0.34, 0.35, slice => {
                        projectFlats(slice, solidLayers);
                        projectBridges(slice, solidLayers);
                    }, "solids");
                    forSlices(0.35, 0.5, slice => {
                        let first = slice.index === 0;
                        let spaceMult = first ? spro.firstLayerLineMult || 1 : 1;
                        let fillSpace = fillSpacing * spaceMult;
                        doSolidsFill(slice, fillSpace, sliceFillAngle, minSolid);
                        sliceFillAngle += 90.0;
                    }, "solids");
                }

                // sparse layers only present when non-vase mose and sparse % > 0
                if (doSparseFill && !isSynth) {
                    forSlices(0.5, 0.7, slice => {
                        doSparseLayerFill(slice, {
                            settings: settings,
                            process: spro,
                            device: sdev,
                            lineWidth: lineWidth,
                            spacing: fillOffset,
                            density: spro.sliceFillSparse,
                            bounds: widget.getBoundingBox(),
                            height: sliceHeight,
                            type: spro.sliceFillType
                        });
                    }, "infill");
                } else if (isSynth && supportDensity) {
                    forSlices(0.5, 0.7, slice => {
                        for (let top of slice.tops) {
                            let offset = [];
                            POLY.expand(top.shells, -nozzleSize/4, slice.z, offset);
                            fillSupportPolys(offset, lineWidth, supportDensity, slice.z);
                            top.fill_lines = offset.map(o => o.fill).flat().filter(v => v);
                        }
                    }, "infill");
                }

                // belt supports are their own thing
                if (!isBelt && !isSynth && supportDensity && spro.sliceSupportEnable) {
                    let all_slices_new = [];
                    console.log({slices_starting_support:slices});
                    forSlices(0.7, 0.71, slice => {
                        let check_slices = doSupport(slice, spro, shadow, settings, view, 0);
                        //console.log({all_slices_new:check_slices});
                        if (check_slices) {
                            if (check_slices.length > all_slices_new.length) {
                                all_slices_new = check_slices;
                            }
                        }
                    }, "support");
                    
                    // LWW TODO: Possibly do this later
                    //slices = all_slices_new;
                    //widget.slices = slices;
                    
                    let highest_slice = slices[slices.length-1];
                    doupdate(0, 0.71, 0.8, "surrogating");
                    console.log({status:"doing surrogates"});
                    console.log({loadedDatanow:loadedData});
                    let surrogated_slices = doSurrogates(highest_slice, spro, shadow, settings, view, [{geometry_points:output, name:"optionPlate1", extension_range:100}]);
                    widget.slices = surrogated_slices;
                    doupdate(highest_slice.index-1, 0.71, 0.8, "surrogating");
                    

                    // forSlices(0.8, 0.9, slice => {
                    //     doSupportFill(slice, lineWidth, supportDensity, spro.sliceSupportArea);
                    // }, "support_infill");
                }

                // render if not explicitly disabled
                if (render) {
                    forSlices(0.9, 1.0, slice => {
                        doRender(slice, isSynth);
                    }, "render");
                }

                if (isBelt) {
                    let bounds = BASE.newBounds();
                    for (let top of slices[0].tops) {
                        bounds.merge(top.poly.bounds);
                    }
                    widget.belt.miny = -bounds.miny;
                    widget.belt.midy = (bounds.miny + bounds.maxy) / 2;
                }

                console.log({all_slices_finished:slices});
                // report slicing complete
                ondone();
            }

        })

    }

    function bound(v,min,max) {
        return Math.max(min,Math.min(max,v));
    }

    function doRender(slice, isSynth) {
        const output = slice.output();
        const height = slice.height / 2;

        slice.tops.forEach(top => {
            if (isThin) {
                output
                    .setLayer('slice', { line: 0x000066, check: 0x000066 })
                    .addPolys(top.poly);
            }

            output
                .setLayer("shells", isSynth ? COLOR.support : COLOR.shell)
                .addPolys(top.shells, vopt({ offset, height }));

            // if (isThin && debug) {
            //     slice.output()
            //         .setLayer('offset', { face: 0, line: 0x888888 })
            //         .addPolys(top.fill_off)
            //         .setLayer('last', { face: 0, line: 0x008888 })
            //         .addPolys(top.last);
            // }

            if (top.fill_lines && top.fill_lines.length) output
                .setLayer("fill", isSynth ? COLOR.support : COLOR.fill)
                .addLines(top.fill_lines, vopt({ offset, height }));

            if (top.fill_sparse) output
                .setLayer("infill", COLOR.infill)
                .addPolys(top.fill_sparse, vopt({ offset, height, outline: true }))

            if (top.thin_fill) output
                .setLayer("fill", COLOR.fill)
                .addLines(top.thin_fill, vopt({ offset, height }));

            // emit solid areas
            // if (isThin && debug) {
            //     output
            //         .setLayer("solids", { face: 0x00dd00 })
            //         .addAreas(slice.solids);
            // }
        });

        if (slice.supports) output
            .setLayer("support", COLOR.support)
            .addPolys(slice.supports, vopt({ offset, height }));

        if (slice.supports) slice.supports.forEach(poly => {
            if (poly.fill) output
                .setLayer("support", COLOR.support)
                .addLines(poly.fill, vopt({ offset, height }));
        });

        // if (isThin && debug) {
        //     output
        //         .setLayer("bridges", { face: 0x00aaaa, line: 0x00aaaa })
        //         .addAreas(top.bridges);
        //
        //     output
        //         .setLayer("flats", { face: 0xaa00aa, line: 0xaa00aa })
        //         .addAreas(top.flats);
        // }

        // console.log(slice.index, slice.render.stats);
    }

    // shared with SLA driver
    FDM.share = {
        doShells,
        doDiff,
        projectFlats,
        projectBridges,
        doSolidsFill
    };

    /**
     * Compute offset shell polygons. For FDM, the first offset is usually half
     * of the nozzle width.  Each subsequent offset is a full nozzle width.  User
     * parameters control tweaks to these numbers to allow for better shell bonding.
     * The last shell generated is a "fillOffset" shell.  Fill lines are clipped to
     * this polygon.  Adjusting fillOffset controls bonding of infill to the shells.
     *
     * @param {number} count
     * @param {number} offsetN
     * @param {number} fillOffset
     * @param {Obejct} options
     */
    function doShells(slice, count, offsetN, fillOffset, opt = {}) {
        let offset1 = offsetN / 2;
        let shellout = 0;

        slice.tops.forEach(function(top) {
            let top_poly = [ top.poly ];

            if (slice.index === 0) {
                // console.log({slice_top_0: top_poly, count});
                // segment polygon
            }

            if (opt.vase) {
                // remove top poly inners in vase mode
                top.poly = top.poly.clone(false);
            }

            top.shells = [];
            top.fill_off = [];
            top.fill_lines = [];

            let last = [],
                gaps = [],
                z = top.poly.getZ();

            if (count) {
                // permit offset of 0 for laser and drag knife
                if (offset1 === 0 && count === 1) {
                    last = top_poly.clone(true);
                    top.shells = last;
                } else {
                    // heal top open polygons if the ends are close (benchy tilt test)
                    top_poly.forEach(p => { if (p.open) {
                        let dist = p.first().distTo2D(p.last());
                        if (dist < 1) p.open = false;
                    } });
                    if (opt.thin) {
                        top.thin_fill = [];
                        let oso = {z, count, gaps: [], outs: [], minArea: 0.05};
                        POLY.offset(top_poly, [-offset1, -offsetN], oso);

                        oso.outs.forEach((polys, i) => {
                            polys.forEach(p => {
                                p.depth = i;
                                if (p.fill_off) {
                                    p.fill_off.forEach(pi => pi.depth = i);
                                }
                                top.shells.push(p);
                            });
                            last = polys;
                        });

                        // slice.solids.trimmed = slice.solids.trimmed || [];
                        oso.gaps.forEach((polys, i) => {
                            let off = (i == 0 ? offset1 : offsetN);
                            polys = POLY.offset(polys, -off * 0.8, {z, minArea: 0});
                            // polys.forEach(p => { slice.solids.trimmed.push(p); });
                            top.thin_fill.appendAll(cullIntersections(
                                fillArea(polys, 45, off/2, [], 0.01, off*2),
                                fillArea(polys, 135, off/2, [], 0.01, off*2),
                                // fillArea(polys, 90, off, [], 0.05, off*4),
                                // fillArea(polys, 180, off, [], 0.05, off*4),
                            ));
                            gaps = polys;
                        });
                    } else {
                        // standard wall offsetting strategy
                        POLY.expand(
                            top_poly,   // reference polygon(s)
                            -offset1,   // first inset distance
                            z,          // set new polys to this z
                            top.shells, // accumulator array
                            count,      // number of insets to perform
                            -offsetN,   // subsequent inset distance
                            // on each new offset trace ...
                            function(polys, countNow) {
                                last = polys;
                                // mark each poly with depth (offset #) starting at 0
                                polys.forEach(function(p) {
                                    p.depth = count - countNow;
                                    if (p.fill_off) p.fill_off.forEach(function(pi) {
                                        // use negative offset for inners
                                        pi.depth = -(count - countNow);
                                    });
                                });
                            });
                    }
                }
            } else {
                // no shells, just infill, is permitted
                last = [top.poly];
            }

            // generate fill offset poly set from last offset to top.fill_off
            if (fillOffset && last.length > 0) {
                // if gaps present, remove that area from fill inset
                if (gaps.length) {
                    let nulast = [];
                    POLY.subtract(last, gaps, nulast, null, slice.z);
                    last = nulast;
                }
                last.forEach(function(inner) {
                    POLY.offset([inner], -fillOffset, {outs: top.fill_off, flat: true, z: slice.z});
                });
            }

            // for diffing
            top.last = last;

            shellout += top.shells.length;

            // add anchor extrusion if missing on the first belt layer
            // todo: fix. disabled because throws off layer min y calculations in some cases
            if (false && opt.belt0 && top.shells.length === 0 && slice.up && slice.up.tops.length) {
                for (let up of slice.up.tops) {
                    let bounds = up.poly.bounds,
                        midy = (bounds.miny + bounds.maxy) / 2;
                    if (top.poly.isInside(up.poly, 1)) {
                        slice.widget.belt.ymid = midy;
                        slice.widget.belt.zmid = slice.z;
                        top.shells.push(BASE.newPolygon()
                            .setOpen()
                            .add(bounds.minx,midy,slice.z)
                            .add(bounds.maxx,midy,slice.z));
                    }
                }
            }
        });
    };

    /**
     * Create an entirely solid layer by filling all top polygons
     * with an alternating pattern.
     *
     * @param {number} linewidth
     * @param {number} angle
     * @param {number} density
     */
     function doSolidLayerFill(slice, spacing, angle) {
        if (slice.tops.length === 0 || typeof(angle) != 'number') {
            slice.isSolidLayer = false;
            return;
        }

        slice.tops.forEach(function(top) {
            let lines = fillArea(top.fill_off, angle, spacing, null);
            top.fill_lines.appendAll(lines);
        });

        slice.isSolidLayer = true;
    };

    /**
     * Take output from pluggable sparse infill algorithm and clip to
     * the bounds of the top polygons and their inner solid areas.
     */
    function doSparseLayerFill(slice, options) {
        let process = options.process,
            spacing = options.spacing,  // spacing space between fill lines
            density = options.density,  // density of infill 0.0 - 1.0
            bounds = options.bounds,    // bounding box of widget
            height = options.height,    // z layer height
            type = options.type || 'hex';

        if (slice.tops.length === 0 || density === 0.0 || slice.isSolidLayer) {
            slice.isSparseFill = false;
            return;
        }

        let tops = slice.tops,
            down = slice.down,
            clib = self.ClipperLib,
            ctyp = clib.ClipType,
            ptyp = clib.PolyType,
            cfil = clib.PolyFillType,
            clip = new clib.Clipper(),
            ctre = new clib.PolyTree(),
            poly,
            polys = [],
            lines = [],
            line = [],
            solids = [],
            // callback passed to pluggable infill algorithm
            target = {
                // slice and slice property access
                slice: function() { return slice },
                zIndex: function() { return slice.index },
                zValue: function() { return slice.z },
                // various option map access
                options: function() { return options },
                lineWidth: function() { return options.lineWidth },
                bounds: function() { return bounds },
                zHeight: function() { return height },
                offset: function() { return spacing },
                density: function() { return density },
                // output functions
                emit: function(x,y) {
                    if (isNaN(x)) {
                        solids.push(x);
                    } else {
                        line.push(newPoint(x,y,slice.z));
                        slice.isSparseFill = true;
                    }
                },
                newline: function() {
                    if (line.length > 0) {
                        lines.push(line);
                        line = [];
                    }
                }
            };

        // use specified fill type
        if (type && FILL[type]) {
            FILL[type](target);
        } else {
            console.log({missing_infill: type});
            return;
        }

        // force emit of last line
        target.newline();

        // prepare top infill structure
        tops.forEach(function(top) {
            top.fill_sparse = [];
            polys.appendAll(top.fill_off);
            polys.appendAll(top.solids);
        });

        // update fill fingerprint for this slice
        slice._fill_finger = POLY.fingerprint(polys);

        let skippable = FILLFIXED[type] ? true : false;
        let miss = false;
        // if the layer below has the same fingerprint,
        // we may be able to clone the infill instead of regenerating it
        if (skippable && slice.fingerprintSame(down)) {
            // the fill fingerprint can slightly different because of solid projections
            if (down._fill_finger && POLY.fingerprintCompare(slice._fill_finger, down._fill_finger)) {
                for (let i=0; i<tops.length; i++) {
                    // the layer below may not have infill computed if it's solid
                    if (down.tops[i].fill_sparse) {
                        tops[i].fill_sparse = down.tops[i].fill_sparse.map(poly => {
                            return poly.clone().setZ(slice.z);
                        });
                    } else {
                        miss = true;
                    }
                }
                // if any of the fills as missing from below, re-compute
                if (!miss) {
                    return;
                }
            }
        }

        let sparse_clip = slice.isSparseFill;

        // solid fill areas
        if (solids.length) {
            tops.forEach(top => {
                if (!top.fill_off) return;
                let masks = top.fill_off.slice();
                if (top.solids) {
                    masks = POLY.subtract(masks, top.solids, [], null, slice.z);
                }
                let angl = process.sliceFillAngle * ((slice.index % 2) + 1);
                solids.forEach(solid => {
                    let inter = [],
                        fillable = [];
                    masks.forEach(mask => {
                        let p = solid.mask(mask);
                        if (p && p.length) inter.appendAll(p);
                    });
                    // offset fill area to accommodate trace
                    if (inter.length) {
                        POLY.expand(inter, -options.lineWidth/2, slice.z, fillable);
                    }
                    // fill intersected areas
                    if (inter.length) {
                        slice.isSparseFill = true;
                        inter.forEach(p => {
                            p.forEachSegment((p1, p2) => {
                                top.fill_lines.push(p1, p2);
                            });
                        });
                    }
                    if (fillable.length) {
                        let lines = POLY.fillArea(fillable, angl, options.lineWidth);
                        top.fill_lines.appendAll(lines);
                    }
                });
            });
        }

        // if only solids were added and no lines to clip
        if (!sparse_clip) {
            return;
        }

        clip.AddPaths(lines, ptyp.ptSubject, false);
        clip.AddPaths(POLY.toClipper(polys), ptyp.ptClip, true);

        if (clip.Execute(ctyp.ctIntersection, ctre, cfil.pftNonZero, cfil.pftEvenOdd)) {
            ctre.m_AllPolys.forEach(function(node) {
                poly = POLY.fromClipperNode(node, slice.z);
                tops.forEach(function(top) {
                    // use only polygons inside this top
                    if (poly.isInside(top.poly)) {
                        top.fill_sparse.push(poly);
                    }
                });
            });
        }
    };

    /**
     * Find difference between fill inset poly on two adjacent layers.
     * Used to calculate bridges, flats and then solid projections.
     * 'expand' is used for top offsets in SLA mode
     */
    function doDiff(slice, minArea, sla, fakedown) {
        if (slice.index === 0 && !fakedown) {
            return;
        }
        const top = slice,
            down = slice.down || (fakedown ? newSlice(-1) : null),
            topInner = sla ? top.topPolys() : top.topInners(),
            downInner = sla ? down.topPolys() : down.topInners(),
            bridges = top.bridges = [],
            flats = down.flats = [];

        // skip diffing layers that are identical
        if (slice.fingerprintSame(down)) {
            top.bridges = bridges;
            down.flats = flats;
            return;
        }

        POLY.subtract(topInner, downInner, bridges, flats, slice.z, minArea);
    };

    /**
     *
     *
     * @param {Polygon[]} polys
     */
    function addSolidFills(slice, polys) {
        if (slice.solids) {
            slice.solids.appendAll(polys);
        } else if (polys && polys.length) {
            console.log({no_solids_in: slice, for: polys})
        }
    };

    /**
     * project bottom flats down
     */
    function projectFlats(slice, count) {
        if (slice.isSolidLayer || !slice.down || !slice.flats) return;
        projectSolid(slice, slice.flats, count, false, true);
    };

    /**
     * project top bridges up
     */
    function projectBridges(slice, count) {
        if (slice.isSolidLayer || !slice.up || !slice.bridges) return;
        projectSolid(slice, slice.bridges, count, true, true);
    };

    /**
     * fill projected areas and store line data
     * @return {boolean} true if filled, false if not
     */
    function doSolidsFill(slice, spacing, angle, minArea) {

        const render = slice.output();

        let minarea = minArea || 1,
            tops = slice.tops,
            solids = slice.solids,
            unioned = POLY.union(solids, undefined, true).flat(), // TODO verify
            isSLA = (spacing === undefined && angle === undefined);

        if (solids.length === 0) return false;
        if (unioned.length === 0) return false;

        let masks,
            trims = [],
            inner = isSLA ? slice.topPolys() : slice.topFillOff();

        // trim each solid to the inner bounds
        unioned.forEach(function(p) {
            p.setZ(slice.z);
            inner.forEach(function(i) {
                if (p.del) return;
                masks = p.mask(i);
                if (masks && masks.length > 0) {
                    p.del = true;
                    trims.appendAll(masks);
                }
            });
        });

        // clear old solids and make array for new
        tops.forEach(top => { top.solids = [] });

        // replace solids with merged and trimmed solids
        slice.solids = solids = trims;

        // parent each solid polygon inside the smallest bounding top
        solids.forEach(function(solid) {
            tops.forEach(function(top) {
                if (top.poly.overlaps(solid)) {
                    if (!solid.parent || solid.parent.area() > top.poly.area()) {
                        if (solid.areaDeep() < minarea) {
                            // console.log({i:slice.index,cull_solid:solid,area:solid.areaDeep()});
                            return;
                        }
                        solid.parent = top.poly;
                        top.solids.push(solid);
                    }
                }
            });
        });

        // for SLA to bypass line infill
        if (isSLA) {
            return true;
        }

        // create empty filled line array for each top
        tops.forEach(function(top) {
            const tofill = [];
            const angfill = [];
            const newfill = [];
            // determine fill orientation from top
            solids.forEach(function(solid) {
                if (solid.parent === top.poly) {
                    if (solid.fillang) {
                        angfill.push(solid);
                    } else {
                        tofill.push(solid);
                    }
                }
            });
            if (tofill.length > 0) {
                fillArea(tofill, angle, spacing, newfill);
                top.fill_lines_norm = {angle:angle,spacing:spacing};
            }
            if (angfill.length > 0) {
                top.fill_lines_ang = {spacing:spacing,list:[],poly:[]};
                angfill.forEach(function(af) {
                    fillArea([af], af.fillang.angle + 45, spacing, newfill);
                    top.fill_lines_ang.list.push(af.fillang.angle + 45);
                    top.fill_lines_ang.poly.push(af.clone());
                });
            }

            top.fill_lines.appendAll(newfill);
        });

        return true;
    };

    /**
     * Calculate height range of the slice
     * @return {float, float} top and bottom height of the slice 
     */
    function get_height_range(slice) {
        let top_height = slice.z + slice.height/2;
        let bottom_height = slice.z - slice.height/2;
        return {top_height:top_height, bottom_height:bottom_height};
    }

    /**
     * Calculate Z and height of slice based of target top and bottom heights
     * @return {float, float} Z and Height of the slice 
     */
    function get_slice_height_values(top_height, bottom_height, force_droop_from_head_at_top_height) {
        let height = top_height - bottom_height;
        let z;
        if (force_droop_from_head_at_top_height) z = top_height;// + 0.0042;
        else z = (top_height + bottom_height) / 2;
        return {z:z, height:height};
    }

    /**
     * Determine the best slice to pause the print and insert the surrogate
     * as well as how to adjust the surrounding slices to make the insertion smooth.
     * Expands the surrogate object with the case info directly.
     */
    function check_surrogate_insertion_case(surrogate, first_search_slice, surrogate_settings) {
        // Determine the insertion case for surrogate
        let case_determined = false;
        // console.log({Status:"Checking surrogate case handling"});
        // console.log({surrogate:surrogate});
        let iterate_layers_case_check = first_search_slice;
        while (iterate_layers_case_check && !case_determined) {
            let slice_height_range = get_height_range(iterate_layers_case_check);
            // Case 1: Extend the printed layer
            // The top end of the surrogate extends slightly into the new layer, or is perfectly on the same height
            if (slice_height_range.bottom_height <= surrogate.end_height && (slice_height_range.bottom_height + surrogate_settings.min_squish_height) >= surrogate.end_height) {
                // console.log({Status:"Case1 Extend printed layer"});
                surrogate.insertion_data.insertion_case = "extend_printed_layer";
                surrogate.insertion_data.max_height = surrogate.end_height;
                surrogate.insertion_data.new_layer_index = iterate_layers_case_check.index;
                if (iterate_layers_case_check.down) surrogate.insertion_data.printed_layer_index = iterate_layers_case_check.down.index;
                else {
                    console.log({WARNING:"Tried to save the slice of the printed layer, but none was found."})
                    console.log({WARNING_additional_data:surrogate.insertion_data});
                }
                case_determined = true;
            }
            // Case 2: Extend the new layer
            // The top end of the surrogate rests slightly below where the new layer would normally start
            else if (slice_height_range.bottom_height > surrogate.end_height && (slice_height_range.bottom_height - surrogate_settings.max_droop_height) <= surrogate.end_height) {
                // console.log({Status:"Case2 Extend new layer"});
                surrogate.insertion_data.insertion_case = "extend_new_layer";
                surrogate.insertion_data.min_height = surrogate.end_height;
                surrogate.insertion_data.new_layer_index = iterate_layers_case_check.index;
                if (iterate_layers_case_check.down) surrogate.insertion_data.printed_layer_index = iterate_layers_case_check.down.index;
                else {
                    console.log({WARNING:"Tried to save the slice of the printed layer, but none was found."})
                    console.log({WARNING_additional_data:surrogate.insertion_data});
                }
                case_determined = true;
            }
            // Case 3: Insert new support layer
            // The top of the surrogate is far below the start of the new layer, so we will add an additional (support-only) layer 
            else if (iterate_layers_case_check.down) {
                let down_slice_height_range = get_height_range(iterate_layers_case_check.down);
                if (down_slice_height_range.bottom_height < surrogate.end_height && down_slice_height_range.top_height > surrogate.end_height) {
                    // console.log({Status:"Case3 Insert new support layer"});
                    surrogate.insertion_data.insertion_case = "Insert_new_support_layer";
                    surrogate.insertion_data.min_height = surrogate.end_height;
                    surrogate.insertion_data.original_supports = [];
                    if (iterate_layers_case_check.down.supports) {
                        iterate_layers_case_check.down.supports.forEach(function(supp) {
                            surrogate.insertion_data.original_supports.push(supp.clone(true)); // Save original supports
                        });
                    }
                    // console.log({surrogate_original_supports:surrogate.insertion_data.original_supports});
                    surrogate.insertion_data.new_layer_index = iterate_layers_case_check.index;
                    surrogate.insertion_data.printed_layer_index = iterate_layers_case_check.down.index;
                    case_determined = true;
                }
            }
            iterate_layers_case_check = iterate_layers_case_check.up;
        }
        if (!case_determined) console.log({WARNING:"WARNING: No case found for surrogate height handling."});
        
    }

    /**
     * calculate external overhangs requiring support
     */
    function doSupport(slice, proc, shadow, settings, view, surrogating) {
        if (surrogating)
        {
            console.log({handled:"Surrogates handled already_A"});
        }
        let minOffset = proc.sliceSupportOffset,
            maxBridge = proc.sliceSupportSpan || 5,
            minArea = proc.supportMinArea,
            pillarSize = proc.sliceSupportSize,
            offset = proc.sliceSupportOffset,
            gap = proc.sliceSupportGap,
            min = minArea || 0.01,
            size = (pillarSize || 1),
            mergeDist = size * 3, // pillar merge dist
            tops = slice.topPolys(),
            trimTo = tops;
        // create inner clip offset from tops
        POLY.expand(tops, offset, slice.z, slice.offsets = []);

        let traces = POLY.flatten(slice.topShells().clone(true)),
            fill = slice.topFill(),
            points = [],
            down = slice.down,
            down_tops = down ? down.topPolys() : null,
            down_traces = down ? POLY.flatten(down.topShells().clone(true)) : null;

        let bottom_slice = slice.down;
        let last_bottom_slice;


        function getSurrogateGeometryAtIndexHeight(surrogate, z_height, index) {
            if (true) { // If surrogate is simple rectangular geometry
                if (z_height >= surrogate.starting_height && z_height <= surrogate.end_height) {
                    // let surrogate_larger = [];
                    // surrogate_larger = POLY.expand(surrogate.geometry, expansion_width, z_height, surrogate_larger, 1);
                    // return surrogate_larger;
                    return surrogate.geometry;
                }
                else return [];
            }
        }

        /*
        // make test object polygons
        function generateRectanglePolygon(start_x, start_y, start_z, length, width, rot, padding) {
            let rotation = rot * Math.PI / 180;
            let point1 = newPoint(start_x, start_y, start_z);
            let point2 = newPoint(start_x + length*Math.cos(rotation), start_y + length*Math.sin(rotation), start_z);
            let point3 = newPoint(point2.x + width*Math.sin(-rotation), point2.y + width*Math.cos(-rotation), start_z);
            let point4 = newPoint(start_x + width*Math.sin(-rotation), start_y + width*Math.cos(-rotation), start_z);
            let rect_points = [point1, point2, point3, point4];
            let rectanglePolygon = BASE.newPolygon(rect_points);
            //rectanglePolygon.parent = top.poly;
            rectanglePolygon.depth = 0;
            rectanglePolygon.area2 = length * width * 2;
            let rectanglePolygon_padded = [];
            rectanglePolygon_padded = POLY.expand([rectanglePolygon], padding, start_z, rectanglePolygon_padded, 1); 
            return rectanglePolygon_padded[0];
        }

        function generatePrismPolygon(start_x, start_y, start_z, geometry_points, rot, padding) {
            // TODO: Do poly generation while loading, if the points-level details are not necessary.
            
            // Translate based on try-out position
            for (let point_index = 0; point_index < geometry_points.length; point_index++) {
                geometry_points[point_index].x += start_x;
                geometry_points[point_index].y += start_y;
            }
            let rectanglePolygon = BASE.newPolygon(geometry_points);
            //rectanglePolygon.parent = top.poly;
            rectanglePolygon.depth = 0;
            rectanglePolygon.area2 = rectanglePolygon.area(true);

            console.log({rectanglePolygon:rectanglePolygon});
            rectanglePolygon = rectanglePolygon.rotateXY(rot);
            console.log({rectanglePolygon_afterRotation:rectanglePolygon});

            let rectanglePolygon_padded = [];
            rectanglePolygon_padded = POLY.expand([rectanglePolygon], padding, start_z, rectanglePolygon_padded, 1); 
            return rectanglePolygon_padded[0];

        }

        // Function to translate adding pause layers into a string for the UI (and the export parser)
        function addPauseLayer(insertion_layer_index, settings) {
            if (settings.process.gcodePauseLayers == null) settings.process.gcodePauseLayers = "";
            if (settings.process.gcodePauseLayers != "") settings.process.gcodePauseLayers += ",";
            settings.process.gcodePauseLayers += insertion_layer_index.toString();
            console.log({pauselayer:insertion_layer_index});
            console.log({pause_layers:settings.process.gcodePauseLayers});
        }
        */


        // check if point is supported by layer below
        function checkPointSupport(point) {
            // skip points close to other support points
            for (let i=0; i<points.length; i++) {
                if (point.distTo2D(points[i]) < size/4) return;
            }
            let supported = point.isInPolygonOnly(down_tops);
            if (!supported) down_traces.forEach(function(trace) {
                trace.forEachSegment(function(p1, p2) {
                    if (point.distToLine(p1, p2) <= minOffset) {
                        return supported = true;
                    }
                });
                return supported;
            });
            if (!supported) points.push(point);
        }

        // todo support entire line if both endpoints unsupported
        // segment line and check if midpoints are supported
        function checkLineSupport(p1, p2, poly) {
            let dist, i = 1;
            if ((dist = p1.distTo2D(p2)) >= maxBridge) {
                let slope = p1.slopeTo(p2).factor(1/dist),
                    segs = Math.floor(dist / maxBridge) + 1,
                    seglen = dist / segs;
                while (i < segs) {
                    checkPointSupport(p1.projectOnSlope(slope, i++ * seglen));
                }
            }
            if (poly) checkPointSupport(p2);
        }

        let supports = [];

        // generate support polys from unsupported points
        if (slice.down) (function() {
            // check trace line support needs
            traces.forEach(function(trace) {
                trace.forEachSegment(function(p1, p2) { checkLineSupport(p1, p2, true) });
            });

            // add offset solids to supports (or fill depending)
            fill.forEachPair(function(p1,p2) { checkLineSupport(p1, p2, false) });

            // skip the rest if no points or supports
            if (!(points.length || supports.length)) return;

            let pillars = [];

            // for each point, create a bounding rectangle
            points.forEach(function(point) {
                pillars.push(BASE.newPolygon().centerRectangle(point, size/2, size/2));
            });

            // merge pillars and replace with convex hull of outer points (aka smoothing)
            pillars = POLY.union(pillars, null, true).forEach(function(pillar) {
                supports.push(BASE.newPolygon().createConvexHull(pillar.points));
            });
        })();

        if (supports.length === 0) {
            return;
        }

        // then union supports
        supports = POLY.union(supports, null, true);

        // clip to top polys
        supports = POLY.trimTo(supports, shadow);

        let depth = 0;

        while (down && supports.length > 0) {
            
            down.supports = down.supports || [];

            let trimmed = [], culled = [], trimmed_before_books = [], collision_detection = [];

            // clip supports to shell offsets
            POLY.subtract(supports, down.topPolys(), trimmed, null, slice.z, min);
            // console.log({trimmed_before_books: trimmed_before_books});
            // POLY.subtract(trimmed_before_books, test_books_rectangle_list, trimmed, null, slice.z, min);
            // console.log({trimmed: trimmed});

            // console.log({down: down});
            // console.log({down_toppolys: down.topPolys()});
            // console.log({down_manual: down.tops[0].poly});

            // POLY.subtract(down.topPolys(), test_books_rectangle_list, collision_detection, null, slice.z, min);
            // console.log({new_area: collision_detection[0].areaDeep()});



            // set depth hint on support polys for infill density
            //let support_one_poly_area = 0;
            trimmed.forEach(function(trim) {
                // if (trim.area() < 0.1) return;
                culled.push(trim.setZ(down.z));
                //support_one_poly_area += (trim.areaDeep() * slice.height);
            });

            // exit when no more support polys exist
            if (culled.length === 0) break;

            // new bridge polys for next pass (skip first layer below)
            if (depth >= gap) {
                down.supports.appendAll(culled);
            }

            supports = culled;
            //console.log({support_area: support_area});
            //support_area += support_one_poly_area;
            down = down.down;
            depth++;

        }
        //console.log({support_area: support_area});


        if (false) {

            let books = [];
            // books.push({width:100.5, length:152.7, height:10.9});
            // books.push({width:136.8, length:190.1, height:24.1});


            function addOption(listOfOptions, length, width, height, title) {
                listOfOptions.push({width:width, length:length, height:height, id:title, available:true});
            }

            function addStackableOptions(listOfOptions, initialHeight, addHeight, available, length, width, title) {
                let stackHeight = initialHeight;
                let stackedSoFar = 0;
                while (stackHeight < settings.device.maxHeight && stackedSoFar < available) { 
                    addOption(listOfOptions, length, width, stackHeight, title);
                    stackHeight = stackHeight + addHeight;
                    stackedSoFar++;
                }
            }

            addStackableOptions(books, 12.75, 9.55, 4, 31.85, 16, "Lego4x2Flat");
            addStackableOptions(books, 3.33, 3.33, 9, 89.9, 93.8, "FloppyDisc");
            addOption(books, 50.4, 24.95, 18.62, "wood_man");
            addOption(books, 45.15, 23.35, 14.82, "dark_wood");
            addOption(books, 25.05, 25.05, 18.8, "cube_with_dent");
            addOption(books, 44.35, 18.33, 10.16, "wood_bar_dirty");
            addOption(books, 97, 18.35, 11.18, "wood_bar_two_holes");
            addOption(books, 100.75, 18.52, 12.2, "wood_bar_math");
            addOption(books, 68.26, 50.46, 13.1, "wood_flat");
            addOption(books, 51, 25, 18.55, "wood_man_hair");
            addOption(books, 52.22, 24.9, 18.6, "wood_bar");
            addOption(books, 24.4, 24.4, 24.4, "XYZ_cube_filled");
            addOption(books, 27.31, 23.75, 10.55, "support_flat");
            addOption(books, 73, 10.43, 9.5, "support_bar");
            addOption(books, 73, 10.43, 9.5, "support_bar");
            addOption(books, 183.5, 80.1, 14.7, "foam_plate");
            addOption(books, 137.5, 55.57, 6.62, "wood_plate_small");
            addOption(books, 208.8, 164, 6.66, "wood_plate_large");
            addOption(books, 154.3, 105, 5.35, "saw_plate");
            addOption(books, 128.52, 68.25, 8.75, "medium_dense_foam_plate");
            
            
            // let test_books_rectangle_list = [generateRectanglePolygon(0, -20, slice.z, 5, 30, 0.0)];
            // test_books_rectangle_list.push(generateRectanglePolygon(0, 10, slice.z, 2, 2, 0));
            // test_books_rectangle_list.push(generateRectanglePolygon(0, 15, slice.z, 2, 2, 0));
            // test_books_rectangle_list.push(generateRectanglePolygon(0, 20, slice.z, 2, 2, 0));
            let test_books_rectangle_list = [];
            let support_area = 0;

            while (bottom_slice) {
                last_bottom_slice = bottom_slice;
                bottom_slice = bottom_slice.down;
            }
            bottom_slice = last_bottom_slice;
            console.log({bottom_slice: bottom_slice});

            if (surrogating)
            {
                console.log({handled:"Surrogates handled already"});
            }

            let up = bottom_slice, up_collision_check = bottom_slice;

            let surrogate_settings = {};

            let search_padding = 5;
            // Search bounds
            const min_x = bottom_slice.widget.bounds.min.x - search_padding;
            const max_x = bottom_slice.widget.bounds.max.x + search_padding;
            const min_y = bottom_slice.widget.bounds.min.y - search_padding;
            const max_y = bottom_slice.widget.bounds.max.y + search_padding;
            const bedDepthArea = settings.device.bedDepth / 2;
            const bedWidthArea = settings.device.bedWidth / 2;
            const shift_x = bottom_slice.widget.track.pos.x;
            const shift_y = bottom_slice.widget.track.pos.y;
            let surrogate_number_goal = 0;
            let repetition_goal = 100;
            let books_placed = [];
            let try_x = 0;
            let try_y = 0;
            let try_z = 0;
            let try_rotation = 0;
            let try_book = 0;
            let try_book_index = 0;
            let rotations = [0,45,90,135,180,225,270,315];
            let layer_height_fudge = settings.process.sliceHeight/1.75;
            let print_on_surrogate_extra_height_for_extrusion = 0;
            surrogate_settings.surrogate_padding = 0.1;
            surrogate_settings.min_squish_height = settings.process.sliceHeight/4;
            surrogate_settings.max_droop_height = settings.process.sliceHeight/4;
            surrogate_settings.minimum_clearance_height = settings.process.sliceHeight/4;

            let first_placed = false;

            console.log({pause_layers_start: settings.process.gcodePauseLayers});

            // console.log({widget: bottom_slice.widget});
            // console.log({widget_pos: bottom_slice.widget.track.pos});
            // console.log({bedDepth: settings.device.bedDepth});

            // console.log({bedwidth: settings.device.bedWidth});

            // console.log({shift_x: shift_x});
            // console.log({shift_y: shift_y});


            // Iterate, placing a book in every iteration
            for (let books_to_place = 0; books_to_place < surrogate_number_goal; books_to_place++) {
                let place_one_book = {};

                
                let sufficient = false; // TODO: Define what is sufficient to stop searching for better solutions
                let repetition_counter = 0;
                let epsilon_0_counter = 0;
                let best_delta_volume = 0;
                let best_insertion_layer_number_guess = 0;

                // Start at bottom
                up = bottom_slice;

                // Try out random options to place books
                while (sufficient === false && repetition_counter < (Math.floor(repetition_goal / surrogate_number_goal))) {
                    let good = true;
                    
                    // Set walking slice to lowest slice
                    

                    // TODO: Remove after making sure volume check goes over all relevant slices
                    if (!up.supports || up.supports.length === 0) {
                        up = up.up;
                        repetition_counter++;
                        console.log({going_up: "Going up because there were no supports on this slice my DUDE!!!!!!!"});
                        good = false;
                        continue;
                    }

                    let stack_on_book_index = Math.floor(Math.random() * (books_placed.length + 1)) - 1; // -1 to try to place it on buildplate
                    try_x = Math.random() * (max_x - min_x) + min_x;
                    try_y = Math.random() * (max_y - min_y) + min_y;
                    try_z = 0; // TODO: Convert height to slice number???
                    
                    if (stack_on_book_index >= 0) {
                        // console.log({books_placed:books_placed});
                        // console.log({stack_on_book_index:stack_on_book_index});
                        try_z = books_placed[stack_on_book_index].starting_height + books_placed[stack_on_book_index].book.height;// + layer_height_fudge;
                    }
                    try_rotation = rotations[Math.floor(Math.random() * rotations.length)];
                    try_book_index = Math.floor(Math.random() * books.length)
                    try_book = books[try_book_index];
                    let test_book_rectangle_list = [generateRectanglePolygon(try_x, try_y, up.z, try_book.length, try_book.width, try_rotation, surrogate_settings.surrogate_padding)];
                    let supports_after_surrogates = [];
                    let collision = false;
                    let new_volume = 0, old_volume = 0;
                    let delta_volume = 0;
                    let insertion_layer_number_guess = 0;


                    // Check if surrogate is available
                    if (try_book.available === false) {
                        repetition_counter++;
                        good = false;
                        continue;
                    }


                    // Check that surrogates don't end on consecutive layers

                    

                    // Out of build-area check
                    for (let book_poly of test_book_rectangle_list) {
                        // translate widget coordinate system to build plate coordinate system and compare with build plate size (center is at 0|0, bottom left is at -Width/2<|-Depth/2)
                        if (book_poly.bounds.maxx + shift_x > bedWidthArea || book_poly.bounds.minx + shift_x < -bedWidthArea || book_poly.bounds.maxy + shift_y > bedDepthArea || book_poly.bounds.miny + shift_y < -bedDepthArea || try_z + try_book.height > settings.device.bedDepth) {
                            // console.log({text:"Out of build area"});
                            // console.log({book_poly_bounds:book_poly.bounds})
                            // console.log({y_max:book_poly.bounds.maxy + shift_y})
                            // console.log({y_min:book_poly.bounds.miny + shift_y})
                            // console.log({max_area:bedDepthArea})
                            // console.log({min_area:-bedDepthArea})
                            repetition_counter++;
                            good = false;
                            continue;
                        }
                    }

                    // Stability check
                    if (stack_on_book_index >= 0) {
                        let unsupported_polygons = [];
                        let unsupp_area = 0, full_area = 0;
                        POLY.subtract(test_book_rectangle_list, books_placed[stack_on_book_index].geometry, unsupported_polygons, null, up.z, min);
                        unsupported_polygons.forEach(function(unsupp) {
                            unsupp_area += Math.abs(unsupp.area());
                        });
                        test_book_rectangle_list.forEach(function(full) {
                            full_area += Math.abs(full.area());
                        });

                        // If less than half the area of the new book is supported by the book below, surrogate is unstable
                        //if ((unsupp_area * 2) > full_area) {
                        // For now, use 100% support instead
                        if (unsupp_area > 0) {
                            repetition_counter++;
                            good = false;
                            continue;
                        }
                    }

                    // Get surrogate replaced volume
                    let iterate_layers_over_surrogate_height = bottom_slice;
                    while (iterate_layers_over_surrogate_height) {
                        // Skip layers that are under the start height of the surrogate
                        if (iterate_layers_over_surrogate_height.z < try_z) { // Approximation: If more than half of the slice height is surrogated, we count it fully 
                            iterate_layers_over_surrogate_height = iterate_layers_over_surrogate_height.up;
                            continue;
                        } 

                        // Skip layers that have no supports
                        else if (!iterate_layers_over_surrogate_height.supports || iterate_layers_over_surrogate_height.supports.length === 0) {
                            iterate_layers_over_surrogate_height = iterate_layers_over_surrogate_height.up;
                            continue;
                        }
                        // Stop counting volume surrogate height has passed 
                        else {
                            let slice_height_range = get_height_range(iterate_layers_over_surrogate_height);
                            if ((slice_height_range.bottom_height + surrogate_settings.min_squish_height) >= (try_book.height + try_z)) {
                                break;
                            }
                        }
                        
                        supports_after_surrogates = [];
                        POLY.subtract(iterate_layers_over_surrogate_height.supports, test_book_rectangle_list, supports_after_surrogates, null, iterate_layers_over_surrogate_height.z, min);

                        // console.log({supports_after_surrogates:supports_after_surrogates});
                        // console.log({iterate_layers_over_surrogate_height_supports:iterate_layers_over_surrogate_height.supports});
                        supports_after_surrogates.forEach(function(supp) {
                            new_volume += Math.abs((supp.area() * iterate_layers_over_surrogate_height.height));
                        });
                        iterate_layers_over_surrogate_height.supports.forEach(function(supp) {
                            old_volume += Math.abs((supp.area() * iterate_layers_over_surrogate_height.height));
                        });
                        iterate_layers_over_surrogate_height = iterate_layers_over_surrogate_height.up;
                    }
                    delta_volume = old_volume - new_volume;


                    // Check collisions 
                    // only if the surrogate is useful/better than last
                    if (delta_volume > best_delta_volume) {
                        let iterate_layers_collision_check = up;

                        // Check for collision for the whole surrogate height
                        while (
                            collision === false && iterate_layers_collision_check && // Stop after first collision found, or end of widget reached
                            (get_height_range(iterate_layers_collision_check).bottom_height + surrogate_settings.min_squish_height) < (try_book.height + try_z)) { // stop checking when surrogate top is higher than slice bottom + min squish height 
                            // Increase height until surrogate starting height is reached 
                            if (iterate_layers_collision_check.z < try_z) { // LWW TODO: Check at what height we actually want to start checking for collisions
                                iterate_layers_collision_check = iterate_layers_collision_check.up;
                                // console.log({going_up: "Going up because book is not on buildplate my DUDE!!!!!!!"});
                                continue;
                            }

                            // DON'T skip the layers, since we are looking for model polygons and previous surrogate supports
                            // Skip layers without support
                            // if (!iterate_layers_collision_check.supports || iterate_layers_collision_check.supports.length === 0) {
                            //     iterate_layers_collision_check = iterate_layers_collision_check.up;
                            //     console.log({going_up: "No support to check for collision found on this slice"});
                            //     continue;
                            // }

                            let collision_detection = [];
                            POLY.subtract(iterate_layers_collision_check.topPolys(), test_book_rectangle_list, collision_detection, null, iterate_layers_collision_check.z, min);
                            
                            let post_collision_area = 0, pre_collision_area = 0;
                            iterate_layers_collision_check.topPolys().forEach(function(top_poly) {
                                pre_collision_area += Math.abs(top_poly.area());
                            });
                            collision_detection.forEach(function(top_poly) {
                                post_collision_area += Math.abs(top_poly.area());
                            });
                            
                            if (Math.abs(post_collision_area - pre_collision_area) > 0.00001) { // rounded the same
                                collision = true;
                                continue;
                                //console.log({collision_true: post_collision_area - pre_collision_area});
                            }

                            // Check collision with already placed surrogates as well
                            
                            if (books_placed.length >= 1) {
                                
                                for (let books_placed_idx = 0; books_placed_idx < books_placed.length; books_placed_idx++) {
                                    let previous_surrogate = books_placed[books_placed_idx];

                                    if (iterate_layers_collision_check.z <= (previous_surrogate.book.height + previous_surrogate.starting_height) && iterate_layers_collision_check.z >= previous_surrogate.starting_height) {

                                        collision_detection = [];
                                        
                                        POLY.subtract(test_book_rectangle_list, previous_surrogate.geometry, collision_detection, null, iterate_layers_collision_check.z, min); // TODO: Check if Z matters
                                        
                                        post_collision_area = 0;
                                        pre_collision_area = 0;
                                        test_book_rectangle_list.forEach(function(top_poly) {
                                            pre_collision_area += Math.abs(top_poly.area());
                                        });
                                        collision_detection.forEach(function(top_poly) {
                                            post_collision_area += Math.abs(top_poly.area());
                                        });
                                        
                                        if (Math.abs(post_collision_area - pre_collision_area) > 0.00001) {
                                            collision = true;
                                            continue;
                                            //console.log({collision_true: post_collision_area - pre_collision_area});
                                        }
                                    }
                                }
                            }

                            // Step up
                            iterate_layers_collision_check = iterate_layers_collision_check.up;
                            // insertion_layer_number_guess = iterate_layers_collision_check.index;
                        }
                        if (collision) {
                            good = false;
                            repetition_counter++;
                            continue;
                        }
                    }
                    


                    // generate candidate and validation insertion case and layer
                    let lower_book = [];
                    let empty_array = [];
                    let data_array = {insertion_case:"unknown"};
                    if (stack_on_book_index >= 0) {
                        lower_book.push(books_placed[stack_on_book_index]);
                    }
                    let end_height = try_z + try_book.height;
                    let candidate = {
                        geometry:test_book_rectangle_list, 
                        book:try_book, starting_height:try_z, 
                        end_height:end_height, 
                        down_surrogate:lower_book, 
                        up_surrogate:empty_array, 
                        outlines_drawn:0, 
                        insertion_data:data_array
                    };
                    check_surrogate_insertion_case(candidate, bottom_slice, surrogate_settings);

                    // Check if it is on a consecutive layer from a previous surrogate
                    let consecutive = false;
                    books_placed.forEach(function(surrogate) {
                        if (Math.abs(candidate.insertion_data.index - surrogate.insertion_data.index) === 1) {
                            consecutive = true;
                        }
                    });
                    if (consecutive) {
                        good = false;
                        repetition_counter++;
                        continue;
                    }

                    // Check if better valid position was found
                    if (good === true && delta_volume > best_delta_volume) {
                        best_delta_volume = delta_volume;
                        place_one_book = candidate;
                    }
                    // If it is just as good --> choose the bigger one
                    else if (good === true && delta_volume === best_delta_volume && delta_volume > 0) {
                        // Check if the new surrogate is bigger
                        if (!(Object.keys(place_one_book).length === 0) && place_one_book.geometry[0].area > test_book_rectangle_list[0].area) { // LWW TODO: Adjust for more complicated geometry
                            console.log({Notification:"A surrogate replaced the same amount of support, but was bigger"});
                            place_one_book = candidate;
                        }
                        else {
                            epsilon_0_counter++;
                        }
                    }

                    //console.log({best_delta_volume:best_delta_volume});

                    repetition_counter++;
                }
                console.log({best_delta_volume:best_delta_volume});
                console.log({epsilon_0_counter:epsilon_0_counter});
                //test_books_rectangle_list.push(place_one_book.geometry[0])
                if (best_delta_volume > 500) {
                    books_placed.push(place_one_book);
                    place_one_book.book.available = false; // Mark book as used

                    console.log({placed_book_name:place_one_book.book.id});
                    // console.log({the_book:place_one_book.book});
                    // console.log({the_book2:books[try_book_index]});
                }
            }

            console.log({books_placed:books_placed});


            // Remove supports based on surrogates placed
            up = bottom_slice;
            let top_slice = bottom_slice;
            // For all slices
            while (up) {
                // If supports exist
                if (up.supports && up.supports.length > 0) {
                    // For every book, surrogate the support
                    //var surrogate;
                    //for (surrogate in books_placed) {
                    for (let idx = 0; idx < books_placed.length; idx++) {
                        let surrogate = books_placed[idx];
                        
                        if (surrogate.insertion_data.insertion_case === "Insert_new_support_layer") {
                            let up_height_range = get_height_range(up);
                            if (up_height_range.bottom_height < (surrogate.book.height + surrogate.starting_height) && up.z >= surrogate.starting_height) {
                                let surrogated_supports = [];
                                POLY.subtract(up.supports, surrogate.geometry, surrogated_supports, null, up.z, min); // TODO: Collect book polygons and do it only once
                                up.supports = surrogated_supports;
                            }
                        }
                        // If the book is at this height
                        else if (up.z < (surrogate.book.height + surrogate.starting_height) && up.z >= surrogate.starting_height) {
                            let surrogated_supports = [];
                            POLY.subtract(up.supports, surrogate.geometry, surrogated_supports, null, up.z, min); // TODO: Collect book polygons and do it only once
                            up.supports = surrogated_supports;
                        }
                    }
                } else {
                    up.supports = [];
                }

                // After surrogating all supports, draw their outlines
                for (let draw_outline_idx = 0; draw_outline_idx < books_placed.length; draw_outline_idx++) {
                    let surrogate = books_placed[draw_outline_idx];
                    // If the book is at this height
                    if (up.z < (surrogate.book.height + surrogate.starting_height) && up.z >= surrogate.starting_height) {
                        if (surrogate.outlines_drawn < 5) {
                            // make surrogate bigger
                            // let surrogate_enlarged_more = [];
                            // let surrogate_enlarged = [];
                            // surrogate_enlarged_more = POLY.expand(surrogate.geometry, 0.4 + surrogate_enlargement, up.z, surrogate_enlarged_more, 1); // For a less tight fit
                            // surrogate_enlarged = POLY.expand(surrogate.geometry, surrogate_enlargement, up.z, surrogate_enlarged, 1); // For a less tight fit
                            let surrogate_enlarged = [];
                            let surrogate_double_enlarged = [];
                            surrogate_enlarged = POLY.expand(surrogate.geometry, 0.4, up.z, surrogate_enlarged, 1);
                            surrogate_double_enlarged = POLY.expand(surrogate_enlarged, 0.4, up.z, surrogate_double_enlarged, 1); 

                            
                            // subtract actual surrogate area to get only the outline
                            let surrogate_outline_area_only = [];
                            // POLY.subtract(surrogate_enlarged_more, surrogate_enlarged, surrogate_outline_area_only, null, up.z, min);
                            POLY.subtract(surrogate_enlarged, surrogate.geometry, surrogate_outline_area_only, null, up.z, min);

                            // surrogate_outline_area_only[0].points.forEach(function (point) {
                            //     point.z = point.z + 3.667686;
                            // });

                            // console.log({next_layer:up.up});
                            // Add outline to supports (will still be a double outline for now)
                            if (false) {
                            //if (!first_placed) { // Switch mode for first outline
                                up.tops[0].shells.push(surrogate_outline_area_only[0]);
                                first_placed = true;
                            } else {
                                //up.supports.push(surrogate_outline_area_only[0]);
                                if (!(up.tops[0].fill_sparse)) {
                                    up.tops[0].fill_sparse = [];
                                }
                                surrogate_outline_area_only[0].points.push(surrogate_outline_area_only[0].points[0]);
                                console.log({points_poly:surrogate_outline_area_only[0]});
                                up.tops[0].fill_sparse.push(surrogate_outline_area_only[0]);
                                let supp_minus_outlines = [];

                                // Prevent overlap of outlines and support // LWW TODO: Try adding to support and combine the two
                                up.supports = POLY.subtract(up.supports, surrogate_double_enlarged, supp_minus_outlines, null, up.z, min);
                            }
                            
                            // console.log({surrogate_outline_area_only:surrogate_outline_area_only});

                            //console.log({up_support:up.supports});
                            //up.supports.push(surrogate.geometry[0]);
                            //console.log({geometry:surrogate.geometry});
                            surrogate.outlines_drawn++;
                        }

                        // Trying to add outlines directly
                        if (false) { //(surrogate.outlines_drawn >= 2 && surrogate.outlines_drawn <= 3) {
                            let surrogate_outline = [];
                            let surrogate_outline2 = [];
                            surrogate_outline = POLY.expand(surrogate.geometry, 0.1, up.z, surrogate_outline, 1);

                            let surrogate_outline_area_only = [];
                            POLY.subtract(surrogate_outline, surrogate.geometry, surrogate_outline_area_only, null, slice.z, min);
                            //POLY.expand(surrogate_outline, -0.2, up.z, surrogate_outline2);
                            //surrogate_outline[0].setOpen(true);
                            //surrogate_outline[0].points = surrogate_outline[0].points.slice(0, 3);
                            console.log({surrogate_outline_area_only:surrogate_outline_area_only});
                            //surrogate_outline[0].area2 = 0;
                            
                            //console.log({surrogate_outline2:surrogate_outline2});
                            up.supports.push(surrogate_outline_area_only[0]);
                            surrogate.outlines_drawn++;
                            let up_top_zero = up.tops[0];
                            if (!up_top_zero.fill_sparse) up_top_zero.fill_sparse = [];
                            //up_top_zero.fill_sparse.appendAll(surrogate_outline);

                        }
                    }
                }
                top_slice = up;
                up = up.up; 
            } // top_slice should now be at the top

            // LWW TODO: Remove this warning check if insertion layers are too close
            let iterating_down = top_slice;
            books_placed.sort((a, b) => (a.insertion_data.new_layer_index > b.insertion_data.new_layer_index) ? 1 : -1);
            let last_surrogate;
            books_placed.forEach(function(surrogate) {
                if (last_surrogate && Math.abs(surrogate.insertion_data.new_layer_index - last_surrogate.insertion_data.new_layer_index) === 1) {
                    console.log({WARNING:"Surrogates are on consecutive layers!"});
                }
                last_surrogate = surrogate;
            });


            // Adjust layer heights and slide in new layers at surrogate top ends
            while (iterating_down) {
                let surrogates_at_this_index = [];
                let all_other_surrogates = [];
                books_placed.forEach(function(surrogate) {
                    if (surrogate.insertion_data.new_layer_index === iterating_down.index) {
                        surrogates_at_this_index.push(surrogate);
                    }
                    else {
                        all_other_surrogates.push(surrogate);
                    }
                });
                
                if (surrogates_at_this_index.length >= 1) {
                    // Add pause layer at index of already printed layer
                    addPauseLayer(surrogates_at_this_index[0].insertion_data.printed_layer_index, settings);

                    console.log({surrogates_at_this_index:surrogates_at_this_index});
                    let new_layer_height_range = get_height_range(iterating_down);
                    let printed_layer_height_range = get_height_range(iterating_down.down);
                    let new_layer_new_height_values;
                    let printed_layer_new_height_values;
                    let change_slices = true;

                    // Special case: Multiple surrogates on one slice
                    if (surrogates_at_this_index.length > 1) {
                        console.log({Status:"Multiple surrogates."});
                        
                        let only_simple_case = true;
                        let lowest_height = Number.POSITIVE_INFINITY;
                        let highest_height = -1;
                        // Check which cases are present
                        surrogates_at_this_index.forEach(function(surrogate) {
                            if (highest_height < surrogate.insertion_data.max_height) highest_height = surrogate.insertion_data.max_height;
                            if (lowest_height > surrogate.insertion_data.min_height) lowest_height = surrogate.insertion_data.min_height;
                            if (surrogate.insertion_data.insertion_case != "extend_printed_layer") only_simple_case = false;         
                        });

                        if (only_simple_case) {
                            // set bot of new layer and top of printed layer to found max height == Extend both up
                            new_layer_new_height_values = get_slice_height_values(new_layer_height_range.top_height, highest_height);
                            printed_layer_new_height_values = get_slice_height_values(highest_height, printed_layer_height_range.bottom_height);
                            
                        }
                        else {
                            // set bot of new layer and top of printed layer to found min height (extrude down a lot) // LWW TODO: make sure z is high enough for all surrogates, droop as much as necessary
                            new_layer_new_height_values = get_slice_height_values(new_layer_height_range.top_height, lowest_height);
                            printed_layer_new_height_values = get_slice_height_values(lowest_height, printed_layer_height_range.bottom_height);
                        }
                        
                    }
                    // Simple cases: One surrogate on the slice
                    else if (surrogates_at_this_index.length === 1) {
                        if (surrogates_at_this_index[0].insertion_data.insertion_case === "Insert_new_support_layer") {
                            change_slices = false;
                            let original_supports = surrogates_at_this_index[0].insertion_data.original_supports;
                            let only_support_above_this_surrogate = [];
                            let only_support_above_this_surrogate_2 = [];
                            // console.log({slideInSlice:surrogates_at_this_index[0]});
                            // console.log({iterating_down:iterating_down});
                            // console.log({iterating_down_DOWN:iterating_down.down});
                            
                            // Get only the diff of supports (after surrogating) from the printed slice
                            if (false) {
                                original_supports.forEach(function(original_supp) {
                                    console.log({original_supp:original_supp});
                                    let support_diff = original_supp;
                                    if (iterating_down.down.supports) {
                                        iterating_down.down.supports.forEach(function(supp) {
                                            let full_arr = support_diff;
                                            let subtract_arr = supp;
                                            let out_arr = [];
                                            support_diff = POLY.subtract(full_arr, subtract_arr, out_arr, null, new_layer_height_range.bottom_height, min);
                                        });
                                    }
                                    // support_diff.forEach(function(diff) {
                                    //     only_support_above_this_surrogate.push(diff);
                                    // });
                                    only_support_above_this_surrogate.push(support_diff);
                                });
                            }


                            // Support on the new slide-in slice are: 
                            //      - The original supports MINUS
                            //          - remaining supports
                            //          - other surrogate geometriues
                            // First collect all geometries that should be removed from original supports 
                            let collect_all_polygons_removed_from_support = [];
                            let collect_all_surrogate_geometries_removed_from_support = [];

                            // There will be overlap unless we expand the remaining supports
                            let support_enlarged = []
                            support_enlarged = POLY.expand(iterating_down.down.supports, 0.4, iterating_down.down.z, support_enlarged, 1);
                            support_enlarged.forEach(function(supp) {
                                collect_all_polygons_removed_from_support.push(supp);
                            });


                            all_other_surrogates.forEach(function(surrogate) {
                                collect_all_surrogate_geometries_removed_from_support = collect_all_surrogate_geometries_removed_from_support.concat(getSurrogateGeometryAtIndexHeight(surrogate, iterating_down.down.z));
                                // console.log({other_surrogate_geometries:getSurrogateGeometryAtIndexHeight(surrogate, iterating_down.down.z)});
                            });


                            console.log({collected_polygons:collect_all_polygons_removed_from_support});
                            console.log({collected_surrogate_geometries:collect_all_surrogate_geometries_removed_from_support});
                            // Get only the support on top of the current surrogate by subtracting original supports minus remaining supports/surrogates
                            // Must do this in two separate steps, otherwise the subtract function adds a new polygon where support/surrogate outlines meet
                            if (collect_all_polygons_removed_from_support.length > 0) {
                                POLY.subtract(original_supports, collect_all_polygons_removed_from_support, only_support_above_this_surrogate_2, null, new_layer_height_range.bottom_height, min);
                            } else {
                                only_support_above_this_surrogate_2 = original_supports;
                            }
                            if (only_support_above_this_surrogate_2.length > 0) {
                                POLY.subtract(only_support_above_this_surrogate_2, collect_all_surrogate_geometries_removed_from_support, only_support_above_this_surrogate, null, new_layer_height_range.bottom_height, min);
                            } else {
                                only_support_above_this_surrogate = only_support_above_this_surrogate_2;
                            }


                            // console.log({original_supports:original_supports});
                            // console.log({down_supports:iterating_down.down.supports});
                            // console.log({only_support_above_this_surrogate:only_support_above_this_surrogate});
                            
                            // Testing
                            // iterating_down.down.supports.forEach(function(supp) {
                            //     only_support_above_this_surrogate.push(supp);
                            // });

                            let slide_in_slice_height_values = get_slice_height_values(new_layer_height_range.bottom_height + surrogate_settings.minimum_clearance_height, surrogates_at_this_index[0].end_height, false);
                            let slide_in_slice = newSlice(slide_in_slice_height_values.z, view);
                            slide_in_slice.height = slide_in_slice_height_values.height;
                            slide_in_slice.widget = iterating_down.widget; 
                            slide_in_slice.extruder = iterating_down.extruder; 
                            slide_in_slice.isSparseFill = iterating_down.isSparseFill;
                            slide_in_slice.isSolidLayer = iterating_down.isSolidLayer;
                            slide_in_slice.offsets = iterating_down.offsets;
                            //slide_in_slice.finger = iterating_down.finger;
                            slide_in_slice.supports = only_support_above_this_surrogate;

                            slide_in_slice.down = iterating_down.down;
                            slide_in_slice.up = iterating_down;
                            iterating_down.down.up = slide_in_slice;
                            iterating_down.down = slide_in_slice;
                            slide_in_slice.index = iterating_down.index;

                            // Adjust all slice indexes above
                            iterating_down.index = iterating_down.index + 1;
                            let correcting_chain = iterating_down;
                            while (correcting_chain.up) {
                                correcting_chain = correcting_chain.up;
                                correcting_chain.index = correcting_chain.index + 1;
                            }

                            console.log({slide_in_slice:slide_in_slice});
                            console.log({iterating_down:iterating_down.index});
                            console.log({Case:"Insert_new_support_layer"})

                            // Now skip the newly added slice
                            iterating_down = iterating_down.down;
                        } 
                        else if (surrogates_at_this_index[0].insertion_data.insertion_case === "extend_printed_layer") {
                            let highest_height = surrogates_at_this_index[0].insertion_data.max_height;
                            new_layer_new_height_values = get_slice_height_values(new_layer_height_range.top_height, highest_height);
                            printed_layer_new_height_values = get_slice_height_values(highest_height, printed_layer_height_range.bottom_height);
                            console.log({iterating_down:iterating_down.index});
                            console.log({Case:"extend_printed_layer"})
                        }
                        else if (surrogates_at_this_index[0].insertion_data.insertion_case === "extend_new_layer") {
                            let lowest_height = surrogates_at_this_index[0].insertion_data.min_height;
                            new_layer_new_height_values = get_slice_height_values(new_layer_height_range.top_height, lowest_height);
                            printed_layer_new_height_values = get_slice_height_values(lowest_height, printed_layer_height_range.bottom_height);
                            console.log({iterating_down:iterating_down.index});
                            console.log({Case:"extend_new_layer"})
                        }
                    }
                    if (change_slices) {
                        iterating_down.z = new_layer_new_height_values.z;
                        iterating_down.height = new_layer_new_height_values.height;
                        iterating_down.down.z = printed_layer_new_height_values.z;
                        iterating_down.down.height = printed_layer_new_height_values.height;
                    }
                }

                iterating_down = iterating_down.down;
                
            }


            // Old way of determining surrogates on a layer
            if (false) {
                up = bottom_slice;
                let heighest_surrogate_top = -1; // -1 means no surrogate ends in the previous layer
                // adjust following layer (only support?) heights based on surrogate top heights
                while (up) {
                    // Set z of next layer to a height with good chance of sticking to surrogate, and adjust it's height accordingly // LWW TODO: Might want to change this to increase extrusion here
                    if (heighest_surrogate_top > -1) {
                        let target_layer_top = up.z + up.height;
                        // up.z = heighest_surrogate_top + layer_height_fudge;
                        // up.height = (target_layer_top - up.z) + print_on_surrogate_extra_height_for_extrusion;

                        let slide_in_slice = newSlice(up.z, view);
                        //let slide_in_slice = up.z.clone();
                        //slide_in_slice.tops = up.tops;
                        slide_in_slice.widget = up.widget; 
                        slide_in_slice.extruder = up.extruder; 
                        slide_in_slice.isSparseFill = up.isSparseFill;
                        slide_in_slice.isSolidLayer = up.isSolidLayer;
                        slide_in_slice.offsets = up.offsets;

                        
                        slide_in_slice.down = up.down;
                        slide_in_slice.up = up;
                        up.down.up = slide_in_slice;
                        up.down = slide_in_slice;
                        slide_in_slice.index = up.index;
                        slide_in_slice.z = heighest_surrogate_top + layer_height_fudge;
                        slide_in_slice.height = (target_layer_top - slide_in_slice.z) + print_on_surrogate_extra_height_for_extrusion;
                        
                        // copy_supports(slide_in_slice, up);
                        
                        if (!slide_in_slice.supports) slide_in_slice.supports = [];
                        up.supports.forEach(function(supp) {
                            slide_in_slice.supports.push(supp);
                        });
                        
                        console.log({slide_in_slice:slide_in_slice});
                        console.log({slide_in_slide_supports:slide_in_slice.supports});
                        slide_in_slice.is_surrogate_end_slice = true;
                        

                        up.index = up.index + 1;
                        let correcting_chain = up;
                        while (correcting_chain.up) {
                            correcting_chain = correcting_chain.up;
                            correcting_chain.index = correcting_chain.index + 1;
                        }
                    }

                    heighest_surrogate_top = -1;

                    // Find heighest surrogate that ends in the range of this layers thickness
                    for (let heigh_surrogate_idx = 0; heigh_surrogate_idx < books_placed.length; heigh_surrogate_idx++) {
                        let surrogate = books_placed[heigh_surrogate_idx];
                        let end_Height = surrogate.book.height + surrogate.starting_height;
                        if (end_Height > up.z && end_Height < up.z + up.height && end_Height > heighest_surrogate_top) {
                            heighest_surrogate_top = end_Height;
                        }
                    }
                    up = up.up;
                    if (up && up.is_surrogate_end_slice) up = up.up; // Skip the newly added layer
                }
            }

            console.log({done:"done"});
            bottom_slice.handled = true;
            let all_slices = [];
            up = bottom_slice;
            // For all slices
            while (up) {
                all_slices.push(up);
                up = up.up;
            }
        }


        //return all_slices;
    }

    function doSurrogates(slice, proc, shadow, settings, view, prisms) {
        if (true)
        {
            console.log({status:"Surrogates handling starts"});
        }
        let minOffset = proc.sliceSupportOffset,
            maxBridge = proc.sliceSupportSpan || 5,
            minArea = proc.supportMinArea,
            pillarSize = proc.sliceSupportSize,
            offset = proc.sliceSupportOffset,
            gap = proc.sliceSupportGap,
            min = minArea || 0.01,
            size = (pillarSize || 1),
            mergeDist = size * 3, // pillar merge dist
            tops = slice.topPolys(),
            trimTo = tops;
        // create inner clip offset from tops
        //POLY.expand(tops, offset, slice.z, slice.offsets = []);

        let traces = POLY.flatten(slice.topShells().clone(true)),
            fill = slice.topFill(),
            points = [],
            down = slice.down,
            down_tops = down ? down.topPolys() : null,
            down_traces = down ? POLY.flatten(down.topShells().clone(true)) : null;

        let bottom_slice = slice.down;
        let last_bottom_slice;

        function getSurrogateGeometryAtIndexHeight(surrogate, z_height, index) {
            if (true) { // If surrogate is simple rectangular geometry
                if (z_height >= surrogate.starting_height && z_height <= surrogate.end_height) {
                    // let surrogate_larger = [];
                    // surrogate_larger = POLY.expand(surrogate.geometry, expansion_width, z_height, surrogate_larger, 1);
                    // return surrogate_larger;
                    return surrogate.geometry;
                }
                else return [];
            }
        }

        function getSurrogateReplacedVolumes(old_volume, new_volume, current_slice, surrogate_rectangle_list) {
            let supports_after_surrogates = [];
            POLY.subtract(current_slice.supports, surrogate_rectangle_list, supports_after_surrogates, null, current_slice.z, 0);

            // console.log({surrogate_rectangle_list:surrogate_rectangle_list});
            // console.log({supports_after_surrogates:supports_after_surrogates});
            // console.log({current_slice:current_slice.supports});

            let padded_debug = [];
            if (supports_after_surrogates.length > 0) {
                
                // padded_debug = POLY.expand(supports_after_surrogates, 2, 0, padded_debug, 1);
                // if (!bottom_slice.tops[0].fill_sparse) bottom_slice.tops[0].fill_sparse = [];
                // for (let debug_index = 0; debug_index < padded_debug.length; debug_index++) {
                //     bottom_slice.tops[0].fill_sparse.push(padded_debug[debug_index]);
                // }
            }
            else console.log({note:"There were 0 supports left"});

            supports_after_surrogates.forEach(function(supp) {
                new_volume += Math.abs((supp.area() * current_slice.height));
                
            });


            current_slice.supports.forEach(function(supp) {
                old_volume += Math.abs((supp.area() * current_slice.height));


                // if (!current_slice.tops[0].fill_sparse) current_slice.tops[0].fill_sparse = [];
                //current_slice.tops[0].fill_sparse.push(supp);
                
            });

            return [old_volume, new_volume];
        }

        function generatePrismPolygon(start_x, start_y, start_z, geometry_points, rot, padding, debug_slice) {
            // TODO: Do poly generation while loading, if the points-level details are not necessary.

            // Must pad first, padding centers polygon as well somehow?


            
            // Translate based on try-out position
            for (let point_index = 0; point_index < geometry_points.length; point_index++) {
                //geometry_points[point_index].x += start_x;
                //geometry_points[point_index].y += start_y;
            }

            let rectanglePolygon = BASE.newPolygon(geometry_points);
            //rectanglePolygon.parent = top.poly;
            
            // console.log({rectanglePolygon:rectanglePolygon});
            rectanglePolygon = rectanglePolygon.rotateXY(rot);
            // console.log({rectanglePolygonP:rectanglePolygon});
  
            let rectanglePolygon_padded = [];
            rectanglePolygon_padded = POLY.expand([rectanglePolygon], padding, start_z, rectanglePolygon_padded, 1); 

            let translation_points_copy = rectanglePolygon_padded[0].points.clone();
            let after_padding_poly = BASE.newPolygon(translation_points_copy);
            let geometry_points2 = after_padding_poly.translatePoints(translation_points_copy, {x:start_x, y:start_y, z:start_z});

            let prismPolygon = BASE.newPolygon(geometry_points2);
            prismPolygon.depth = 0;
            prismPolygon.area2 = 0-prismPolygon.area(true);


            // console.log({prismPolygon:prismPolygon});
            
            // if (!debug_slice.tops[0].fill_sparse) debug_slice.tops[0].fill_sparse = [];
            // debug_slice.tops[0].fill_sparse.push(prismPolygon);
            //debug_slice.tops[0].fill_sparse.push(rectanglePolygon);
            //debug_slice.tops[0].fill_sparse.push(rectanglePolygon_padded[0]);
            return prismPolygon;

        }

        // make test object polygons
        function generateRectanglePolygon(start_x, start_y, start_z, length, width, rot, padding, debug_slice) {
            let rotation = rot * Math.PI / 180;
            let point1 = newPoint(start_x, start_y, start_z);
            let point2 = newPoint(start_x + length*Math.cos(rotation), start_y + length*Math.sin(rotation), start_z);
            let point3 = newPoint(point2.x + width*Math.sin(-rotation), point2.y + width*Math.cos(-rotation), start_z);
            let point4 = newPoint(start_x + width*Math.sin(-rotation), start_y + width*Math.cos(-rotation), start_z);
            let rect_points = [point1, point2, point3, point4];
            let rectanglePolygon = BASE.newPolygon(rect_points);
            //rectanglePolygon.parent = top.poly;
            rectanglePolygon.depth = 0;
            rectanglePolygon.area2 = length * width * 2;
            let rectanglePolygon_padded = [];
            rectanglePolygon_padded = POLY.expand([rectanglePolygon], padding, start_z, rectanglePolygon_padded, 1); 
            // console.log({rectanglePolygon:rectanglePolygon});
            // if (!debug_slice.tops[0].fill_sparse) debug_slice.tops[0].fill_sparse = [];
            // debug_slice.tops[0].fill_sparse.push(rectanglePolygon_padded[0]);
            return rectanglePolygon_padded[0];
        }

        // Function to translate adding pause layers into a string for the UI (and the export parser)
        function addPauseLayer(insertion_layer_index, settings) {
            if (settings.process.gcodePauseLayers == null) settings.process.gcodePauseLayers = "";
            if (settings.process.gcodePauseLayers != "") settings.process.gcodePauseLayers += ",";
            settings.process.gcodePauseLayers += insertion_layer_index.toString();
            console.log({pauselayer:insertion_layer_index});
            console.log({pause_layers:settings.process.gcodePauseLayers});
        }


        let depth = 0;

        while (down) {
            down = down.down;
            depth++;
        }
        //console.log({support_area: support_area});


        

        let books = [];
        // books.push({width:100.5, length:152.7, height:10.9});
        // books.push({width:136.8, length:190.1, height:24.1});


        function addOption(listOfOptions, length, width, height, title) {
            listOfOptions.push({width:width, length:length, height:height, minHeight:height, maxHeight:height, id:title, available:true, type:"simpleRectangle"});
        }

        function addStackableOptions(listOfOptions, initialHeight, addHeight, available, length, width, title) {
            let stackHeight = initialHeight;
            let stackedSoFar = 0;
            while (stackHeight < settings.device.maxHeight && stackedSoFar < available) { 
                addOption(listOfOptions, length, width, stackHeight, title);
                stackHeight = stackHeight + addHeight;
                stackedSoFar++;
            }
        }

        function addPrism(listOfOptions, prism_obj, minimum_prism_height) {
            listOfOptions.push({height:minimum_prism_height, minHeight:minimum_prism_height, maxHeight:minimum_prism_height+prism_obj.extension_range, id:prism_obj.name, available:true, type:"prism", prism_geometry:prism_obj.geometry_points});
        }

        /*
        addStackableOptions(books, 12.75, 9.55, 4, 31.85, 16, "Lego4x2Flat");
        addStackableOptions(books, 3.33, 3.33, 9, 89.9, 93.8, "FloppyDisc");
        addOption(books, 50.4, 24.95, 18.62, "wood_man");
        addOption(books, 45.15, 23.35, 14.82, "dark_wood");
        addOption(books, 25.05, 25.05, 18.8, "cube_with_dent");
        addOption(books, 44.35, 18.33, 10.16, "wood_bar_dirty");
        addOption(books, 97, 18.35, 11.18, "wood_bar_two_holes");
        addOption(books, 100.75, 18.52, 12.2, "wood_bar_math");
        addOption(books, 68.26, 50.46, 13.1, "wood_flat");
        addOption(books, 51, 25, 18.55, "wood_man_hair");
        addOption(books, 52.22, 24.9, 18.6, "wood_bar");
        addOption(books, 24.4, 24.4, 24.4, "XYZ_cube_filled");
        addOption(books, 27.31, 23.75, 10.55, "support_flat");
        addOption(books, 73, 10.43, 9.5, "support_bar");
        addOption(books, 73, 10.43, 9.5, "support_bar");
        addOption(books, 183.5, 80.1, 14.7, "foam_plate");
        addOption(books, 137.5, 55.57, 6.62, "wood_plate_small");
        addOption(books, 208.8, 164, 6.66, "wood_plate_large");
        addOption(books, 154.3, 105, 5.35, "saw_plate");
        addOption(books, 128.52, 68.25, 8.75, "medium_dense_foam_plate");
        */
        

        // addOption(books, 51, 25, 18.55, "wood_man_hair");

        for (let i = 0; i < prisms.length; i++){
            addPrism(books, prisms[i], 27);
            console.log({books:books});
        }
      
        
        // let test_books_rectangle_list = [generateRectanglePolygon(0, -20, slice.z, 5, 30, 0.0)];
        // test_books_rectangle_list.push(generateRectanglePolygon(0, 10, slice.z, 2, 2, 0));
        // test_books_rectangle_list.push(generateRectanglePolygon(0, 15, slice.z, 2, 2, 0));
        // test_books_rectangle_list.push(generateRectanglePolygon(0, 20, slice.z, 2, 2, 0));
        let test_books_rectangle_list = [];
        let support_area = 0;

        while (bottom_slice) {
            last_bottom_slice = bottom_slice;
            bottom_slice = bottom_slice.down;
        }
        bottom_slice = last_bottom_slice;
        console.log({bottom_slice: bottom_slice});

        let up = bottom_slice, up_collision_check = bottom_slice;

        let surrogate_settings = {};

        let search_padding = 15;
        // Search bounds
        const min_x = bottom_slice.widget.bounds.min.x - search_padding;
        const max_x = bottom_slice.widget.bounds.max.x + search_padding;
        const min_y = bottom_slice.widget.bounds.min.y - search_padding;
        const max_y = bottom_slice.widget.bounds.max.y + search_padding;
        const bedDepthArea = settings.device.bedDepth / 2;
        const bedWidthArea = settings.device.bedWidth / 2;
        const shift_x = bottom_slice.widget.track.pos.x;
        const shift_y = bottom_slice.widget.track.pos.y;
        let surrogate_number_goal = 1;
        let repetition_goal = 1000;
        let books_placed = [];
        let try_x = 0;
        let try_y = 0;
        let try_z = 0;
        let try_rotation = 0;
        let try_book = 0;
        let try_book_index = 0;
        let rotations = [0,45,90,135,180,225,270,315];
        let layer_height_fudge = settings.process.sliceHeight/1.75;
        let print_on_surrogate_extra_height_for_extrusion = 0;
        surrogate_settings.surrogate_padding = 0.1;
        surrogate_settings.min_squish_height = settings.process.sliceHeight/4;
        surrogate_settings.max_droop_height = settings.process.sliceHeight/4;
        surrogate_settings.minimum_clearance_height = settings.process.sliceHeight/4;

        let first_placed = true;

        console.log({pause_layers_start: settings.process.gcodePauseLayers});

        // console.log({widget: bottom_slice.widget});
        // console.log({widget_pos: bottom_slice.widget.track.pos});
        // console.log({bedDepth: settings.device.bedDepth});

        // console.log({bedwidth: settings.device.bedWidth});

        // console.log({shift_x: shift_x});
        // console.log({shift_y: shift_y});


        // Iterate, placing a book in every iteration
        for (let books_to_place = 0; books_to_place < surrogate_number_goal; books_to_place++) {
            let place_one_book = {};

            
            let sufficient = false; // TODO: Define what is sufficient to stop searching for better solutions
            let repetition_counter = 0;
            let epsilon_0_counter = 0;
            let best_delta_volume = 0;
            let best_insertion_layer_number_guess = 0;

            // Start at bottom
            up = bottom_slice;

            // Try out random options to place books
            while (sufficient === false && repetition_counter < (Math.floor(repetition_goal / surrogate_number_goal))) {
                let good = true;
                
                // Set walking slice to lowest slice
                

                // TODO: Remove after making sure volume check goes over all relevant slices
                if (!up.supports || up.supports.length === 0) {
                    up = up.up;
                    repetition_counter++;
                    console.log({going_up: "Going up because there were no supports on this slice my DUDE!!!!!!!"});
                    good = false;
                    continue;
                }

                let stack_on_book_index = Math.floor(Math.random() * (books_placed.length + 1)) - 1; // -1 to try to place it on buildplate
                try_x = Math.random() * (max_x - min_x) + min_x;
                try_y = Math.random() * (max_y - min_y) + min_y;
                try_z = 0; // TODO: Convert height to slice number???
                
                if (stack_on_book_index >= 0) {
                    // console.log({books_placed:books_placed});
                    // console.log({stack_on_book_index:stack_on_book_index});
                    try_z = books_placed[stack_on_book_index].starting_height + books_placed[stack_on_book_index].book.height;// + layer_height_fudge;
                }
                try_rotation = rotations[Math.floor(Math.random() * rotations.length)];
                try_book_index = Math.floor(Math.random() * books.length)
                try_book = books[try_book_index];
                let test_book_rectangle_list = []
                if (try_book.type == "simpleRectangle") {
                    test_book_rectangle_list = [generateRectanglePolygon(try_x, try_y, up.z, try_book.length, try_book.width, try_rotation, surrogate_settings.surrogate_padding, bottom_slice)];
                }
                else if (try_book.type == "prism") {
                    test_book_rectangle_list = [generatePrismPolygon(try_x, try_y, up.z, try_book.prism_geometry, try_rotation, surrogate_settings.surrogate_padding, bottom_slice)];
                }
                let collision = false;
                let overextended = false;
                let new_volume = 0, old_volume = 0;
                let delta_volume = 0;
                let insertion_layer_number_guess = 0;


                // Check if surrogate is available
                if (try_book.available === false) {
                    repetition_counter++;
                    good = false;
                    continue;
                }


                // Check that surrogates don't end on consecutive layers

                

                // Out of build-area check
                for (let book_poly of test_book_rectangle_list) {
                    // translate widget coordinate system to build plate coordinate system and compare with build plate size (center is at 0|0, bottom left is at -Width/2<|-Depth/2)
                    if (book_poly.bounds.maxx + shift_x > bedWidthArea || book_poly.bounds.minx + shift_x < -bedWidthArea || book_poly.bounds.maxy + shift_y > bedDepthArea || book_poly.bounds.miny + shift_y < -bedDepthArea || try_z + try_book.height > settings.device.bedDepth) {
                        // console.log({text:"Out of build area"});
                        // console.log({book_poly_bounds:book_poly.bounds})
                        // console.log({y_max:book_poly.bounds.maxy + shift_y})
                        // console.log({y_min:book_poly.bounds.miny + shift_y})
                        // console.log({max_area:bedDepthArea})
                        // console.log({min_area:-bedDepthArea})
                        repetition_counter++;
                        good = false;
                        continue;
                    }
                }

                // Stability check
                if (stack_on_book_index >= 0) {
                    let unsupported_polygons = [];
                    let unsupp_area = 0, full_area = 0;
                    POLY.subtract(test_book_rectangle_list, books_placed[stack_on_book_index].geometry, unsupported_polygons, null, up.z, min);
                    unsupported_polygons.forEach(function(unsupp) {
                        unsupp_area += Math.abs(unsupp.area());
                    });
                    test_book_rectangle_list.forEach(function(full) {
                        full_area += Math.abs(full.area());
                    });

                    // If less than half the area of the new book is supported by the book below, surrogate is unstable
                    //if ((unsupp_area * 2) > full_area) {
                    // For now, use 100% support instead
                    if (unsupp_area > 0) {
                        repetition_counter++;
                        good = false;
                        continue;
                    }
                }

                // // Get surrogate replaced volume
                // let iterate_layers_over_surrogate_height = bottom_slice;
                // while (iterate_layers_over_surrogate_height) {
                //     // Skip layers that are under the start height of the surrogate
                //     if (iterate_layers_over_surrogate_height.z < try_z) { // Approximation: If more than half of the slice height is surrogated, we count it fully 
                //         iterate_layers_over_surrogate_height = iterate_layers_over_surrogate_height.up;
                //         continue;
                //     } 

                //     // Skip layers that have no supports
                //     else if (!iterate_layers_over_surrogate_height.supports || iterate_layers_over_surrogate_height.supports.length === 0) {
                //         iterate_layers_over_surrogate_height = iterate_layers_over_surrogate_height.up;
                //         continue;
                //     }
                //     // Stop counting volume surrogate height has passed 
                //     else {
                //         let slice_height_range = get_height_range(iterate_layers_over_surrogate_height);
                //         if ((slice_height_range.bottom_height + surrogate_settings.min_squish_height) >= (try_book.height + try_z)) {
                //             break;
                //         }
                //     }
                    
                //     const volumes = getSurrogateReplacedVolumes(old_volume, new_volume, iterate_layers_over_surrogate_height, test_book_rectangle_list);
                //     old_volume = volumes[0];
                //     new_volume = volumes[1];


                //     // let unioned_supports = POLY.union(iterate_layers_over_surrogate_height.supports, null, true);
                //     // let combined_supports = POLY.flatten(iterate_layers_over_surrogate_height.supports);
                //     // console.log({unioned_supports:unioned_supports});
                //     // iterate_layers_over_surrogate_height.tops[0].fill_sparse.push(unioned_supports);

                //     if (!first_placed) {
                //         if (!iterate_layers_over_surrogate_height.tops[0].fill_sparse) iterate_layers_over_surrogate_height.tops[0].fill_sparse = [];
                //         iterate_layers_over_surrogate_height.supports.forEach(function(supp) {
                //             iterate_layers_over_surrogate_height.tops[0].fill_sparse.push(supp);
                //         });
                        
                        
                //         iterate_layers_over_surrogate_height.tops[0].fill_sparse.push(test_book_rectangle_list[0]);
                //         first_placed = true;
                //     }


                    


                //     iterate_layers_over_surrogate_height = iterate_layers_over_surrogate_height.up;
                // }
                
                // console.log({delta_volume:delta_volume});

                // Check collisions and calculate volume
                if (true) {
                    let iterate_layers_VandC = bottom_slice;

                    // Check for collision for the whole surrogate height
                    while (collision === false && iterate_layers_VandC && overextended === false) { // Stop after first collision found, or end of widget reached
                        
                        // Increase height until surrogate starting height is reached 
                        // Approximation: If more than half of the slice height is surrogated, we count it fully (for volume) #TODO: for collisions we might want to check for ANY overlap
                        if (iterate_layers_VandC.z < try_z) { // LWW TODO: Check at what height we actually want to start checking for collisions
                            iterate_layers_VandC = iterate_layers_VandC.up;
                            // console.log({going_up: "Going up because book is not on buildplate my DUDE!!!!!!!"});
                            continue;
                        }

                        // DON'T skip the layers, since we are looking for model polygons and previous surrogate supports
                        // Skip layers without support
                        // if (!iterate_layers_VandC.supports || iterate_layers_VandC.supports.length === 0) {
                        //     iterate_layers_VandC = iterate_layers_VandC.up;
                        //     console.log({going_up: "No support to check for collision found on this slice"});
                        //     continue;
                        // }


                        let calculating_volume = true;
                        let check_collisions = true;
                        let slice_height_range = get_height_range(iterate_layers_VandC);
                        
                        // Skip volume count for layers that have no supports
                        if (!iterate_layers_VandC.supports || iterate_layers_VandC.supports.length === 0) {
                            calculating_volume = false;
                        }
                        // Stop counting volume once surrogate height has passed 
                        else if ((slice_height_range.bottom_height + surrogate_settings.min_squish_height) >= (try_book.maxHeight + try_z)){
                            calculating_volume = false;
                        }

                        // stop checking collisions when surrogate top is higher than slice bottom + min squish height 
                        if ((slice_height_range.bottom_height + surrogate_settings.min_squish_height) >= (try_book.maxHeight + try_z)) { 
                            check_collisions = false;
                        }
                        
                        if (calculating_volume) {
                            const volumes = getSurrogateReplacedVolumes(old_volume, new_volume, iterate_layers_VandC, test_book_rectangle_list);
                            old_volume = volumes[0];
                            new_volume = volumes[1];
                        }

                        if (check_collisions) {
                            let collision_detection = [];
                            POLY.subtract(iterate_layers_VandC.topPolys(), test_book_rectangle_list, collision_detection, null, iterate_layers_VandC.z, min);
                            // console.log({test_book_rectangle_list:test_book_rectangle_list});
                            
                            let post_collision_area = 0, pre_collision_area = 0;
                            iterate_layers_VandC.topPolys().forEach(function(top_poly) {
                                pre_collision_area += Math.abs(top_poly.area());
                            });
                            collision_detection.forEach(function(top_poly) {
                                post_collision_area += Math.abs(top_poly.area());
                            });
                            
                            if (Math.abs(post_collision_area - pre_collision_area) > 0.00001) { // rounded the same
                                if ((slice_height_range.bottom_height + surrogate_settings.min_squish_height) < (try_book.minHeight + try_z)) {
                                    collision = true;
                                    continue;
                                }
                                else {
                                    try_book.height = iterate_layers_VandC.down.z; // TODO: Test whether this is the best previous height
                                    overextended = true;
                                    continue;
                                }
                                //console.log({collision_true: post_collision_area - pre_collision_area});
                            }

                            // Check collision with already placed surrogates as well
                            
                            if (books_placed.length >= 1) {
                                
                                for (let books_placed_idx = 0; books_placed_idx < books_placed.length; books_placed_idx++) {
                                    let previous_surrogate = books_placed[books_placed_idx];

                                    if (iterate_layers_VandC.z <= (previous_surrogate.book.height + previous_surrogate.starting_height) && iterate_layers_VandC.z >= previous_surrogate.starting_height) {

                                        collision_detection = [];
                                        
                                        POLY.subtract(test_book_rectangle_list, previous_surrogate.geometry, collision_detection, null, iterate_layers_VandC.z, min); // TODO: Check if Z matters
                                        
                                        post_collision_area = 0;
                                        pre_collision_area = 0;
                                        test_book_rectangle_list.forEach(function(top_poly) {
                                            pre_collision_area += Math.abs(top_poly.area());
                                        });
                                        collision_detection.forEach(function(top_poly) {
                                            post_collision_area += Math.abs(top_poly.area());
                                        });
                                        
                                        if (Math.abs(post_collision_area - pre_collision_area) > 0.00001) {
                                            if ((slice_height_range.bottom_height + surrogate_settings.min_squish_height) < (try_book.minHeight + try_z)) {
                                                collision = true;
                                                continue;
                                            }
                                            else {
                                                try_book.height = iterate_layers_VandC.down.z; // TODO: Test whether this is the best previous height
                                                overextended = true;
                                                continue;
                                            }
                                            //console.log({collision_true: post_collision_area - pre_collision_area});
                                        }
                                    }
                                }
                            }
                        }

                        // Out of range of surrogate, nothing left to do
                        if (check_collisions === false && calculating_volume === false) {
                            repetition_counter++;
                            break;
                        }

                        // Step up
                        iterate_layers_VandC = iterate_layers_VandC.up;
                        // insertion_layer_number_guess = iterate_layers_VandC.index;
                    }
                    if (collision) {
                        good = false;
                        repetition_counter++;
                        continue;
                    }

                }
                delta_volume = old_volume - new_volume;
                // console.log({delta_volume:delta_volume});



                // generate candidate and validation insertion case and layer
                let lower_book = [];
                let empty_array = [];
                let data_array = {insertion_case:"unknown"};
                if (stack_on_book_index >= 0) {
                    lower_book.push(books_placed[stack_on_book_index]);
                }
                let end_height = try_z + try_book.height;
                let candidate = {
                    geometry:test_book_rectangle_list, 
                    book:try_book, starting_height:try_z, 
                    end_height:end_height, 
                    down_surrogate:lower_book, 
                    up_surrogate:empty_array, 
                    outlines_drawn:0, 
                    insertion_data:data_array
                };

                // console.log({candidate:candidate});
                check_surrogate_insertion_case(candidate, bottom_slice, surrogate_settings);

                // Check if it is on a consecutive layer from a previous surrogate
                let consecutive = false;
                books_placed.forEach(function(surrogate) {
                    if (Math.abs(candidate.insertion_data.index - surrogate.insertion_data.index) === 1) {
                        consecutive = true;
                    }
                });
                if (consecutive) {
                    good = false;
                    repetition_counter++;
                    continue;
                }

                // Check if better valid position was found
                if (good === true && delta_volume > best_delta_volume) {
                    best_delta_volume = delta_volume;
                    place_one_book = candidate;
                }
                // If it is just as good --> choose the bigger one
                else if (good === true && delta_volume === best_delta_volume && delta_volume > 0) {
                    // Check if the new surrogate is bigger
                    if (!(Object.keys(place_one_book).length === 0) && place_one_book.geometry[0].area > test_book_rectangle_list[0].area) { // LWW TODO: Adjust for more complicated geometry
                        console.log({Notification:"A surrogate replaced the same amount of support, but was bigger"});
                        place_one_book = candidate;
                    }
                    else {
                        epsilon_0_counter++;
                    }
                }

                //console.log({best_delta_volume:best_delta_volume});

                repetition_counter++;
            }
            console.log({best_delta_volume:best_delta_volume});
            console.log({epsilon_0_counter:epsilon_0_counter});
            //test_books_rectangle_list.push(place_one_book.geometry[0])
            if (best_delta_volume > 1) { // TODO
                books_placed.push(place_one_book);
                place_one_book.book.available = false; // Mark book as used

                console.log({placed_book_name:place_one_book.book.id});
                // console.log({the_book:place_one_book.book});
                // console.log({the_book2:books[try_book_index]});
            }
        }

        console.log({books_placed:books_placed});


        // Remove supports based on surrogates placed
        up = bottom_slice;
        let top_slice = bottom_slice;
        // For all slices
        while (up) {

            

            // If supports exist
            if (up.supports && up.supports.length > 0) {

                if (!up.tops[0].fill_sparse) up.tops[0].fill_sparse = [];
                let rand_supp = up.supports[Math.floor(Math.random() * up.supports.length)];
                up.tops[0].fill_sparse.push(rand_supp);


                // For every book, surrogate the support
                //var surrogate;
                //for (surrogate in books_placed) {
                for (let idx = 0; idx < books_placed.length; idx++) {
                    let surrogate = books_placed[idx];
                    
                    if (surrogate.insertion_data.insertion_case === "Insert_new_support_layer") {
                        let up_height_range = get_height_range(up);
                        if (up_height_range.bottom_height < (surrogate.book.height + surrogate.starting_height) && up.z >= surrogate.starting_height) {
                            let surrogated_supports = [];
                            POLY.subtract(up.supports, surrogate.geometry, surrogated_supports, null, up.z, min); // TODO: Collect book polygons and do it only once
                            up.supports = surrogated_supports;
                        }
                    }
                    // If the book is at this height
                    else if (up.z < (surrogate.book.height + surrogate.starting_height) && up.z >= surrogate.starting_height) {
                        let surrogated_supports = [];
                        POLY.subtract(up.supports, surrogate.geometry, surrogated_supports, null, up.z, min); // TODO: Collect book polygons and do it only once
                        up.supports = surrogated_supports;
                    }
                }
            } else {
                up.supports = [];
            }

            // After surrogating all supports, draw their outlines
            for (let draw_outline_idx = 0; draw_outline_idx < books_placed.length; draw_outline_idx++) {
                let surrogate = books_placed[draw_outline_idx];
                // If the book is at this height
                if (up.z < (surrogate.book.height + surrogate.starting_height) && up.z >= surrogate.starting_height) {
                    if (surrogate.outlines_drawn < 5) {
                        // make surrogate bigger
                        // let surrogate_enlarged_more = [];
                        // let surrogate_enlarged = [];
                        // surrogate_enlarged_more = POLY.expand(surrogate.geometry, 0.4 + surrogate_enlargement, up.z, surrogate_enlarged_more, 1); // For a less tight fit
                        // surrogate_enlarged = POLY.expand(surrogate.geometry, surrogate_enlargement, up.z, surrogate_enlarged, 1); // For a less tight fit
                        let surrogate_enlarged = [];
                        let surrogate_double_enlarged = [];
                        surrogate_enlarged = POLY.expand(surrogate.geometry, 0.4, up.z, surrogate_enlarged, 1);
                        surrogate_double_enlarged = POLY.expand(surrogate_enlarged, 0.4, up.z, surrogate_double_enlarged, 1); 

                        
                        // subtract actual surrogate area to get only the outline
                        let surrogate_outline_area_only = [];
                        // POLY.subtract(surrogate_enlarged_more, surrogate_enlarged, surrogate_outline_area_only, null, up.z, min);
                        POLY.subtract(surrogate_enlarged, surrogate.geometry, surrogate_outline_area_only, null, up.z, min);

                        // surrogate_outline_area_only[0].points.forEach(function (point) {
                        //     point.z = point.z + 3.667686;
                        // });

                        // console.log({next_layer:up.up});
                        // Add outline to supports (will still be a double outline for now)
                        if (false) {
                        //if (!first_placed) { // Switch mode for first outline
                            up.tops[0].shells.push(surrogate_outline_area_only[0]);
                            first_placed = true;
                        } else {
                            //up.supports.push(surrogate_outline_area_only[0]);
                            if (!(up.tops[0].fill_sparse)) {
                                up.tops[0].fill_sparse = [];
                            }
                            surrogate_outline_area_only[0].points.push(surrogate_outline_area_only[0].points[0]);
                            console.log({points_poly:surrogate_outline_area_only[0]});
                            up.tops[0].fill_sparse.push(surrogate_outline_area_only[0]);
                            let supp_minus_outlines = [];

                            // Prevent overlap of outlines and support // LWW TODO: Try adding to support and combine the two
                            up.supports = POLY.subtract(up.supports, surrogate_double_enlarged, supp_minus_outlines, null, up.z, min);
                        }
                        
                        // console.log({surrogate_outline_area_only:surrogate_outline_area_only});

                        //console.log({up_support:up.supports});
                        //up.supports.push(surrogate.geometry[0]);
                        //console.log({geometry:surrogate.geometry});
                        surrogate.outlines_drawn++;
                    }

                    // Trying to add outlines directly
                    if (false) { //(surrogate.outlines_drawn >= 2 && surrogate.outlines_drawn <= 3) {
                        let surrogate_outline = [];
                        let surrogate_outline2 = [];
                        surrogate_outline = POLY.expand(surrogate.geometry, 0.1, up.z, surrogate_outline, 1);

                        let surrogate_outline_area_only = [];
                        POLY.subtract(surrogate_outline, surrogate.geometry, surrogate_outline_area_only, null, slice.z, min);
                        //POLY.expand(surrogate_outline, -0.2, up.z, surrogate_outline2);
                        //surrogate_outline[0].setOpen(true);
                        //surrogate_outline[0].points = surrogate_outline[0].points.slice(0, 3);
                        console.log({surrogate_outline_area_only:surrogate_outline_area_only});
                        //surrogate_outline[0].area2 = 0;
                        
                        //console.log({surrogate_outline2:surrogate_outline2});
                        up.supports.push(surrogate_outline_area_only[0]);
                        surrogate.outlines_drawn++;
                        let up_top_zero = up.tops[0];
                        if (!up_top_zero.fill_sparse) up_top_zero.fill_sparse = [];
                        //up_top_zero.fill_sparse.appendAll(surrogate_outline);

                    }
                }
            }
            top_slice = up;
            up = up.up; 
        } // top_slice should now be at the top

        // LWW TODO: Remove this warning check if insertion layers are too close
        let iterating_down = top_slice;
        books_placed.sort((a, b) => (a.insertion_data.new_layer_index > b.insertion_data.new_layer_index) ? 1 : -1);
        let last_surrogate;
        books_placed.forEach(function(surrogate) {
            if (last_surrogate && Math.abs(surrogate.insertion_data.new_layer_index - last_surrogate.insertion_data.new_layer_index) === 1) {
                console.log({WARNING:"Surrogates are on consecutive layers!"});
            }
            last_surrogate = surrogate;
        });


        // Adjust layer heights and slide in new layers at surrogate top ends
        while (iterating_down) {
            let surrogates_at_this_index = [];
            let all_other_surrogates = [];
            books_placed.forEach(function(surrogate) {
                if (surrogate.insertion_data.new_layer_index === iterating_down.index) {
                    surrogates_at_this_index.push(surrogate);
                }
                else {
                    all_other_surrogates.push(surrogate);
                }
            });
            
            if (surrogates_at_this_index.length >= 1) {
                // Add pause layer at index of already printed layer
                addPauseLayer(surrogates_at_this_index[0].insertion_data.printed_layer_index, settings);

                console.log({surrogates_at_this_index:surrogates_at_this_index});
                let new_layer_height_range = get_height_range(iterating_down);
                let printed_layer_height_range = get_height_range(iterating_down.down);
                let new_layer_new_height_values;
                let printed_layer_new_height_values;
                let change_slices = true;

                // Special case: Multiple surrogates on one slice
                if (surrogates_at_this_index.length > 1) {
                    console.log({Status:"Multiple surrogates."});
                    
                    let only_simple_case = true;
                    let lowest_height = Number.POSITIVE_INFINITY;
                    let highest_height = -1;
                    // Check which cases are present
                    surrogates_at_this_index.forEach(function(surrogate) {
                        if (highest_height < surrogate.insertion_data.max_height) highest_height = surrogate.insertion_data.max_height;
                        if (lowest_height > surrogate.insertion_data.min_height) lowest_height = surrogate.insertion_data.min_height;
                        if (surrogate.insertion_data.insertion_case != "extend_printed_layer") only_simple_case = false;         
                    });

                    if (only_simple_case) {
                        // set bot of new layer and top of printed layer to found max height == Extend both up
                        new_layer_new_height_values = get_slice_height_values(new_layer_height_range.top_height, highest_height);
                        printed_layer_new_height_values = get_slice_height_values(highest_height, printed_layer_height_range.bottom_height);
                        
                    }
                    else {
                        // set bot of new layer and top of printed layer to found min height (extrude down a lot) // LWW TODO: make sure z is high enough for all surrogates, droop as much as necessary
                        new_layer_new_height_values = get_slice_height_values(new_layer_height_range.top_height, lowest_height);
                        printed_layer_new_height_values = get_slice_height_values(lowest_height, printed_layer_height_range.bottom_height);
                    }
                    
                }
                // Simple cases: One surrogate on the slice
                else if (surrogates_at_this_index.length === 1) {
                    if (surrogates_at_this_index[0].insertion_data.insertion_case === "Insert_new_support_layer") {
                        change_slices = false;
                        let original_supports = surrogates_at_this_index[0].insertion_data.original_supports;
                        let only_support_above_this_surrogate = [];
                        let only_support_above_this_surrogate_2 = [];
                        // console.log({slideInSlice:surrogates_at_this_index[0]});
                        // console.log({iterating_down:iterating_down});
                        // console.log({iterating_down_DOWN:iterating_down.down});
                        
                        // Get only the diff of supports (after surrogating) from the printed slice
                        if (false) {
                            original_supports.forEach(function(original_supp) {
                                console.log({original_supp:original_supp});
                                let support_diff = original_supp;
                                if (iterating_down.down.supports) {
                                    iterating_down.down.supports.forEach(function(supp) {
                                        let full_arr = support_diff;
                                        let subtract_arr = supp;
                                        let out_arr = [];
                                        support_diff = POLY.subtract(full_arr, subtract_arr, out_arr, null, new_layer_height_range.bottom_height, min);
                                    });
                                }
                                // support_diff.forEach(function(diff) {
                                //     only_support_above_this_surrogate.push(diff);
                                // });
                                only_support_above_this_surrogate.push(support_diff);
                            });
                        }


                        // Support on the new slide-in slice are: 
                        //      - The original supports MINUS
                        //          - remaining supports
                        //          - other surrogate geometriues
                        // First collect all geometries that should be removed from original supports 
                        let collect_all_polygons_removed_from_support = [];
                        let collect_all_surrogate_geometries_removed_from_support = [];

                        // There will be overlap unless we expand the remaining supports
                        let support_enlarged = []
                        support_enlarged = POLY.expand(iterating_down.down.supports, 0.4, iterating_down.down.z, support_enlarged, 1);
                        support_enlarged.forEach(function(supp) {
                            collect_all_polygons_removed_from_support.push(supp);
                        });


                        all_other_surrogates.forEach(function(surrogate) {
                            collect_all_surrogate_geometries_removed_from_support = collect_all_surrogate_geometries_removed_from_support.concat(getSurrogateGeometryAtIndexHeight(surrogate, iterating_down.down.z));
                            // console.log({other_surrogate_geometries:getSurrogateGeometryAtIndexHeight(surrogate, iterating_down.down.z)});
                        });


                        console.log({collected_polygons:collect_all_polygons_removed_from_support});
                        console.log({collected_surrogate_geometries:collect_all_surrogate_geometries_removed_from_support});
                        // Get only the support on top of the current surrogate by subtracting original supports minus remaining supports/surrogates
                        // Must do this in two separate steps, otherwise the subtract function adds a new polygon where support/surrogate outlines meet
                        if (collect_all_polygons_removed_from_support.length > 0) {
                            POLY.subtract(original_supports, collect_all_polygons_removed_from_support, only_support_above_this_surrogate_2, null, new_layer_height_range.bottom_height, min);
                        } else {
                            only_support_above_this_surrogate_2 = original_supports;
                        }
                        if (only_support_above_this_surrogate_2.length > 0) {
                            POLY.subtract(only_support_above_this_surrogate_2, collect_all_surrogate_geometries_removed_from_support, only_support_above_this_surrogate, null, new_layer_height_range.bottom_height, min);
                        } else {
                            only_support_above_this_surrogate = only_support_above_this_surrogate_2;
                        }


                        // console.log({original_supports:original_supports});
                        // console.log({down_supports:iterating_down.down.supports});
                        // console.log({only_support_above_this_surrogate:only_support_above_this_surrogate});
                        
                        // Testing
                        // iterating_down.down.supports.forEach(function(supp) {
                        //     only_support_above_this_surrogate.push(supp);
                        // });

                        let slide_in_slice_height_values = get_slice_height_values(new_layer_height_range.bottom_height + surrogate_settings.minimum_clearance_height, surrogates_at_this_index[0].end_height, false);
                        let slide_in_slice = newSlice(slide_in_slice_height_values.z, view);
                        slide_in_slice.height = slide_in_slice_height_values.height;
                        slide_in_slice.widget = iterating_down.widget; 
                        slide_in_slice.extruder = iterating_down.extruder; 
                        slide_in_slice.isSparseFill = iterating_down.isSparseFill;
                        slide_in_slice.isSolidLayer = iterating_down.isSolidLayer;
                        slide_in_slice.offsets = iterating_down.offsets;
                        //slide_in_slice.finger = iterating_down.finger;
                        slide_in_slice.supports = only_support_above_this_surrogate;

                        slide_in_slice.down = iterating_down.down;
                        slide_in_slice.up = iterating_down;
                        iterating_down.down.up = slide_in_slice;
                        iterating_down.down = slide_in_slice;
                        slide_in_slice.index = iterating_down.index;

                        // Adjust all slice indexes above
                        iterating_down.index = iterating_down.index + 1;
                        let correcting_chain = iterating_down;
                        while (correcting_chain.up) {
                            correcting_chain = correcting_chain.up;
                            correcting_chain.index = correcting_chain.index + 1;
                        }

                        console.log({slide_in_slice:slide_in_slice});
                        console.log({iterating_down:iterating_down.index});
                        console.log({Case:"Insert_new_support_layer"})

                        // Now skip the newly added slice
                        iterating_down = iterating_down.down;
                    } 
                    else if (surrogates_at_this_index[0].insertion_data.insertion_case === "extend_printed_layer") {
                        let highest_height = surrogates_at_this_index[0].insertion_data.max_height;
                        new_layer_new_height_values = get_slice_height_values(new_layer_height_range.top_height, highest_height);
                        printed_layer_new_height_values = get_slice_height_values(highest_height, printed_layer_height_range.bottom_height);
                        console.log({iterating_down:iterating_down.index});
                        console.log({Case:"extend_printed_layer"})
                    }
                    else if (surrogates_at_this_index[0].insertion_data.insertion_case === "extend_new_layer") {
                        let lowest_height = surrogates_at_this_index[0].insertion_data.min_height;
                        new_layer_new_height_values = get_slice_height_values(new_layer_height_range.top_height, lowest_height);
                        printed_layer_new_height_values = get_slice_height_values(lowest_height, printed_layer_height_range.bottom_height);
                        console.log({iterating_down:iterating_down.index});
                        console.log({Case:"extend_new_layer"})
                    }
                }
                if (change_slices) {
                    iterating_down.z = new_layer_new_height_values.z;
                    iterating_down.height = new_layer_new_height_values.height;
                    iterating_down.down.z = printed_layer_new_height_values.z;
                    iterating_down.down.height = printed_layer_new_height_values.height;
                }
            }

            iterating_down = iterating_down.down;
            
        }


        // Old way of determining surrogates on a layer
        if (false) {
            up = bottom_slice;
            let heighest_surrogate_top = -1; // -1 means no surrogate ends in the previous layer
            // adjust following layer (only support?) heights based on surrogate top heights
            while (up) {
                // Set z of next layer to a height with good chance of sticking to surrogate, and adjust it's height accordingly // LWW TODO: Might want to change this to increase extrusion here
                if (heighest_surrogate_top > -1) {
                    let target_layer_top = up.z + up.height;
                    // up.z = heighest_surrogate_top + layer_height_fudge;
                    // up.height = (target_layer_top - up.z) + print_on_surrogate_extra_height_for_extrusion;

                    let slide_in_slice = newSlice(up.z, view);
                    //let slide_in_slice = up.z.clone();
                    //slide_in_slice.tops = up.tops;
                    slide_in_slice.widget = up.widget; 
                    slide_in_slice.extruder = up.extruder; 
                    slide_in_slice.isSparseFill = up.isSparseFill;
                    slide_in_slice.isSolidLayer = up.isSolidLayer;
                    slide_in_slice.offsets = up.offsets;

                    
                    slide_in_slice.down = up.down;
                    slide_in_slice.up = up;
                    up.down.up = slide_in_slice;
                    up.down = slide_in_slice;
                    slide_in_slice.index = up.index;
                    slide_in_slice.z = heighest_surrogate_top + layer_height_fudge;
                    slide_in_slice.height = (target_layer_top - slide_in_slice.z) + print_on_surrogate_extra_height_for_extrusion;
                    
                    // copy_supports(slide_in_slice, up);
                    
                    if (!slide_in_slice.supports) slide_in_slice.supports = [];
                    up.supports.forEach(function(supp) {
                        slide_in_slice.supports.push(supp);
                    });
                    
                    console.log({slide_in_slice:slide_in_slice});
                    console.log({slide_in_slide_supports:slide_in_slice.supports});
                    slide_in_slice.is_surrogate_end_slice = true;
                    

                    up.index = up.index + 1;
                    let correcting_chain = up;
                    while (correcting_chain.up) {
                        correcting_chain = correcting_chain.up;
                        correcting_chain.index = correcting_chain.index + 1;
                    }
                }

                heighest_surrogate_top = -1;

                // Find heighest surrogate that ends in the range of this layers thickness
                for (let heigh_surrogate_idx = 0; heigh_surrogate_idx < books_placed.length; heigh_surrogate_idx++) {
                    let surrogate = books_placed[heigh_surrogate_idx];
                    let end_Height = surrogate.book.height + surrogate.starting_height;
                    if (end_Height > up.z && end_Height < up.z + up.height && end_Height > heighest_surrogate_top) {
                        heighest_surrogate_top = end_Height;
                    }
                }
                up = up.up;
                if (up && up.is_surrogate_end_slice) up = up.up; // Skip the newly added layer
            }
        }

        console.log({done:"done"});
        bottom_slice.handled = true;
        let all_slices = [];
        up = bottom_slice;
        // For all slices
        while (up) {
            all_slices.push(up);
            up = up.up;
        }


        return all_slices;
    }

    /**
     * @param {number} linewidth
     * @param {number} angle
     * @param {number} density
     * @param {number} offset
     */
    function doSupportFill(slice, linewidth, density, minArea) {
        let supports = slice.supports,
            nsB = [],
            nsC = [],
            min = minArea || 0.1;

        if (!supports) return;

        // union supports
        supports = POLY.union(supports, undefined, true);

        // trim to clip offsets
        if (slice.offsets) {
            POLY.subtract(supports, slice.offsets, nsB, null, slice.z, min);
        }
        supports = nsB;

        // also trim to lower offsets, if they exist
        if (slice.down && slice.down.offsets) {
            POLY.subtract(nsB, slice.down.offsets, nsC, null, slice.z, min);
            supports = nsC;
        }

        if (supports) {
            fillSupportPolys(supports, linewidth, density, slice.z);
        }

        // re-assign new supports back to slice
        slice.supports = supports;
    };

    function fillSupportPolys(polys, linewidth, density, z) {
        // calculate fill density
        let spacing = linewidth * (1 / density);
        polys.forEach(function (poly) {
            // angle based on width/height ratio
            let angle = (poly.bounds.width() / poly.bounds.height() > 1) ? 90 : 0;
            // inset support poly for fill lines 33% of nozzle width
            let inset = POLY.offset([poly], -linewidth/3, {flat: true, z});
            // do the fill
            if (inset && inset.length > 0) {
                fillArea(inset, angle, spacing, poly.fill = []);
            }
            return true;
        });
    }

    /**
     *
     * @param {Slice} slice
     * @param {Polygon[]} polys
     * @param {number} count
     * @param {boolean} up
     * @param {boolean} first
     * @returns {*}
     */
    function projectSolid(slice, polys, count, up, first) {
        if (!slice || slice.isSolidLayer || count <= 0) {
            return;
        }
        let clones = polys.clone(true);
        if (first) {
            clones.forEach(function(p) {
                p.hintFillAngle();
            });
        }
        addSolidFills(slice, clones);
        if (count > 0) {
            if (up) projectSolid(slice.up, polys, count-1, true, false);
            else projectSolid(slice.down, polys, count-1, false, false);
        }
    }

    /**
     * given an array of arrays of points (lines), eliminate intersections
     * between groups, then return a unified array of shortest non-intersects.
     *
     * @returns {Point[]}
     */
    function cullIntersections() {
        function toLines(pts) {
            let lns = [];
            for (let i=0, il=pts.length; i<il; i += 2) {
                lns.push({a: pts[i], b: pts[i+1], l: pts[i].distTo2D(pts[i+1])});
            }
            return lns;
        }
        let aOa = [...arguments].filter(t => t);
        if (aOa.length < 1) return;
        let aa = toLines(aOa.shift());
        while (aOa.length) {
            let bb = toLines(aOa.shift());
            loop: for (let i=0, il=aa.length; i<il; i++) {
                let al = aa[i];
                if (al.del) {
                    continue;
                }
                for (let j=0, jl=bb.length; j<jl; j++) {
                    let bl = bb[j];
                    if (bl.del) {
                        continue;
                    }
                    if (UTIL.intersect(al.a, al.b, bl.a, bl.b, BASE.key.SEGINT)) {
                        if (al.l < bl.l) {
                            bl.del = true;
                        } else {
                            al.del = true;
                        }
                        continue;
                    }
                }
            }
            aa = aa.filter(l => !l.del).concat(bb.filter(l => !l.del));
        }
        let good = [];
        for (let i=0, il=aa.length; i<il; i++) {
            let al = aa[i];
            good.push(al.a);
            good.push(al.b);
        }
        return good.length > 2 ? good : [];
    }

    FDM.supports = function(settings, widget) {
        let process = settings.process;
        let size = process.sliceSupportSize;
        let min = process.sliceSupportArea || 1;
        let buf = new THREE.BufferGeometry();
        buf.setAttribute('position', new THREE.BufferAttribute(widget.vertices, 3));
        let mat = new THREE.MeshBasicMaterial();
        let geo = new THREE.Geometry().fromBufferGeometry(buf);
        let angle = (Math.PI / 180) * settings.process.sliceSupportAngle;
        let thresh = -Math.sin(angle);
        let dir = new THREE.Vector3(0,0,-1)
        let add = [];
        let mesh = new THREE.Mesh(geo, mat);
        let platform = new THREE.Mesh(
            new THREE.PlaneGeometry(1000,1000,1), mat
        );
        function tl(p1, p2) {
            let dist = p1.distanceTo(p2);
            let mp = new THREE.Vector3().add(p1).add(p2).divideScalar(2);
            if (dist >= size * 3) {
                tp(p1);
                tp(p2);
                let itr = Math.floor(dist / size);
                let seg = p2.clone().sub(p1).divideScalar(itr);
                let pnt = p1.clone();
                while (itr-- > 0) {
                    pnt.add(seg);
                    tp(pnt.clone());
                }
            } else if (dist >= size * 2) {
                tp(p1);
                tp(p2);
                tp(mp);
            } else if (dist >= size) {
                tp(p1);
                tp(p2);
            }
        }
        function tp(point) {
            if (point.added) {
                return;
            }
            for (let added of add) {
                let p2 = new THREE.Vector2(point.x, point.y);
                let pm = new THREE.Vector2(added.mid.x, added.mid.y);
                if (p2.distanceTo(pm) < 1) {
                    return;
                }
            }
            let ray = new THREE.Raycaster(point, dir);
            let int = ray.intersectObjects([ mesh, platform ], false);
            if (int && int.length && int[0].distance > 0.01) {
                let mid = new THREE.Vector3().add(point).add(int[0].point).divideScalar(2);
                add.push({from: point, to: int[0].point, mid});
                point.added = true;
            }
        }
        geo.faces.filter(f => f.normal.z < thresh).forEach(face => {
            let a = geo.vertices[face.a];
            let b = geo.vertices[face.b];
            let c = geo.vertices[face.c];
            // skip tiny faces
            if (BASE.newPolygon().addPoints([a,b,c]).area() < min) {
                return;
            }
            tp(new THREE.Vector3().add(a).add(b).add(c).divideScalar(3));
            tl(a,b);
            tl(b,c);
            tl(a,c);
        });
        widget.supports = add;
        return add.length > 0;
    };

})();
