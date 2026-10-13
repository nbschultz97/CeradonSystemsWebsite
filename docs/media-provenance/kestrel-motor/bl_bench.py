"""Bench scene: a generic 5-inch FPV frame kit knolled on paper, plus an open outrunner motor for macro work.
All geometry is built here from outlines in parts.json (see parts_shapes.py). Nothing is scanned or generated.
blender -b -P bl_bench.py -- shapes=parts.json out=out.png view=flat|macro|weave res=2400x1600 samples=256"""
import bpy, sys, os, math, json, random
import numpy as np
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bl_common as C
A = C.args()
res = tuple(int(v) for v in A.get("res", "2400x1600").split("x"))
view = A.get("view", "flat")
sc = C.reset(res, int(A.get("samples", 256)))
SH = json.load(open(A["shapes"]))
MM = 0.001
random.seed(7)
col = sc.collection

# ---------- carbon twill: height and tone maps computed here, 2x2 twill, 16 tows per tile
def twill_maps(n=2048, tows=16):
    c = n // tows
    y, x = np.mgrid[0:n, 0:n]
    i, j = x // c, y // c
    warp = ((i + j) % 4) < 2                       # True: the tow running in y is on top
    u = (x % c) / c - 0.5; v = (y % c) / c - 0.5     # position inside a cell
    across = np.where(warp, u, v)                    # across the tow that is on top
    crown = np.cos(across * math.pi) ** 0.6         # tows are rounded
    # floats are two cells long: dip towards where the tow dives under
    along_idx = np.where(warp, (j - (i % 4)) % 4, (i - (j % 4)) % 4)
    fibre = 0.5 + 0.5 * np.cos(across * c * 2 * math.pi / 5.0)   # filament grooves
    h = 0.75 * crown + 0.10 * fibre
    rng = np.random.default_rng(3)
    tone = np.where(warp, 0.62, 0.38) + (rng.random((tows, tows))[j % tows, i % tows] - 0.5) * 0.08
    return h.astype(np.float32), tone.astype(np.float32)
def np_image(name, a):
    n = a.shape[0]
    im = bpy.data.images.new(name, n, n, alpha=False, float_buffer=True)
    im.colorspace_settings.name = 'Non-Color'
    rgba = np.empty((n, n, 4), np.float32); rgba[..., 0] = rgba[..., 1] = rgba[..., 2] = a; rgba[..., 3] = 1
    im.pixels.foreach_set(rgba.ravel()); im.pack()
    return im
hmap, tmap = twill_maps()
IH, IT = np_image("twill_h", hmap), np_image("twill_t", tmap)

def carbon_mat():
    m, nt, b = C.new_mat("carbon"); N, L = nt.nodes, nt.links
    tc = N.new("ShaderNodeTexCoord"); mp = N.new("ShaderNodeMapping")
    s = 1.0 / (16 * 0.0021)                          # 2.1 mm tows
    mp.inputs["Scale"].default_value = (s, s, s)
    L.new(tc.outputs["Object"], mp.inputs["Vector"])
    th = N.new("ShaderNodeTexImage"); th.image = IH; tt = N.new("ShaderNodeTexImage"); tt.image = IT
    L.new(mp.outputs[0], th.inputs[0]); L.new(mp.outputs[0], tt.inputs[0])
    ramp = N.new("ShaderNodeMapRange"); ramp.inputs[3].default_value = 0.012; ramp.inputs[4].default_value = 0.045
    L.new(tt.outputs[0], ramp.inputs[0])
    rgb = N.new("ShaderNodeCombineColor"); [L.new(ramp.outputs[0], rgb.inputs[k]) for k in range(3)]
    L.new(rgb.outputs[0], b.inputs["Base Color"])
    r2 = N.new("ShaderNodeMapRange"); r2.inputs[3].default_value = 0.30; r2.inputs[4].default_value = 0.46
    L.new(tt.outputs[0], r2.inputs[0]); L.new(r2.outputs[0], b.inputs["Roughness"])
    bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.55; bp.inputs["Distance"].default_value = 0.00006
    L.new(th.outputs[0], bp.inputs["Height"]); L.new(bp.outputs[0], b.inputs["Normal"])
    b.inputs["Coat Weight"].default_value = 0.35; b.inputs["Coat Roughness"].default_value = 0.22
    b.inputs["Specular IOR Level"].default_value = 0.6
    return m
