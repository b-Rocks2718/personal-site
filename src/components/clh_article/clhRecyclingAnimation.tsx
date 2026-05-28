import { useState } from 'react';

type NodeId = 'dummy' | 'a' | 'b' | 'c';
type ThreadId = 'A' | 'B' | 'C';

type ClhNode = {
	id: NodeId;
	label: string;
	owner: string;
	locked: boolean;
	x: number;
	y: number;
};

type Spin = {
	thread: ThreadId;
	node: NodeId;
};

type Step = {
	text: string;
	tail: NodeId;
	active?: ThreadId;
	waiting: ThreadId[];
	spins: Spin[];
	nodes: ClhNode[];
};

const threadPositions: Record<ThreadId, { x: number; y: number }> = {
	A: { x: 270, y: 35 },
	B: { x: 450, y: 35 },
	C: { x: 630, y: 35 },
};

const nodePositions = {
	dummy: { x: 110, y: 205 },
	a: { x: 270, y: 205 },
	b: { x: 450, y: 205 },
	c: { x: 630, y: 205 },
	dummyReady: { x: 110, y: 110 },
	aReady: { x: 270, y: 110 },
	bReady: { x: 450, y: 110 },
	cReady: { x: 630, y: 110 },
};

const baseNodes = {
	dummy: {
		id: 'dummy',
		label: 'dummy',
		owner: 'initial tail',
		locked: false,
		...nodePositions.dummy,
	},
	a: {
		id: 'a',
		label: 'A node',
		owner: 'A my_node',
		locked: true,
		...nodePositions.a,
	},
	b: {
		id: 'b',
		label: 'B node',
		owner: 'B my_node',
		locked: true,
		...nodePositions.b,
	},
	c: {
		id: 'c',
		label: 'C node',
		owner: 'C my_node',
		locked: true,
		...nodePositions.c,
	},
} satisfies Record<NodeId, ClhNode>;

const readyNode = (id: NodeId): ClhNode => ({
	...baseNodes[id],
	...nodePositions[`${id}Ready`],
});

const ownedNode = (id: NodeId, thread: ThreadId, owner: string, locked = false): ClhNode => ({
	...baseNodes[id],
	owner,
	locked,
	x: threadPositions[thread].x,
	y: 110,
});

const steps: Step[] = [
	{
		text: 'Each thread starts with one node. The lock tail points at an unlocked dummy node.',
		tail: 'dummy',
		waiting: [],
		spins: [],
		nodes: [
			baseNodes.dummy,
			readyNode('a'),
			readyNode('b'),
			readyNode('c'),
		],
	},
	{
		text: 'A acquires the lock. Its predecessor is the dummy node, which is already unlocked.',
		tail: 'a',
		active: 'A',
		waiting: [],
		spins: [],
		nodes: [
			ownedNode('dummy', 'A', 'A my_pred'),
			baseNodes.a,
			readyNode('b'),
			readyNode('c'),
		],
	},
	{
		text: 'B joins behind A and records A\'s node as my_pred.',
		tail: 'b',
		active: 'A',
		waiting: ['B'],
		spins: [{ thread: 'B', node: 'a' }],
		nodes: [
			ownedNode('dummy', 'A', 'A my_pred'),
			{ ...baseNodes.a, owner: 'B my_pred' },
			baseNodes.b,
			readyNode('c'),
		],
	},
	{
		text: 'A releases, clears its node, and moves the dummy node under A as its new my_node.',
		tail: 'b',
		active: 'B',
		waiting: [],
		spins: [],
		nodes: [
			ownedNode('dummy', 'A', 'A my_node'),
			ownedNode('a', 'B', 'B my_pred'),
			baseNodes.b,
			readyNode('c'),
		],
	},
	{
		text: 'C joins behind B. B will be able to recycle A\'s old node when it releases.',
		tail: 'c',
		active: 'B',
		waiting: ['C'],
		spins: [{ thread: 'C', node: 'b' }],
		nodes: [
			ownedNode('dummy', 'A', 'A my_node'),
			ownedNode('a', 'B', 'B my_pred'),
			baseNodes.b,
			baseNodes.c,
		],
	},
	{
		text: 'B releases the lock.',
		tail: 'c',
		active: 'C',
		waiting: [],
		spins: [],
		nodes: [
			ownedNode('dummy', 'A', 'A my_node'),
			ownedNode('a', 'B', 'B my_node'),
			ownedNode('b', 'C', 'C my_pred'),
			baseNodes.c,
		],
	},
	{
		text: 'C releases the lock and recycles B\'s old node. C\'s original node has taken the place of the dummy node from the beginning.',
		tail: 'c',
		waiting: [],
		spins: [],
		nodes: [
			ownedNode('dummy', 'A', 'A my_node'),
			ownedNode('a', 'B', 'B my_node'),
			ownedNode('b', 'C', 'C my_node'),
			{ ...baseNodes.c, locked: false, owner: ' ', ...nodePositions.dummy },
		],
	},
];

