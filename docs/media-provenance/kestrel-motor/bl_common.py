"""Shared Blender (5.x, Cycles) helpers for the Ceradon 'Survey' asset renders."""
import bpy, math, sys

PAPER = (0.905, 0.922, 0.939)   # linear of #f4f6f8, the site's page colour

def args():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    d = {}
    for s in a:
        k, _, v = s.partition("=")
        d[k] = v
    return d

def reset(res=(2400, 1600), samples=256):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    try:
        p = bpy.context.preferences.addons['cycles'].preferences
        p.compute_device_type = 'METAL'
        p.get_devices()
        for d in p.devices:
            d.use = True
        sc.cycles.device = 'GPU'
    except Exception as e:
        print("GPU setup failed, CPU:", e)
    sc.cycles.samples = samples
    sc.cycles.use_denoising = True
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.01
    sc.cycles.max_bounces = 8
    sc.cycles.caustics_reflective = False
    sc.cycles.caustics_refractive = False
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGB'
    sc.render.image_settings.color_depth = '16'
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    sc.world = bpy.data.worlds.new("W")
    sc.world.use_nodes = True
    return sc

def world(color=(1, 1, 1), strength=0.5):
    nt = bpy.context.scene.world.node_tree
    bg = nt.nodes.get("Background") or nt.nodes.new("ShaderNodeBackground")
    bg.inputs[0].default_value = (*color, 1)
    bg.inputs[1].default_value = strength
    out = nt.nodes.get("World Output") or nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(bg.outputs[0], out.inputs[0])

def look_at(obj, target):
    from mathutils import Vector
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()

def camera(loc, target, lens=85, fstop=None, focus=None, sensor=36):
    cd = bpy.data.cameras.new("Cam")
    cd.lens = lens
    cd.sensor_width = sensor
    cd.clip_start = 0.001
    cd.clip_end = 100
    ob = bpy.data.objects.new("Cam", cd)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    look_at(ob, target)
    if fstop:
        from mathutils import Vector
        cd.dof.use_dof = True
        cd.dof.aperture_fstop = fstop
        cd.dof.focus_distance = (Vector(focus or target) - Vector(loc)).length
    bpy.context.scene.camera = ob
    return ob

def area_light(loc, target, size=(1, 1), power=100, color=(1, 1, 1), spread=None):
    ld = bpy.data.lights.new("L", 'AREA')
    ld.shape = 'RECTANGLE'
    ld.size, ld.size_y = size
    ld.energy = power
    ld.color = color
    if spread is not None:
        ld.spread = spread
    ob = bpy.data.objects.new("L", ld)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    look_at(ob, target)
    return ob

def new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    return m, nt, b

def simple_mat(name, color, rough=0.5, metal=0.0, coat=0.0, coat_rough=0.05, **kw):
    m, nt, b = new_mat(name)
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Coat Weight"].default_value = coat
    b.inputs["Coat Roughness"].default_value = coat_rough
    for k, v in kw.items():
        b.inputs[k].default_value = v
    return m

def add_noise_bump(mat, scale=400, strength=0.05, distance=0.0002, detail=4):
    nt = mat.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale
    n.inputs["Detail"].default_value = detail
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = strength
    bp.inputs["Distance"].default_value = distance
    nt.links.new(tc.outputs["Object"], n.inputs["Vector"])
    nt.links.new(n.outputs["Fac"], bp.inputs["Height"])
    nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])

def ground(size=20, color=PAPER, rough=0.95, z=0.0):
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, z))
    ob = bpy.context.object
    m = simple_mat("Ground", color, rough)
    ob.data.materials.append(m)
    return ob

def render(path):
    sc = bpy.context.scene
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print("WROTE", path)
