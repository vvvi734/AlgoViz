import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "sources/articulation"))
import articulation as a

a.graph[0].extend([1])
a.graph[1].extend([0, 2])
a.graph[2].extend([1, 0, 3])
a.graph[0].extend([2])
a.graph[2].extend([3])
a.graph[3].extend([2, 4, 5])
a.graph[4].extend([3, 5])
a.graph[5].extend([3, 4])
a.graph[6].extend([7])
a.graph[7].extend([6])

print("first_result", a.find_articulation_points())
print("first_art", a.articulation)
print("first_bridges", sorted(a.bridges))
print("first_timer", a.timer)
print("second_result", a.find_articulation_points())
print("second_art", a.articulation)
print("second_bridges", sorted(a.bridges))
print("second_timer", a.timer)

for row in a.graph:
    row.clear()
a.add_edge(0, 1)
print("single_result", a.find_articulation_points())
print("single_art", a.articulation)
print("single_bridges", sorted(a.bridges))
print("single_timer", a.timer)

for row in a.graph:
    row.clear()
a.add_edge(0, 1)
a.add_edge(0, 2)
a.add_edge(0, 3)
a.find_articulation_points()
print("star_art", a.articulation)
print("star_bridges", sorted(a.bridges))

for endpoint in (-1, a.VERTEX_COUNT):
    try:
        a.add_edge(endpoint, 0)
        print("invalid_endpoint", endpoint, "accepted")
    except ValueError:
        print("invalid_endpoint", endpoint, "error")

removed = a.graph.pop()
try:
    a.find_articulation_points()
    print("wrong_shape accepted")
except ValueError:
    print("wrong_shape error")
a.graph.append(removed)

a.graph[0].append(a.VERTEX_COUNT)
try:
    a.find_articulation_points()
    print("invalid_neighbor accepted")
except ValueError:
    print("invalid_neighbor error")
a.graph[0].pop()