const nodeById = (nodes: ClhNode[], id: NodeId) => {
	const node = nodes.find((candidate) => candidate.id === id);
	if (!node) {
		throw new Error(`Missing CLH node: ${id}`);
	}
	return node;
};

export default function ClhRecyclingAnimation() {
	const [step, setStep] = useState(0);
	const current = steps[step];
	const tailNode = nodeById(current.nodes, current.tail);

	return (
		<figure className="clhr-figure">
			<div className="clhr-demo">
				<button className="clhr-reset-button" onClick={() => setStep(0)} aria-label="Reset animation" title="Reset">
					<svg className="clhr-reset-icon" viewBox="0 0 20 20" aria-hidden="true">
						<path d="M16 3v5h-5" />
						<path d="M16 8a6 6 0 1 0 1.5 4" />
					</svg>
				</button>

				<svg className="clhr-stage" viewBox="0 0 720 270" role="img" aria-labelledby="clhr-title clhr-desc">
					<title id="clhr-title">CLH lock node recycling animation</title>
					<desc id="clhr-desc">{current.text}</desc>

					<defs>
						<marker id="clhr-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
							<path d="M 0 0 L 10 5 L 0 10 z" />
						</marker>
						<marker id="clhr-spin-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
							<path d="M 0 0 L 10 5 L 0 10 z" />
						</marker>
					</defs>

						<text className="clhr-lane-label" x="22" y="116">owned</text>
						<line className="clhr-queue-line" x1="55" y1="205" x2="665" y2="205" />
						<text className="clhr-lane-label" x="22" y="211">queue</text>

					{(['A', 'B', 'C'] as ThreadId[]).map((thread) => {
						const position = threadPositions[thread];
						const state = current.active === thread ? 'active' : current.waiting.includes(thread) ? 'waiting' : 'idle';

						return (
							<g key={thread} className={`clhr-thread clhr-thread-${state}`}>
								<rect x={position.x - 42} y={position.y - 18} width="84" height="36" rx="8" />
								<text x={position.x} y={position.y + 5}>{thread}</text>
							</g>
						);
					})}

					<path className="clhr-tail-arrow" d={`M 600 275 C 600 260, ${tailNode.x} 340, ${tailNode.x} ${tailNode.y + 57}`} />
					<text className="clhr-pointer-label" x="595" y="290">tail</text>

					{current.spins.map((spin) => {
						const thread = threadPositions[spin.thread];
						const node = nodeById(current.nodes, spin.node);
						const midY = thread.y + 75;

						return (
							<g key={`${spin.thread}-${spin.node}`} className="clhr-spin-link">
								<path d={`M ${thread.x} ${thread.y + 22} C ${thread.x} ${midY}, ${node.x + 70} ${midY}, ${node.x + 50} ${node.y - 38}`} />
								<text x={(thread.x + node.x) / 2 + 18} y={midY - 7}>
									{spin.thread} watches
								</text>
							</g>
						);
					})}

					{current.nodes.map((node) => (
						<g
							key={node.id}
							className={`clhr-node ${node.locked ? 'clhr-node-locked' : 'clhr-node-unlocked'}`}
							style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
						>
							<rect x="-55" y="-30" width="110" height="60" rx="8" />
							<text className="clhr-node-label" x="0" y="-7">{node.label}</text>
							<text className="clhr-node-state" x="0" y="14">{node.locked ? 'locked' : 'unlocked'}</text>
							<text className="clhr-node-owner" x="0" y="45">{node.owner}</text>
						</g>
					))}
				</svg>

				<p className="clhr-step-text">{current.text}</p>

				<div className="clhr-controls-row">
					<div className="clhr-controls">
						<button onClick={() => setStep(Math.max(0, step - 1))}>Back</button>
						<button onClick={() => setStep(Math.min(steps.length - 1, step + 1))}>Next</button>
					</div>

					<div className="clhr-slide-counter">
						{step + 1} / {steps.length}
					</div>
				</div>
			</div>

			<figcaption>
				CLH node recycling
			</figcaption>

			<style>{`
				.clhr-demo {
					position: relative;
					margin: 0;
					padding: 1rem;
					border: 1px solid #ddd;
					border-radius: 8px;
					color: #494e59;
					font-size: 1.05rem;
					line-height: 1.4;
					text-align: left;
				}

				.clhr-stage {
					display: block;
					width: 100%;
					height: auto;
					margin-bottom: 2rem;
					overflow: visible;
				}

				.clhr-stage text {
					font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;
					text-anchor: middle;
					pointer-events: none;
				}

				.clhr-queue-line {
					stroke: #d8d2c7;
					stroke-width: 3;
					stroke-linecap: round;
				}

				.clhr-lane-label,
				.clhr-pointer-label,
				.clhr-spin-link text,
				.clhr-node-owner {
					fill: #6b7280;
					font-size: 14px;
				}

				.clhr-lane-label {
					text-anchor: start;
				}

				.clhr-pointer-label {
					font-weight: 700;
				}

				.clhr-tail-arrow {
					fill: none;
					stroke: #494e59;
					stroke-width: 2.5;
					marker-end: url(#clhr-arrow);
					transition: d 350ms ease;
				}

				#clhr-arrow path {
					fill: #494e59;
				}

				#clhr-spin-arrow path {
					fill: #268874;
				}

				.clhr-spin-link path {
					fill: none;
					stroke: #268874;
					stroke-width: 2;
					stroke-dasharray: 5 5;
					marker-end: url(#clhr-spin-arrow);
				}

				.clhr-spin-link text {
					fill: #215e48;
					font-size: 13px;
				}

				.clhr-thread rect {
					stroke: #b8b2a8;
					stroke-width: 2;
					fill: #b4b5b0;
				}

				.clhr-thread text {
					fill: white;
					font-size: 18px;
					font-weight: 700;
				}

				.clhr-thread-active rect {
					fill: #42a750;
					stroke: #111827;
				}

				.clhr-thread-waiting rect {
					fill: #d74a37;
					stroke: #111827;
				}

				.clhr-node {
					transition: transform 350ms ease, opacity 200ms ease;
				}

				.clhr-node rect {
					stroke: #494e59;
					stroke-width: 2;
				}

				.clhr-node-locked rect {
					fill: #d74a37;
				}

				.clhr-node-unlocked rect {
					fill: #42db31;
				}

				.clhr-node-label,
				.clhr-node-state {
					fill: #20242d;
				}

				.clhr-node-label {
					font-size: 16px;
					font-weight: 700;
				}

				.clhr-node-state {
					font-size: 15px;
				}

				.clhr-node-locked .clhr-node-label,
				.clhr-node-locked .clhr-node-state {
					fill: white;
				}

				.clhr-demo .clhr-step-text {
					margin: 1rem 0 1rem 0;
					min-height: 3rem;
				}

				.clhr-controls-row {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 1rem;
				}

				.clhr-controls {
					display: flex;
					gap: 0.5rem;
				}

				.clhr-reset-button {
					position: absolute;
					top: 0.5rem;
					left: 0.5rem;
					width: 2rem;
					height: 2rem;
					display: grid;
					place-items: center;
					padding: 0;
				}

				.clhr-reset-icon {
					width: 1rem;
					height: 1rem;
					fill: none;
					stroke: currentColor;
					stroke-width: 2;
					stroke-linecap: round;
					stroke-linejoin: round;
				}

				.clhr-slide-counter {
					color: #6b7280;
					font-size: 0.8rem;
					line-height: 1;
				}

				@media (max-width: 720px) {
					.clhr-demo {
						font-size: 0.95rem;
						padding: 0.75rem;
					}

					.clhr-demo .clhr-step-text {
						min-height: 5rem;
					}

					.clhr-lane-label,
					.clhr-pointer-label,
					.clhr-spin-link text,
					.clhr-node-owner {
						font-size: 16px;
					}

					.clhr-node-label {
						font-size: 17px;
					}

					.clhr-node-state,
					.clhr-thread text {
						font-size: 16px;
					}
				}
			`}</style>
		</figure>
	);
}
