"""2D outlines (mm) for the bench scene: a generic 5-inch FPV frame kit and a 2207-class outrunner motor.
Generic, unbranded geometry; not a Ceradon product. Usage: python -I parts_shapes.py out.json"""
import sys, json, math
from shapely.geometry import Polygon, Point, box, MultiPolygon
from shapely.ops import unary_union
from shapely import affinity
def circ(x, y, r): return Point(x, y).buffer(r, quad_segs=24)
def sector(r0, r1, half_deg, n=24):
    a = [math.radians(-half_deg + 2 * half_deg * i / n) for i in range(n + 1)]
    return Polygon([(r1 * math.cos(t), r1 * math.sin(t)) for t in a] + [(r0 * math.cos(t), r0 * math.sin(t)) for t in reversed(a)])
def rot_copies(g, n): return unary_union([affinity.rotate(g, 360 * i / n, origin=(0, 0)) for i in range(n)])
def stadium(x, y, L, w, ang=0): return affinity.rotate(box(x - L / 2, y - 0.001, x + L / 2, y + 0.001).buffer(w / 2, quad_segs=12), ang, origin=(x, y))
def rounded(g, r): return g.buffer(-r).buffer(r, quad_segs=12)
S = {}
# motor
S["stator"] = unary_union([circ(0, 0, 6.2).difference(circ(0, 0, 4.6)), rot_copies(unary_union([box(6.0, -1.15, 10.2, 1.15), sector(10.0, 11.0, 11.5)]), 12)])
win = rounded(sector(5.9, 11.7, 20), 0.9)
S["bellcap"] = circ(0, 0, 13.75).difference(rot_copies(win, 6))
S["fluxring"] = circ(0, 0, 13.75).difference(circ(0, 0, 12.75))
S["magnets"] = rot_copies(sector(11.8, 12.75, 10.6), 14)
S["base"] = rounded(unary_union([circ(0, 0, 9.0), rot_copies(unary_union([box(0, -3.2, 11.3, 3.2), circ(11.3, 0, 3.2)]), 4)]), 0.01).difference(rot_copies(circ(8.0, 0, 1.5), 4))
# arm: motor pad at origin, root towards -x
pad = circ(0, 0, 14.2); root = circ(-104, 0, 9.0)
arm = unary_union([pad, root]).convex_hull
arm = unary_union([Polygon([(-104, -6.2), (-104, 6.2), (-8, 8.5), (-8, -8.5)]), pad, box(-122, -9, -100, 9).buffer(-2).buffer(2)])
arm = rounded(arm.buffer(3).buffer(-3), 0.5)
holes = [circ(0, 0, 4.2)] + [circ(8 * math.cos(math.radians(a)), 8 * math.sin(math.radians(a)), 1.6) for a in (45, 135, 225, 315)]
holes += [circ(-106, 0, 1.6), circ(-117, 0, 1.6), stadium(-58, 0, 52, 5.0)]
S["arm"] = arm.difference(unary_union(holes))
# bottom plate
oct_ = Polygon([(-78, -14), (-66, -23), (66, -23), (78, -14), (78, 14), (66, 23), (-66, 23), (-78, 14)])
bp = rounded(oct_, 2.5)
h = [circ(sx * 15.25, sy * 15.25, 1.6) for sx in (-1, 1) for sy in (-1, 1)]
h += [circ(sx * x, sy * 18.5, 1.6) for sx in (-1, 1) for sy in (-1, 1) for x in (30, 44, 62)]
h += [stadium(sx * 53, 0, 22, 3.2, 90) for sx in (-1, 1)] + [stadium(sx * 37, 0, 18, 3.2, 90) for sx in (-1, 1)]
h += [rounded(box(-9, -9, 9, 9), 3), circ(-70, 0, 2.4), circ(70, 0, 2.4)]
S["bottom"] = bp.difference(unary_union(h))
tp = rounded(Polygon([(-76, -11), (-64, -19), (64, -19), (76, -11), (76, 11), (64, 19), (-64, 19), (-76, 11)]), 2.5)
h = [circ(sx * x, sy * 14.5, 1.6) for sx in (-1, 1) for sy in (-1, 1) for x in (30, 44, 62)]
h += [stadium(sx * 20, 0, 20, 3.2, 90) for sx in (-1, 0, 1)] + [stadium(0, sy * 9.5, 20, 3.0) for sy in (-1, 1)]
h += [rounded(Polygon([(40, -8), (58, -8), (58, 8), (40, 8)]), 2.5), rounded(Polygon([(-40, -8), (-58, -8), (-58, 8), (-40, 8)]), 2.5)]
S["top"] = tp.difference(unary_union(h))
sp = rounded(Polygon([(-17, -13), (10, -13), (18, -4), (18, 13), (-4, 13), (-17, 2)]), 2.0)
arcslot = sector(8.0, 11.2, 38).buffer(-0.6).buffer(0.6)
S["side"] = sp.difference(unary_union([affinity.translate(affinity.rotate(arcslot, 60, origin=(0, 0)), -2, -5), circ(-2, -5, 1.6), circ(-12, -8.5, 1.6), circ(13.5, 8.5, 1.6)]))
def dump(g):
    polys = list(g.geoms) if isinstance(g, MultiPolygon) else [g]
    return [{"ext": [list(c) for c in p.exterior.coords[:-1]], "holes": [[list(c) for c in h.coords[:-1]] for h in p.interiors]} for p in polys]
json.dump({k: dump(v) for k, v in S.items()}, open(sys.argv[1], "w"))
print({k: [round(b, 1) for b in v.bounds] for k, v in S.items()})