CARBON = carbon_mat()
ALU = C.simple_mat("alu", (0.62, 0.63, 0.65), 0.32, 1.0)
ALU_DARK = C.simple_mat("alu_dark", (0.07, 0.075, 0.085), 0.36, 1.0)
AMBER = C.simple_mat("alu_amber", (0.70, 0.36, 0.06), 0.30, 1.0)       # gold-anodised hardware, the one accent
STEEL = C.simple_mat("steel", (0.50, 0.50, 0.50), 0.28, 1.0)
BLACK_OX = C.simple_mat("black_oxide", (0.035, 0.035, 0.04), 0.42, 1.0)
LAMS = C.simple_mat("laminations", (0.11, 0.115, 0.125), 0.45, 1.0)
MAGNET = C.simple_mat("magnet", (0.72, 0.72, 0.70), 0.18, 1.0)
COPPER = C.simple_mat("enamel_copper", (0.86, 0.33, 0.11), 0.30, 1.0, coat=1.0, coat_rough=0.08)
SILICONE = C.simple_mat("silicone", (0.02, 0.02, 0.022), 0.55, 0.0)
for m_ in (ALU, ALU_DARK, AMBER): C.add_noise_bump(m_, 2500, 0.04, 0.00002)
# stator laminations: fine horizontal lines
def lam_lines(m):
    nt = m.node_tree; N, L = nt.nodes, nt.links; b = N["Principled BSDF"]
    geo = N.new("ShaderNodeTexCoord"); sep = N.new("ShaderNodeSeparateXYZ"); L.new(geo.outputs["Object"], sep.inputs[0])
    mth = N.new("ShaderNodeMath"); mth.operation = 'MULTIPLY'; mth.inputs[1].default_value = 2 * math.pi / 0.00022; L.new(sep.outputs["Z"], mth.inputs[0])
    sn = N.new("ShaderNodeMath"); sn.operation = 'SINE'; L.new(mth.outputs[0], sn.inputs[0])
    bp = N.new("ShaderNodeBump"); bp.inputs["Strength"].default_value = 0.5; bp.inputs["Distance"].default_value = 0.00004
    L.new(sn.outputs[0], bp.inputs["Height"]); L.new(bp.outputs[0], b.inputs["Normal"])
lam_lines(LAMS)

# ---------- builders
def parent_to(ob, parent):
    if parent: ob.parent = parent
    return ob
def extrude(key, z0, h, mat, parent=None, bevel=0.25, name=None):
    cu = bpy.data.curves.new(name or key, 'CURVE'); cu.dimensions = '2D'; cu.fill_mode = 'BOTH'
    cu.extrude = (h / 2 - bevel) * MM; cu.bevel_depth = bevel * MM; cu.bevel_resolution = 2
    for poly in SH[key]:
        for ring in [poly["ext"]] + poly["holes"]:
            sp = cu.splines.new('POLY'); sp.points.add(len(ring) - 1)
            sp.points.foreach_set("co", [v for x, y in ring for v in (x * MM, y * MM, 0, 1)]); sp.use_cyclic_u = True
    ob = bpy.data.objects.new(name or key, cu); col.objects.link(ob); ob.location.z = (z0 + h / 2) * MM
    ob.data.materials.append(mat)
    return parent_to(ob, parent)
def cyl(r, h, loc, mat, parent=None, verts=64, rot=(0, 0, 0), bevel=0.15, name="cyl"):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r * MM, depth=h * MM, location=[v * MM for v in loc], rotation=rot)
    ob = bpy.context.object; ob.name = name; ob.data.materials.append(mat)
    if bevel:
        bv = ob.modifiers.new("b", 'BEVEL'); bv.width = bevel * MM; bv.segments = 3; bv.limit_method = 'ANGLE'
    try: bpy.ops.object.shade_auto_smooth(angle=0.7)
    except Exception: bpy.ops.object.shade_smooth()
    return parent_to(ob, parent)
def tube(pts, r, mat, parent=None, cyclic=False, name="wire"):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r * MM; cu.bevel_resolution = 3; cu.use_fill_caps = True
    sp = cu.splines.new('NURBS' if not cyclic else 'POLY'); sp.points.add(len(pts) - 1)
    sp.points.foreach_set("co", [v for p in pts for v in (p[0] * MM, p[1] * MM, p[2] * MM, 1)])
    if not cyclic: sp.use_endpoint_u = True; sp.order_u = 3
    sp.use_cyclic_u = cyclic
    ob = bpy.data.objects.new(name, cu); col.objects.link(ob); ob.data.materials.append(mat)
    return parent_to(ob, parent)
def empty(loc, rotz=0.0, name="grp"):
    e = bpy.data.objects.new(name, None); col.objects.link(e); e.location = [v * MM for v in loc]; e.rotation_euler = (0, 0, rotz)
    return e

