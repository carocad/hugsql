
-- used for a graph representation of the road network
select * from way_node join node on way_node.node = node.id;


select * from arc join node as source on arc.src = source.id
                  join node as destination on arc.dst = destination.id;


-- src 2708331052, dst 561065
-- "sends a radar beacon to know the distance to the destination"
-- This query is only useful to know the cost of the shortest path
-- until the destination. We can use it to display it to the user
-- and as a way to stop the graph_traversal recursive query below
with recursive
 beacon(src, dst, cost) as (
    values (null, :SOURCE, 0)
        union all
    select arc.src, arc.dst, round(arc.distance + beacon.cost) as cost
     from beacon
     join arc on arc.src = beacon.dst
     order by cost
     limit 100000
 )
 select * from beacon where beacon.dst = :DESTINATION limit 1;


-- compute the shortest path from source to destination using
-- a plain dijkstra algorithm; done here in several steps due
-- to SQL restrictions
with recursive
 -- traverse the graph until the cost to target is reached. At that point we
 -- would have a big traversal tree with repeated nodes but different weights
 graph_traversal(src, dst, cost) as (
    values (null, :SOURCE, 0)
        union all
    select arc.src, arc.dst, round(arc.distance + graph_traversal.cost) as cost
     from graph_traversal
     join arc on arc.src = graph_traversal.dst
     where round(arc.distance + graph_traversal.cost) <= :RADIOUS
     order by cost
 ),
 -- perform a proper dijkstra by keeping only the nodes from the tree with the
 -- minimum cost
 dijkstra as (
    select graph_traversal.src, graph_traversal.dst, min(graph_traversal.cost) as cost
      from graph_traversal
      group by graph_traversal.dst
      order by cost
 ),
 -- compute the shortest path by backtracking from the destination to the
 -- source
 shortest_path as (
    select * from dijkstra where dijkstra.dst = :DESTINATION
        union all
    select dijkstra.*
      from shortest_path, dijkstra
      where dijkstra.dst = shortest_path.src
 )
 -- the src of each row is redundant so we can remove it ;)
 select shortest_path.dst, shortest_path.cost
  from shortest_path;
