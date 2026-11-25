"""Rebuild the ASCII turntable: pip install gmsh trimesh numpy pillow."""
from pathlib import Path
import math
import gmsh
import numpy as np
import trimesh
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parents[1] / 'assets'
CACHE = HERE / 'surface.npz'

if not CACHE.exists():
    gmsh.initialize()
    gmsh.option.setNumber('General.Terminal', 0)
    gmsh.option.setNumber('General.AbortOnError', 0)
    gmsh.open(str(HERE / 'board.step'))
    print('CAD imported; meshing surfaces.', flush=True)
    gmsh.option.setNumber('Mesh.MeshSizeMin', 0.2)
    gmsh.option.setNumber('Mesh.MeshSizeMax', 0.7)
    try:
        gmsh.model.mesh.generate(2)
    except Exception as error:
        # A few tiny periodic CAD faces can fail; retain all successfully meshed faces.
        print(f'Meshing note: {error}', flush=True)
    tags, xyz, _ = gmsh.model.mesh.getNodes()
    vertices = np.asarray(xyz).reshape(-1, 3)
    lookup = np.zeros(int(max(tags)) + 1, dtype=int)
    lookup[tags] = np.arange(len(tags))
    triangles, colors = [], []
    for entity in gmsh.model.getEntities(2):
        types, _, nodes = gmsh.model.mesh.getElements(*entity)
        color = np.array(gmsh.model.getColor(*entity)[:3]) / 255
        for kind, indices in zip(types, nodes):
            if kind == 2:
                faces = lookup[np.asarray(indices).reshape(-1, 3)]
                triangles.extend(faces)
                colors.extend([color] * len(faces))
    gmsh.finalize()
    mesh = trimesh.Trimesh(vertices=vertices, faces=triangles, process=False)
    np.random.seed(32)
    points, faces = trimesh.sample.sample_surface(mesh, 700000)
    normals = mesh.face_normals[faces]
    colors = np.array(colors)[faces]
    # Place the longest PCB dimension vertically and its thickness in depth.
    axes = np.argsort(np.ptp(points, axis=0))
    order = [axes[1], axes[2], axes[0]]
    points, normals = points[:, order], normals[:, order]
    points -= (points.max(axis=0) + points.min(axis=0)) / 2
    points /= np.ptp(points[:, 1]) / 2
    np.savez_compressed(CACHE, points=points, normals=normals, colors=colors)
    print('Surface cached.', flush=True)

data = np.load(CACHE)
points, normals, colors = (data[key] for key in ['points', 'normals', 'colors'])
cols, rows, frames = 240, 176, []
font = ImageFont.truetype('C:/Windows/Fonts/consola.ttf', 10)
glyphs = np.array(list(' .,:;-~=+!*#$@'))
light = np.array([-0.4, 0.55, 0.8])
light /= np.linalg.norm(light)
material = np.clip(colors @ [0.2126, 0.7152, 0.0722], 0.08, 1)
material = np.where(np.ptp(colors, axis=1) > 0.25, material * 0.3, material)
tilt = 0.18
rx = np.array([[1, 0, 0], [0, math.cos(tilt), -math.sin(tilt)], [0, math.sin(tilt), math.cos(tilt)]])
diagonal = math.radians(-12)
rz = np.array([[math.cos(diagonal), -math.sin(diagonal), 0], [math.sin(diagonal), math.cos(diagonal), 0], [0, 0, 1]])
palette = [channel for i in range(256) for channel in (i, i, i)]
tiles = []
for level in range(32):
    char = glyphs[min(len(glyphs) - 1, int(level / 31 * (len(glyphs) - 1)))]
    tile = Image.new('L', (6, 10), 5)
    ImageDraw.Draw(tile).text((0, -2), char, font=font, fill=int(125 + level / 31 * 130))
    tiles.append(np.array(tile))
tiles = np.array(tiles)
for index in range(120):
    angle = index * math.tau / 120 + 0.25
    c, s = math.cos(angle), math.sin(angle)
    rotation = rz @ rx @ np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])
    projected = points @ rotation.T
    surface_normals = normals @ rotation.T
    # Character cells are 6 x 10 pixels, so compensate for their aspect ratio.
    x = np.rint(projected[:, 0] * 120 + cols / 2).astype(int)
    y = np.rint(-projected[:, 1] * 72 + rows / 2).astype(int)
    assert np.all((x >= 0) & (x < cols) & (y >= 0) & (y < rows)), 'The rotated board must fit the frame.'
    valid = (x >= 0) & (x < cols) & (y >= 0) & (y < rows)
    cells = y[valid] * cols + x[valid]
    z = projected[valid, 2]
    depth = np.full(cols * rows, -np.inf)
    np.maximum.at(depth, cells, z)
    visible = z >= depth[cells] - 0.00001
    luminance = (0.25 + 0.75 * np.maximum(0, surface_normals @ light)) * material ** 0.65
    shade = np.zeros(cols * rows)
    shade[cells[visible]] = luminance[valid][visible]
    levels = np.clip((shade ** 0.65 * 1.4 * 31).astype(int), 0, 31).reshape(rows, cols)
    image = Image.fromarray(tiles[levels].transpose(0, 2, 1, 3).reshape(rows * 10, cols * 6))
    frame = image.convert('P')
    frame.putpalette(palette)
    frames.append(frame)
    if index % 30 == 0:
        print(f'Rendered {index}/120 frames', flush=True)

frames[0].save(ASSETS / 'esp32-s3-ascii.png')
frames[0].save(ASSETS / 'esp32-s3-ascii.gif', save_all=True, append_images=frames[1:], duration=80, loop=0, optimize=True, disposal=1)
with Image.open(ASSETS / 'esp32-s3-ascii.gif') as result:
    assert result.n_frames == 120 and result.info['loop'] == 0
    result.seek(30)
    assert result.tobytes() != frames[0].tobytes()
print(f'Verified: 120 frames, full 360 degree loop, {cols * 6} x {rows * 10}.', flush=True)