def coil(parent, ang):
    """One tooth winding: a continuous helix of enamelled wire, two layers, slight hand-wound irregularity."""
    wire = 0.23; pitch = 0.50; pts = []
    def loop_pt(u, a, b, rc):
        # rounded rectangle in (y,z), perimeter parameter u in 0..1
        segs = [2 * (a - rc), math.pi * rc / 2, 2 * (b - rc), math.pi * rc / 2] * 2; P = sum(segs); d = u * P
        corners = [(a - rc, b - rc), (-(a - rc), b - rc), (-(a - rc), -(b - rc)), (a - rc, -(b - rc))]
        # walk: top edge (+y to -y), corner, left edge down, corner, bottom edge, corner, right edge up, corner
        order = [("e", (a - rc, b), (-(a - rc), b)), ("c", corners[1], 90), ("e", (-a, b - rc), (-a, -(b - rc))), ("c", corners[2], 180),
                 ("e", (-(a - rc), -b), (a - rc, -b)), ("c", corners[3], 270), ("e", (a, -(b - rc)), (a, b - rc)), ("c", corners[0], 0)]
        for (kind, p0, p1), L_ in zip(order, [segs[0], segs[1], segs[2], segs[3], segs[0], segs[1], segs[2], segs[3]]):
            if d <= L_:
                t = d / L_
                if kind == "e": return (p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t)
                th = math.radians(p1 + 90 * t); return (p0[0] + rc * math.cos(th), p0[1] + rc * math.sin(th))
            d -= L_
        return (a - rc, b)
    n = 30
    for layer, (x_start, turns, sgn) in enumerate(((6.55, 7, 1), (9.6, 3, -1))):
        a = 1.15 + 0.28 + layer * 0.47; b = 3.5 + 0.28 + layer * 0.47; rc = 0.55 + layer * 0.45
        jit = [random.uniform(-0.05, 0.05) for _ in range(turns + 1)]
        for k in range(turns * n + 1):
            t = k / n; y, z = loop_pt(t % 1.0, a, b, rc)
            x = x_start + sgn * (t * pitch) + jit[int(t)] * (1 - (t % 1)) + jit[min(int(t) + 1, turns)] * (t % 1)
            pts.append((x, y, z + 6.5))
    ca, sa = math.cos(ang), math.sin(ang)
    pts = [(x * ca - y * sa, x * sa + y * ca, z) for x, y, z in pts]
    cu = bpy.data.curves.new("coil", 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = wire * MM; cu.bevel_resolution = 2; cu.use_fill_caps = True
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
    sp.points.foreach_set("co", [v for p in pts for v in (p[0] * MM, p[1] * MM, p[2] * MM, 1)])
    ob = bpy.data.objects.new("coil", cu); col.objects.link(ob); ob.data.materials.append(COPPER); ob.parent = parent
    for s_ in cu.splines: s_.use_smooth = True

def motor(loc, rotz=0.0, bell=True, bell_offset=None):
    g = empty(loc, rotz, "motor")
    extrude("base", 0, 2.8, ALU_DARK, g, 0.3)
    cyl(4.6, 10.2, (0, 0, 5.1), ALU_DARK, g, name="bearing_tube")
    extrude("stator", 3.0, 7.0, LAMS, g, 0.08)
    if not bell:                                       # open motor: show the bearing in the tube
        cyl(3.7, 0.5, (0, 0, 10.25), STEEL, g, name="bearing"); cyl(2.55, 0.6, (0, 0, 10.3), BLACK_OX, g, name="bore")
    for k in range(12): coil(g, 2 * math.pi * k / 12)
    for k in (-1, 0, 1):                               # three phase leads
        y = k * 2.3
        tube([(-9, y * 0.6, 1.6), (-16, y, 1.3), (-24, y * 1.1, 0.9), (-34, y * 1.25 + 1.0, 0.85), (-44, y * 1.3 + 2.5, 0.85)], 0.8, SILICONE, g, name="lead")
    b = g if bell_offset is None else empty((loc[0] + bell_offset[0], loc[1] + bell_offset[1], loc[2] + bell_offset[2]), rotz + 0.5, "bell")
    z0 = 0 if bell_offset is None else -3.0
    if bell or bell_offset is not None:
        extrude("fluxring", 3.0 + z0, 9.4, BLACK_OX, b, 0.2)
        extrude("magnets", 3.4 + z0, 8.2, MAGNET, b, 0.12)
        extrude("bellcap", 12.4 + z0, 1.6, ALU_DARK, b, 0.3)
        cyl(4.4, 2.6, (0, 0, 14.4 + z0), ALU, b, name="hub")
        cyl(2.5, 12.5, (0, 0, 21.0 + z0), STEEL, b, bevel=0.3, name="shaft")
        if bell_offset is None: cyl(1.5, 1.2, (0, 0, 0.6), STEEL, b, name="shaft_low")
    return g

def place(key, loc, rotz, mat, h, name=None):
    ob = extrude(key, 0, h, mat, None, 0.2, name); ob.location.x, ob.location.y = loc[0] * MM, loc[1] * MM; ob.rotation_euler.z = rotz
    return ob

ground = C.ground(30, (0.86, 0.865, 0.87), 0.9, 0.0)
C.add_noise_bump(ground.data.materials[0], 1400, 0.035, 0.0001)

if view in ("flat", "weave"):
    for k, y in enumerate((108, 70, 32, -6)):                                   # four arms
        place("arm", (-84, y), 0, CARBON, 5.0)
    place("bottom", (50, 104), 0, CARBON, 3.0)
    place("top", (50, 50), 0, CARBON, 2.0)
    place("side", (2, -2), 0, CARBON, 2.5, "side_a"); place("side", (46, -2), 0, CARBON, 2.5, "side_b")
    for (x, y) in ((158, 105), (196, 105), (158, 62), (196, 62)):
        motor((x, y, 0), rotz=math.pi / 2 + random.uniform(-0.05, 0.05))
    for k in range(8):                                                          # standoffs, lying down
        x = -200 + k * 11.0
        cyl(2.5, 25, (x, -66 + random.uniform(-0.4, 0.4), 2.5), AMBER, verts=6 if False else 48, rot=(math.pi / 2, 0, 0), bevel=0.25, name="standoff")
    for row, y in enumerate((-52, -80)):                                        # M3 button heads, lying down
        for k in range(8):
            x = -92 + k * 9.5; j = random.uniform(-0.3, 0.3); ry = random.uniform(-0.04, 0.04)
            g = empty((x, y + j, 0), ry, "screw")
            cyl(1.5, 9, (0, 0, 2.75), BLACK_OX, g, verts=32, rot=(math.pi / 2, 0, 0), bevel=0.15, name="shank")
            cyl(2.75, 1.7, (0, 5.3, 2.75), BLACK_OX, g, verts=40, rot=(math.pi / 2, 0, 0), bevel=0.5, name="head")
    # hex driver
    cyl(5.5, 86, (58, -66, 5.5), ALU_DARK, verts=64, rot=(0, math.pi / 2, 0), bevel=1.2, name="driver_handle")
    cyl(3.2, 9, (104, -66, 5.5), AMBER, verts=64, rot=(0, math.pi / 2, 0), bevel=0.5, name="driver_collar")
    cyl(1.25, 62, (139, -66, 5.5), STEEL, verts=6, rot=(0, math.pi / 2, 0), bevel=0.0, name="driver_shaft")
    C.world((0.93, 0.96, 1.0), float(A.get("world", 0.45)))
    if view == "flat":
        C.camera((0.002, 0.008, 1.6), (0.002, 0.008, 0), lens=122)
        C.area_light((-0.9, 0.55, 0.75), (0, 0, 0), (0.9, 0.6), float(A.get("key", 14)), (1.0, 0.96, 0.9))
        C.area_light((0.25, -0.2, 1.2), (0.05, 0, 0), (1.2, 0.9), float(A.get("fill", 5)), (0.95, 0.97, 1.0))
    else:   # weave: low raking close-up across an arm and the bottom plate
        C.camera((-0.20, 0.035, 0.085), (-0.045, 0.085, 0.002), lens=90, fstop=5.6, focus=(-0.085, 0.07, 0.005))
        C.area_light((-0.5, 0.6, 0.45), (-0.05, 0.08, 0), (0.7, 0.5), float(A.get("key", 7)), (1.0, 0.96, 0.9))
        C.area_light((0.35, 0.3, 0.25), (-0.05, 0.08, 0), (0.6, 0.4), float(A.get("fill", 2.5)), (0.95, 0.97, 1.0))
else:       # macro: open stator on a carbon plate, bell standing behind
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.004, 0.006, 0.0015)); plate = bpy.context.object
    plate.dimensions = (0.150, 0.110, 0.003); plate.rotation_euler.z = 0.32; bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bv = plate.modifiers.new("b", 'BEVEL'); bv.width = 0.0004; bv.segments = 3; plate.data.materials.append(CARBON)
    motor((0, 0, 3.0), rotz=0.6, bell=False, bell_offset=(30, 30, 0))
    C.world((0.93, 0.96, 1.0), float(A.get("world", 0.4)))
    C.camera((-0.085, -0.122, 0.082), (0.004, 0.004, 0.0085), lens=100, fstop=float(A.get("fstop", 14)), focus=(-0.005, -0.008, 0.011))
    C.area_light((-0.45, 0.25, 0.35), (0, 0, 0.008), (0.5, 0.35), float(A.get("key", 8)), (1.0, 0.96, 0.9))
    C.area_light((0.30, -0.25, 0.30), (0, 0, 0.008), (0.5, 0.4), float(A.get("fill", 2.2)), (0.95, 0.97, 1.0))
if A.get("vt"):
    sc.view_settings.view_transform = A["vt"]
    try: sc.view_settings.look = A.get("look", "AgX - Medium High Contrast")
    except Exception as e: print("look not set", e)
sc.view_settings.exposure = float(A.get("ev", 0.0))
C.render(A["out"])
