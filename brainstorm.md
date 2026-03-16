# PhysBox 2 — Feature Brainstorm

## Joints & Mechanisms (the big win)
- **Wheels/Vehicles** — WheelJoint with suspension (spring/damper), motor torque
- **Hinges** — RevoluteJoint doors, flippers, catapults, see-saws
- **Pistons** — PrismaticJoint for hydraulics, spring-loaded launchers
- **Pulleys** — PulleyJoint elevators, counterweights, drawbridges
- **Gears** — GearJoint to link revolute/prismatic joints for clockwork machines
- **Weld** — WeldJoint to glue bodies together rigidly (breakable on force threshold → destruction!)
- **Rope/Distance** — DistanceJoint with limits for bungee, tethers, bridges

## Sensors & Triggers
- Goal zones, kill zones, teleporters, speed boost pads — all via sensor fixtures
- Score/win conditions for puzzle levels

## Rube Goldberg Machine Builder
- Dominoes, ramps, funnels, conveyor belts (kinematic bodies), trampolines (high restitution sensors)
- A "play" button that drops an initial ball and watches the chain reaction

## Destruction / Breakable
- Weld joints that break above a force threshold → smashable structures
- Explosions: apply radial impulse to all bodies in a radius

## Fluids (Particle-like)
- Spawn many tiny circles with low friction to simulate sand/water
- Could do SPH-lite with contact listeners

## Raycasting Tools
- Laser beams that cut bodies
- Line-of-sight / shadow casting
- Projectile traces

## Vehicles
- Cars with WheelJoint suspension + motor
- Boats on a "water" sensor region that applies buoyancy forces
- Rockets with continuous thrust

## Save/Load & Sharing
- Serialize world state to JSON (Planck has `world.serialize()` support)
- Share creations via URL hash or clipboard
- Undo/redo stack

## Quality of Life
- Multi-select and move groups of bodies
- Copy/paste objects
- Snap-to-grid for precise building
- Joint creation tool: click two bodies to connect them with a chosen joint type
- Body property inspector (mass, velocity, friction, restitution)
- Slow-motion replay

## Game Modes
- **Sandbox** (free build)
- **Puzzle** (get ball from A to B using limited parts)
- **Destruction** (topple a structure with one projectile — Angry Birds style)
- **Vehicle challenge** (drive over terrain)
- **Contraption contest** (most elaborate Rube Goldberg)
