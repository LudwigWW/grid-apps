// 英文。其他语言地图将遵循英语内容
// 映射缺少的键/值对
kiri.lang['zh'] = {
    // 通用键及菜单
    animate:        "动画",       // CAM动画按钮
    arrange:        "排布",       // 对工作区对象排版
    axis:           "轴",         // 左侧对象比例弹出菜单
    clear:          "清除",       // 清空工作区（移除所有对象）
    copy:           "复制",
    delete:         "删除",
    detail:         "详情",
    done:           "完成",
    enable:         "开启",
    export:         "导出",
    files:          "文件",
    help:           "帮助",
    ghost:          "透明",       // 左侧渲染弹出菜单（线框）
    hide:           "隐藏",       //  左侧渲染弹出菜单（不可见）
    home:           "主界面",
    import:         "导入",
    language:       "语言",
    machine:        "设备",       // 设备或机器
    metric:         "单位",
    name:           "名称",
    prefs:          "偏好",       // 左侧菜单“偏好设置”
    preview:        "预览",
    recent:         "最近",
    render:         "渲染",       // 左侧渲染弹出菜单
    reset:          "重置",
    rotate:         "旋转",       // 左侧旋转弹出菜单
    save:           "保存",
    scale:          "比例",       // 左侧对象比例弹出菜单
    setup:          "设定",
    settings:       "设置",
    size:           "大小",
    slice:          "切片",
    solid:          "实心",       // 浏览类型弹出菜单
    start:          "开始",
    tool:           "工具",
    tools:          "工具栏",     // CAM 工具菜单按钮
    top:            "顶面",
    type:           "类型",       // CAM 工具类型
    version:        "版本",
    view:           "视图",       // 左侧浏览弹出菜单
    wire:           "线框",       // 左侧渲染弹出菜单

    acct_xpo:       ["备份您的设备及","设备配置文件，","可选择包括工作区、","对象及位置。"],

    //右键内容菜单
    rc_clws:        "清楚工作区",
    rc_xpws:        "导出工作区",
    rc_lafl:        "平铺",
    rc_mirr:        "镜像",
    rc_dupl:        "拷贝",
    rc_xstl:        "导出为STL",

    //设备菜单及相关对话框
    dm_sldt:        "选择设备类型",
    dm_stdd:        "标准设备",
    dm_mydd:        "我的设备",
    dm_seld:        "所选设备",
    dm_rcnt:        "最近使用文件",
    dm_savs:        "预存设置",
    dm_appp:        "应用偏好设置",

    // CAM工具对话框
    td_tyem:        "立",        // 立铣刀
    td_tybm:        "球",        // 球刀
    td_tytm:        "锥",        // 锥度铣刀
    td_tonm:        "工具#",
    td_shft:        "轴",        // 立铣刀轴规格
    td_flut:        "槽",        //  立铣刀槽规格
    td_tapr:        "锥",        // 立铣刀锥规格

    // 设备对话组
    dv_gr_dev:      "设备",
    dv_gr_ext:      "喷头",
    dv_gr_out:      "输出",
    dv_gr_gco:      "gcode宏",

    // 设备对话 (_s = label, _l = hover help)
    dv_name_s:      "名称",
    dv_name_l:      "设备名称",
    dv_fila_s:      "线料",
    dv_fila_l:      "直径毫米数",
    dv_nozl_s:      "喷嘴",
    dv_nozl_l:      "直径毫米数",
    dv_bedw_s:      "宽度",
    dv_bedw_l:      "工作区单位",
    dv_bedd_s:      "深度",
    dv_bedd_l:      "工作区单位",
    dv_bedh_s:      "高度",
    dv_bedh_l:      ["最大建模高度","工作区单位数"],
    dv_spmx_s:      "最大转轴",
    dv_spmx_l:      ["最大转轴转速","0为禁用"],
    dv_xtab_s:      "绝对位置",
    dv_xtab_l:      "喷头以绝对位置运动",
    dv_orgc_s:      "原点",
    dv_orgc_l:      "机床原点",
    // dv_orgt_s:      "顶部原点",
    // dv_orgt_l:      "z部分顶部原点",
    dv_bedc_s:      "圆形机床",
    dv_bedc_l:      "设备机床为圆形",
    dv_belt_s:      "履带机床",
    dv_belt_l:      "持续打印机床",
    dv_retr_s:      "固件回抽",
    dv_retr_l:      ["设备固件支持G10/G11"],
    dv_fanp_s:      "风扇强度",
    dv_fanp_l:      "设定冷却风扇强度",
    dv_prog_s:      "进程",
    dv_prog_l:      "各进程输出 %",
    dv_layr_s:      "层",
    dv_layr_l:      ["在各层变换时","进行输出"],
    dv_tksp_s:      "符号间隔",
    dv_tksp_l:      ["在gcode轴参数间","添加空隙","G0X0Y0X0","vs","G0 X0 Y0 Z0"],
    dv_strc_s:      "删除注释",
    dv_strc_l:      ["删除gcode注释","注释以;开头"],
    dv_fext_s:      "文件扩展名",
    dv_fext_l:      "文件扩展名",
    dv_dwll_s:      "驻留",
    dv_dwll_l:      "gcode驻留脚本",
    dv_tool_s:      "更换工具",
    dv_tool_l:      "工具更换脚本",
    dv_sspd_s:      "转轴转速",
    dv_sspd_l:      "设定转轴转速",
    dv_paus_s:      "暂停",
    dv_paus_l:      "gcode 暂停脚本",
    dv_head_s:      "header",
    dv_head_l:      "gcode header脚本",
    dv_foot_s:      "footer",
    dv_foot_l:      "gcode footer脚本",
    dv_lzon_s:      "激光 启用",
    dv_lzon_l:      "gcode 激光启用脚本",
    dv_lzof_s:      "激光 禁用",
    dv_lzof_l:      "gcode 激光禁用脚本",
    dv_exts_s:      "选中",
    dv_exts_l:      "gcode 运行以启用改喷头",
    dv_dext_s:      "取消勾选",
    dv_dext_l:      "启用另一喷头前运行gcode",
    dv_extd_s:      "取消勾选",
    dv_extd_l:      "取消选中该喷头的gcode",
    dv_exox_s:      "偏置 x",
    dv_exox_l:      "喷嘴偏置 x",
    dv_exoy_s:      "偏置 y",
    dv_exoy_l:      "喷嘴偏置 y",

    // 模式
    mo_menu:        "模式",
    mo_fdmp:        "FDM打印",
    mo_slap:        "SLA模式",
    mo_lazr:        "激光切割",
    mo_cncm:        "CNC铣刀",

    // 设置
    su_menu:        "设置",
    su_devi:        "设备",
    su_tool:        "工具",
    su_locl:        "本地",
    su_xprt:        "导出",
    su_help:        "帮助",

    //载入
    fe_menu:        "文件",
    fn_recn:        "最近文件",
    fn_impo:        "导入",

    // 功能
    fn_menu:        "动作",
    fn_arra:        "排布",
    fn_slic:        "切片",
    fn_prev:        "预览",
    fn_expo:        "导出",

    // 视图
    vu_menu:        "视图",
    vu_home:        "首页",
    vu_rset:        "重置",
    vu_sptp:        "顶面",
    vu_spfr:        "正面",
    vu_splt:        "左侧",
    vu_sprt:        "右侧",

    // 工作区
    ws_menu:        "预览",
    ws_save:        "保存",
    ws_cler:        "清除",

    // 设定
    op_menu:        "界面",
    op_disp:        "显示",
    op_xprt_s:      "专家模式",
    op_xprt_l:      "显示更多设定选项",
    op_decl_s:      "贴花",
    op_decl_l:      "显示设备贴花及logo",
    op_dang_s:      "实验",
    op_dang_l:      "显示实验参数",
    op_hopo_s:      "悬停弹出",
    op_hopo_l:      ["启用菜单悬停","激活"],
    op_dark_s:      "暗色模式",
    op_dark_l:      "暗色界面",
    op_comp_s:      "紧凑UI",
    op_comp_l:      ["紧凑的用户界面","适用于小屏幕","及平板"],
    op_shor_s:      "显示原点",
    op_shor_l:      "显示设备或进程原点",
    op_shru_s:      "显示标尺",
    op_shru_l:      ["在主要参考线上","显示轴标尺"],
    op_sped_s:      "显示速度",
    op_sped_l:      ["在预览模式下","以色码显示速度"],
    op_auto_s:      "自动排版",
    op_auto_l:      ["添加新项目时","自动进行排版"],
    op_free_s:      "自定义布局",
    op_free_l:      ["允许拖放布局","激光模式下不产生影响"],
    op_spcr_s:      "间距",
    op_spcr_l:      ["自动排版时","以工作区单位表示的","对象间距"],
    op_orth_s:      "正交",
    op_orth_l:      ["正交显示","需要刷新页面"],
    op_invr_s:      "反向缩放",
    op_invr_l:      ["反转鼠标滚轮","滚动缩放"],
    op_save_s:      "自动保存",
    op_save_l:      ["在应用重新加载之间","保存工作区内的对象"],
    op_line_s:      "线条类型",
    op_line_l:      ["路径渲染用的线条类型","影响3D性能","路径：3D最佳","平面：2D适用","线条 = 1D 最速"],
    op_unit_s:      "单位",
    op_unit_l:      ["工作区单位影响","速度与距离"],
    op_anim_s:      "动画",
    op_anim_l:      ["动画网格密度","高数值为高密度","占用更多内存","且更慢"],

    lo_menu:        "布局",

    pt_menu:        "部件",
    pt_deci_s:      "抽取",
    pt_deci_l:      ["在导入时启用或禁用点抽取","以加快切片速度","并减少耗用内存"],
    pt_qual_s:      "质量",
    pt_qual_l:      ["切片过程中","维持的细节程度","越低速度越快"],
    pt_heal_s:      "修复网格",
    pt_heal_l:      ["尝试修复","非流形网格","延长切片耗时"],

    xp_menu:        "输出",

    //设定
    se_menu:        "设定",
    se_load:        "载入",
    se_save:        "存储",

    // FDM 切片
    sl_menu:        "层",
    sl_lahi_s:      "高度",
    sl_lahi_l:      ["各切片层高度","毫米数"],
    ad_minl_s:      "最小高度",
    ad_minl_l:      ["适应性最小层高","毫米数","不能为零"],
    sl_ltop_s:      "顶层",
    sl_ltop_l:      ["在打印顶部","执行的","固体层数"],
    sl_lsld_s:      "固体层",
    sl_lsld_l:      ["根据图层增量计算的","实心填充区域。见","层弹出菜单"],
    sl_lbot_s:      "底层",
    sl_lbot_l:      ["在打印底部","执行的","固体层数"],
    ad_adap_s:      "适应性",
    ad_adap_l:      ["使用适应性层高","其中‘层高’代表最大值","‘最小层’代表最小值"],

    // FDM 外壳
    sl_shel_s:      "外壳数",
    sl_shel_l:      ["需生成的","围墙数"],
    sl_ordr_s:      "外壳顺序",
    sl_ordr_l:      ["输出外壳顺序","由内至外","或由外至内","影响表面质量"],
    sl_strt_s:      "层始点",
    sl_strt_l:      ["层的始发点","最终 = 最终层截止处","中心 = 部件中心","原点 = 设备原点"],
    ad_thin_s:      "薄壁",
    ad_thin_l:      ["检测并填补","外壳间隙"],

    // FDM 填充
    fi_menu:        "填充",
    fi_type:        "填充类型",
    fi_pcnt_s:      "填充分数",
    fi_pcnt_l:      ["填充密度","0.0 - 1.0"],
    fi_angl_s:      "固体开始",
    fi_angl_l:      ["起始角度","给以下每一层","增加90度","仅适用于固体层"],
    fi_wdth_s:      "固体宽度",
    fi_wdth_l:      ["固体填充线宽","数值为喷头宽度的一部分","< 1时密度更高","适用于表面处理","0.0 - 1.0"],
    fi_over_s:      "外壳重叠",
    fi_over_l:      ["与外壳及其他填充重叠","数值为喷头直径的一部分","0.0 - 2.0"],
    // fi_rate_s:      "打印速度",
    fi_rate_l:      ["线料喷出速度","设为0以使用默认","输出打印速度"],

    // FDM 第一层
    fl_menu:        "基座",
    fl_lahi_s:      "层高",
    fl_lahi_l:      ["每一切片厚度的","毫米数","应该≥切片厚度"],
    fl_rate_s:      "外壳速度",
    fl_rate_l:      ["外壳打印最大速度","以毫米/分钟表示"],
    fl_frat_s:      "填充速度",
    fl_frat_l:      ["填充打印最大速度","以毫米/分钟表示"],
    fl_mult_s:      "流量系数",
    fl_mult_l:      ["喷出倍数","0.0 - 2.0"],
    fl_sfac_s:      "宽度系数",
    fl_sfac_l:      ["喷头大小倍数","改变线的间隔"],
    fl_skrt_s:      "裙边数",
    fl_skrt_l:      ["需生成的首层偏置","边缘数"],
    fl_skro_s:      "裙边偏置",
    fl_skro_l:      ["距离部件的裙边偏置","毫米数"],
    fl_nozl_s:      "喷嘴加热温度",
    fl_nozl_l:      ["以摄氏度表示","该数值为0时","使用的输出设定"],
    fl_bedd_s:      "热床温度",
    fl_bedd_l:      ["以摄氏度表示","该数值为0时","使用的输出设定"],
    fr_spac_s:      "底座空隙",
    fr_spac_l:      ["第一层和底座之间的","额外空隙","毫米数"],
    fr_nabl_s:      "启用底座",
    fr_nabl_l:      ["在模型下方创建底座","以增强粘附性","使用裙边偏置并","禁用裙边输出"],

    // FDM 打印带专用
    fl_zoff_s:      "打印带偏置",
    fl_zoff_l:      ["最低挤出","打印带偏置高度","毫米数"],
    fl_brim_s:      "边缘尺寸",
    fl_brim_l:      ["在部件底部增加裙边","尺寸为宽度毫米数","设为0以禁用"],
    fl_brmn_s:      "裙边触发",
    fl_brmn_l:      ["仅在面向打印带的区域比","该数值短时增加裙边","数值以毫米表示","0 = 无穷"],
    fl_bled_s:      "部件锚点",
    fl_bled_l:      ["开始打印时","打印带上的部件锚点","毫米数"],

    // FDM 支撑
    sp_menu:        "支撑",
    sp_detect:      "检测",
    sp_dens_s:      "密度",
    sp_dens_l:      ["分数 0.0 - 1.0","建议值 0.15","0为禁用"],
    sp_size_s:      "柱子尺寸",
    sp_size_l:      ["柱宽","毫米数"],
    sp_offs_s:      "部件偏置",
    sp_offs_l:      ["部件偏置","毫米数"],
    sp_gaps_s:      "空隙层",
    sp_gaps_l:      ["从部件偏置的","层数"],
    sp_span_s:      "最大范围",
    sp_span_l:      ["触发生成新支撑柱的","不受支撑的范围距离","毫米数"],
    sp_angl_s:      "最大角度",
    sp_angl_l:      ["需要生成支撑柱前的","最大悬空角度"],
    sp_area_s:      "最小区域",
    sp_area_l:      ["支撑柱所需的","最小区域","毫米数"],
    sp_xpnd_s:      "扩张",
    sp_xpnd_l:      ["支撑区域从","部件边缘扩张的","毫米数"],
    sp_nozl_s:      "喷头",
    sp_nozl_l:      ["在多喷头系统中","喷出支撑材料的","喷头"],
    sp_auto_s:      "自动",
    sp_auto_l:      ["启用生成支撑","使用切片当时几何","支撑只会在","切片完成后生成"],

    // LASER 切片
    ls_offs_s:      "偏置",
    ls_offs_l:      ["调整激光宽度","毫米数"],
    ls_lahi_s:      "高度",
    ls_lahi_l:      ["层高","毫米数","0 = 自动/测量"],
    ls_lahm_s:      "最小值",
    ls_lahm_l:      ["最小层高","将以该厚度","并入自动切片","（以毫米计算）"],
    ls_sngl_s:      "单层",
    ls_sngl_l:      ["仅以特定层高","切割一层"],

    // CNC 通用术语
    cc_tool:        "工具",
    cc_offs_s:      "偏置",
    cc_offs_l:      ["将工具中心从","所选路径偏置"],
    cc_spnd_s:      "转轴转速",
    cc_spnd_l:      ["转轴速","以 转/分钟 表示"],
    cc_sovr_s:      "步过",
    cc_sovr_l:      ["工具直径的","一部分"],
    cc_sdwn_s:      "降压",
    cc_sdwn_l:      ["每次通过后","降低的深度","以工作区单位表示","设为0以禁用"],
    cc_feed_s:      "输入率",
    cc_feed_l:      ["最大切割速率","以 工作区单位/分钟 表示"],
    cc_plng_s:      "切入率",
    cc_plng_l:      ["最大z轴速度","以 工作区单位/分钟 表示"],
    cc_sngl_s:      "仅选取线条",
    cc_sngl_l:      ["仅选中单侧边","不选中相邻多边形"],

    // CNC 通用
    cc_menu:        "限值",
    cc_flip:        "翻转",
    cc_rapd_s:      "xy输入",
    cc_rapd_l:      ["最大 xy 移动输入","以 工作区单位/分钟 表示"],
    cc_rzpd_s:      "z 输入",
    cc_rzpd_l:      ["最大 z 移动输入","以 工作区单位/分钟 表示"],

    cc_loff_s:      "偏置",
    cc_loff_l:      ["实行水平通过所需","与库存面间的距离","以工作区单位表示"],

    // CNC 粗加工
    cr_menu:        "粗加工",
    cr_lsto_s:      "库存面距离",
    cr_lsto_l:      ["为最终通过留下的","距离垂直库存面的水平偏置","以工作区单位表示"],
    cr_ease_s:      "渐缓",
    cr_ease_l:      ["切入切割将","螺旋下降或","沿线性路径渐缓"],
    cr_clrt_s:      "清理顶面",
    cr_clrt_l:      ["在部件的边界区域","进行一次清理","清理位置为 z = 0"],
    cr_clrp_s:      "清理缺口",
    cr_clrp_l:      ["将口袋内侧磨平","而不是仅清理轮廓"],
    cr_clrf_s:      "清理表面",
    cr_clrf_l:      ["内插降压以","清除所有检测到的平坦区域"],
    cr_olin_s:      "仅内部",
    cr_olin_l:      ["限制对内部边界","的切割"],

    // CNC OUTLINE
    co_menu:        "轮廓",
    co_dogb_s:      "狗骨头",
    co_dogb_l:      ["在内角插入","狗骨头切割"],
    co_wide_s:      "宽切除",
    co_wide_l:      ["加宽外部切割路径","以对硬材料进行深切割"],
    co_olin_s:      "仅内部",
    co_olin_l:      ["限制对内部边界","的切割"],
    co_olot_s:      "仅外部",
    co_olot_l:      ["限制对外部边界","的切割","此处可以视作","投影轮廓"],
    co_omit_s:      "略过",
    co_omit_l:      "消除孔洞",
    co_olen_s:      "启用",
    co_olen_l:      "启用轮廓切割",

    // CNC 轮廓
    cn_menu:        "边界",
    cf_angl_s:      "最大角度",
    cf_angl_l:      ["比该数值更大的角度","将视为垂直"],
    cf_curv_s:      "仅弧面",
    cf_curv_l:      ["限制对弧面的","线性清理"],
    cf_olin_s:      "仅内部",
    cf_olin_l:      ["限制对内部边界","的切割"],
    cf_linx_s:      "启用 y 通过",
    cf_linx_l:      "线性y轴修整",
    cf_liny_s:      "启用 x 通过",
    cf_liny_l:      "线性x轴修整",

    // CNC 追踪
    cu_menu:        "追踪",
    cu_type_s:      "类型",
    cu_type_l:      ["跟踪 = 工具头追踪线条","向右或向左 = 工具头","根据工具范围跟踪线条"],

    // CNC 钻孔
    cd_menu:        "钻孔",
    cd_axis:        "轴",
    cd_points:      "点",
    cd_plpr_s:      "切入 每",
    cd_plpr_l:      ["两次驻留间的","最深切入","以工作区单位表示","设为0以禁用"],
    cd_dwll_s:      "驻留时间",
    cd_dwll_l:      ["两次切入铣削间","的驻留时间","以微秒表示"],
    cd_lift_s:      "钻头提升",
    cd_lift_l:      ["驻留时间后","两次切入间的提升距离","以工作区单位表示","设为0以禁用"],
    cd_regi_s:      "定位",
    cd_regi_l:      ["为双面部件","钻定位孔","独立于钻孔启用","但使用同样的","工具和设置"],

    // CNC CUTOUT TABS
    ct_menu:        "标签",
    ct_angl_s:      "角度",
    ct_angl_l:      ["标签间隔的起始角度","度数 （0-360）"],
    ct_numb_s:      "数量",
    ct_numb_l:      ["使用的标签数","将在部件周围","均匀分布"],
    ct_wdth_s:      "宽度",
    ct_wdth_l:      "以工作区单位表示的宽度",
    ct_hght_s:      "高度",
    ct_hght_l:      "以工作区单位表示的宽度",
    ct_dpth_s:      "深度",
    ct_dpth_l:      ["以工作区单位表示的","标签从部件表面","投射的深度"],
    ct_midl_s:      "中位线",
    ct_midl_l:      ["处理双面部件时","使用标签的中位线","而非z底部"],
    ct_nabl_s:      "自动",
    ct_nabl_l:      ["使用数量和角度偏置","自动生成从部件中心","投影的径向标签"],

    // 输出
    ou_menu:        "输出",

    // 激光刀
    dk_menu:        "刀",
    dk_dpth_s:      "切割深度",
    dk_dpth_l:      ["最终切割深度","毫米数"],
    dk_pass_s:      "切割次数",
    dk_pass_l:      ["实现切割深度的","切割次数"],
    dk_offs_s:      "刀尖偏置",
    dk_offs_l:      ["刀尖至工具中心","的距离","毫米数"],

    // 输出 激光
    ou_spac_s:      "间距",
    ou_spac_l:      ["层输出间距","毫米数"],
    ou_scal_s:      "倍增",
    ou_scal_l:      "乘数 （0.1至100）",
    ou_powr_s:      "功率",
    ou_powr_l:      ["0 - 100","代表%"],
    ou_sped_s:      "速度",
    ou_sped_l:      "毫米/分钟",
    ou_mrgd_s:      "合并",
    ou_mrgd_l:      ["合并所有层","并用色码表示","层叠深度"],
    ou_grpd_s:      "组合",
    ou_grpd_l:      ["将各层保留为","统一分组","而不是独立的","多边形"],
    ou_layr_s:      "层顺序",
    ou_layr_l:      ["输出层顺序","从右上到","左下"],
    ou_layo_s:      "层色",
    ou_layo_l:      ["被合并覆盖后的","各Z系数","输出层的颜色"],
    ou_drkn_s:      "拖动激光刀",
    ou_drkn_l:      ["在gcode中启用","拖动输出","切割半径","藉由切入","加到边角上"],

    // 输出 FDM
    ou_nozl_s:      "喷嘴加热温度",
    ou_nozl_l:      "摄氏度",
    ou_bedd_s:      "热床温度",
    ou_bedd_l:      "摄氏度",
    ou_feed_s:      "打印速度",
    ou_feed_l:      ["最大打印速度","毫米/分钟"],
    ou_fini_s:      "完成速度",
    ou_fini_l:      ["最外壳速度","毫米/分钟"],
    ou_move_s:      "移动速度",
    ou_move_l:      ["不打印时的移动速度","毫米/分钟","0 = 启用G0动作"],
    ou_shml_s:      "外壳参数",
    ou_flml_s:      "实体参数",
    ou_spml_s:      "填充参数",
    ou_exml_l:      ["喷嘴乘数","0.0 - 2.0"],
    ou_fans_s:      "风扇速度",
    ou_fans_l:      "0 - 255",

    // 输出 CAM
    ou_toll_s:      "容错",
    ou_toll_l:      ["表面精确度","以工作区单位表示","数值越小速度越慢","且占用更多内存","0 = 基于动画偏好","自动计算"],
    ou_zanc_s:      "z 锚点",
    ou_zanc_l:      ["控制当库存Z超过部件Z时","的部件位置"],
    ou_ztof_s:      "z 偏置",
    ou_ztof_l:      ["以工作区单位表示的","Z锚点偏置","在锚点位于中央时","不产生影响"],
    ou_zbot_s:      "z 底部",
    ou_zbot_l:      ["用于限制切割深度的","距离部件底部的偏置","以工作区单位表示"],
    ou_zclr_s:      "z 安全区",
    ou_zclr_l:      ["从部件顶部的","安全移动区偏置","以工作区单位表示"],
    ou_ztru_s:      "z 穿透",
    ou_ztru_l:      ["向下延伸切口","以工作区单位表示"],
    ou_conv_s:      "传统",
    ou_conv_l:      ["铣削方向","取消勾选以设为‘爬升’"],
    ou_depf_s:      "深度优先",
    ou_depf_l:      ["用深度优先","优化腔铣"],

    // CAM STOCK
    cs_menu:        "库存",
    cs_wdth_s:      "宽度",
    cs_wdth_l:      ["以工作区单位表示的宽度 (x)","0 默认为部件尺寸"],
    cs_dpth_s:      "深度",
    cs_dpth_l:      ["以工作区单位表示的深度 (y)","0 默认为部件尺寸"],
    cs_hght_s:      "高度",
    cs_hght_l:      ["以工作区单位表示的高度 (z) ","0 默认为部件尺寸"],
    cs_offs_s:      "偏置",
    cs_offs_l:      ["用宽度、深度、高度","作为从平台最大部件","尺寸的偏置值"],
    cs_clip_s:      "夹到",
    cs_clip_l:      ["粗加工和轮廓","将切割路径夹到","定义的库存"],
    cs_offe_s:      "启用",
    cs_offe_l:      "启用铣削库存",

    // 零点 (CAM & 激光)
    or_bnds_s:      "零点边界",
    or_bnds_l:      ["零点相对于","所有对象的边界"],
    or_cntr_s:      "原始零点",
    or_cntr_l:      "以中心为零点",
    or_topp_s:      "原始顶部",
    or_topp_l:      "以对象顶部为原始顶部",

    // FDM 高级
    ad_menu:        "专家",
    ad_rdst_s:      "回抽距离",
    ad_rdst_l:      ["长动作线料回抽量","以毫米表示"],
    ad_rrat_s:      "回抽速率",
    ad_rrat_l:      ["线料回抽速率","以 毫米/秒 表示"],
    ad_rdwl_s:      "启用驻留",
    ad_wpln_s:      "回抽扫动",
    ad_wpln_l:      ["回抽后的","非打印移动","毫米数"],
    ad_rdwl_l:      ["重新激活线料和动作","的间隔","毫秒数"],
    ad_scst_s:      "外壳滑过",
    ad_scst_l:      ["外围外壳","非打印端","毫米数"],
    ad_msol_s:      "最小固体",
    ad_msol_l:      ["维持固体所需的","最小区域（平方毫米）","必须>0.1"],
    ad_mins_s:      "最小速度",
    ad_mins_l:      ["短距离的","最小速度"],
    ad_spol_s:      "短路径",
    ad_spol_l:      ["比这更短的多边形","的打印速度将","降低到最小速度","以毫米表示"],
    ad_arct_s:      "拱形容忍",
    ad_arct_l:      ["将多面线转换为拱形","配对拱形点时的","中心漂移容忍度","采用约0.15的数值","数值以毫米表示","设为0以禁用"],
    ad_zhop_s:      "z 跳跃距离",
    ad_zhop_l:      ["回抽过程中","z的提升高度","毫米数","设为0以禁用"],
    ad_abkl_s:      "防反冲",
    ad_abkl_l:      ["为取得更好的平面效果","使用微动作以抵消","固体层输出中的反冲","以毫米表示","设为0以禁用","若您的固件包含M425","请将脚本置入gcode header","并将数值保留为0"],
    ad_lret_s:      "层回抽",
    ad_lret_l:      ["在层与层之间","强制回收线料"],
    ad_play_s:      "层抛光",
    ad_play_l:      ["一次性给指定的","#层抛光"],
    ad_pspd_s:      "抛光速度",
    ad_pspd_l:      ["抛光速度","以毫米/分钟表示"],

    // CAM 专家
    cx_fast_s:      "跳过阴影",
    cx_fast_l:      ["禁用悬挂检测","可提升速度并减少","复杂模型的内存占用","但不与悬挂兼容","如果上阴影时切片悬浮","请尝试启用"],

    // FDM GCODE
    ag_menu:        "gcode",
    ag_nozl_s:      "喷头",
    ag_nozl_l:      "选择输出喷口或喷头",
    ag_peel_s:      "防翘边",
    ag_peel_l:      ["从打印带Z位置开始","阶段性将打印物从打印带上取下","然后放回以去除黏连","并防止滚动瑕疵"],
    ag_paws_s:      "暂停层",
    ag_paws_l:      ["用逗号隔开的层","在各层前添加暂停指令"],
    ag_loop_s:      "循环层",
    ag_loop_l:      ["使用以下格式的层重复范围","首层-末层-次数，首层-末层-次数，……","忽略次数 = 1"],

    // SLA 菜单
    sa_menu:        "切片",
    sa_lahe_s:      "层高",
    sa_lahe_l:      ["层高","毫米数"],
    sa_shel_s:      "空壳",
    sa_shel_l:      ["壳厚毫米数","为层高倍数","0为实心（禁用）"],
    sa_otop_s:      "打开顶部",
    sa_otop_l:      ["如果外壳已启用","则形成开放顶部"],
    sa_obas_s:      "打开基座",
    sa_obas_l:      ["若外壳已启用","则形成开放基座","支撑将禁用该功能"],

    sa_layr_m:      "层",
    sa_lton_s:      "曝光时间",
    sa_lton_l:      ["层曝光","秒数"],
    sa_ltof_s:      "灯灭时间",
    sa_ltof_l:      ["层灯灭","秒数"],
    sa_pldi_s:      "剥离距离",
    sa_pldi_l:      ["剥离距离","毫米数"],
    sa_pllr_s:      "剥离提升速率",
    sa_pllr_l:      ["剥离提升速率","以 毫米/秒 表示"],
    sa_pldr_s:      "剥离跌落速度",
    sa_pldr_l:      ["剥离跌落速度","以 毫米/秒 表示"],

    sa_base_m:      "基座",
    sa_balc_s:      "层数",
    sa_balc_l:      ["底层","层数"],
    sa_bltn_l:      ["底层曝光","秒数"],
    sa_bltf_l:      ["底层灯灭","秒数"],

    sa_infl_m:      "填充",
    sa_ifdn_s:      "密度",
    sa_ifdn_l:      ["要求外壳的","填充百分比","0 = 禁用","有效范围 0.0 - 1.0"],
    sa_iflw_s:      "线宽",
    sa_iflw_l:      ["剖面线宽度","毫米数"],

    sa_supp_m:      "支撑",
    sa_slyr_s:      "基座层",
    sa_slyr_l:      ["基座支撑层","数值范围0-10"],
    sa_slgp_s:      "空隙层",
    sa_slgp_l:      ["支架和物品底部","间的层数"],
    sa_sldn_s:      "密度",
    sa_sldn_l:      ["用于计算","支撑柱的数量","0.0-1.0 （0 = 禁用）"],
    sa_slsz_s:      "尺寸",
    sa_slsz_l:      ["支撑柱的","最大尺寸","毫米数"],
    sa_slpt_s:      "点",
    sa_slpt_l:      ["各支撑柱","内的点数","以毫米表示"],
    sl_slen_l:      "启用支撑",

    sa_outp_m:      "输出",
    sa_opzo_s:      "z 偏置",
    sa_opzo_l:      ["z 层偏置","一般始终保持在0.0","0.0-1.0 毫米"],
    sa_opaa_s:      "抗锯齿",
    sa_opaa_l:      ["启动抗锯齿","文件体积增加","可能模糊细节"]
};
