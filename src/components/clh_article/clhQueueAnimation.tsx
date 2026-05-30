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
		owner: 'Thread A',
		locked: true,
		...nodePositions.a,
	},
	b: {
		id: 'b',
		label: 'B node',
		owner: 'Thread B',
		locked: true,
		...nodePositions.b,
	},
	c: {
		id: 'c',
		label: 'C node',
		owner: 'Thread C',
		locked: true,
		...nodePositions.c,
	},
} satisfies Record<NodeId, ClhNode>;

const readyNode = (id: NodeId): ClhNode => ({
	...baseNodes[id],
	...nodePositions[`${id}Ready`],
});

const steps: Step[] = [
	{
		text: 'The lock starts with tail pointing at an unlocked dummy node.',
		tail: 'dummy',
		waiting: [],
		spins: [],
		nodes: [baseNodes.dummy, readyNode('a'), readyNode('b'), readyNode('c')],
	},
	{
		text: 'A swaps its node into tail. The old tail was unlocked, so A enters the critical section.',
		tail: 'a',
		active: 'A',
		waiting: [],
		spins: [],
		nodes: [readyNode('dummy'), baseNodes.a, readyNode('b'), readyNode('c')],
	},
	{
		text: 'B swaps into tail and spins on A\'s node, which is still locked.',
		tail: 'b',
		active: 'A',
		waiting: ['B'],
		spins: [
			{ thread: 'B', node: 'a' },
		],
		nodes: [readyNode('dummy'), baseNodes.a, baseNodes.b, readyNode('c')],
	},
	{
		text: 'Thread C joins behind B. Each waiting thread watches only its predecessor.',
		tail: 'c',
		active: 'A',
		waiting: ['B', 'C'],
		spins: [
			{ thread: 'B', node: 'a' },
			{ thread: 'C', node: 'b' },
		],
		nodes: [readyNode('dummy'), baseNodes.a, baseNodes.b, baseNodes.c],
	},
	{
		text: 'A releases by clearing its node. B sees A\'s node unlock and acquires the lock next.',
		tail: 'c',
		active: 'B',
		waiting: ['C'],
		spins: [
			{ thread: 'C', node: 'b' },
		],
		nodes: [
			readyNode('dummy'),
			{ ...readyNode('a'), locked: false },
			baseNodes.b,
			baseNodes.c,
		],
	},
	{
		text: 'B releases by clearing its node. C observes that change and becomes the next owner.',
		tail: 'c',
		active: 'C',
		waiting: [],
		spins: [],
		nodes: [
			readyNode('dummy'),
			{...readyNode('a'), locked: false},
			{ ...readyNode('b'), locked: false },
			baseNodes.c,
		],
	},
  {
    text: 'C releases the lock. Tail still points to C\'s unlocked node.',
    tail: 'c',
    active: undefined,
    waiting: [],
    spins: [],
    nodes: [
      readyNode('dummy'),
      {...readyNode('a'), locked: false},
      {...readyNode('b'), locked: false},
      {...baseNodes.c, locked: false},
    ],
  }
];

const threadPositions: Record<ThreadId, { x: number; y: number }> = {
	A: { x: 270, y: 35 },
	B: { x: 450, y: 35 },
	C: { x: 630, y: 35 },
};

const nodeById = (nodes: ClhNode[], id: NodeId) => {
	const node = nodes.find((candidate) => candidate.id === id);
	if (!node) {
		throw new Error(`Missing CLH node: ${id}`);
	}
	return node;
};

export default function ClhQueueAnimation() {
	const [step, setStep] = useState(0);
	const current = steps[step];
	const tailNode = nodeById(current.nodes, current.tail);

	return (
		<figure className="clh-figure">
			<div className="clh-demo">
				<button className="clh-reset-button" onClick={() => setStep(0)} aria-label="Reset animation" title="Reset">
					<img className="clh-reset-icon" src="/icons/reset.svg" alt="" aria-hidden="true" />
				</button>

				<svg className="clh-stage" viewBox="0 0 720 270" role="img" aria-labelledby="clh-title clh-desc">
					<title id="clh-title">CLH lock queue</title>
					<desc id="clh-desc">{current.text}</desc>

					<defs>
						<marker id="clh-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
							<path d="M 0 0 L 10 5 L 0 10 z" />
						</marker>
						<marker id="clh-spin-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
							<path d="M 0 0 L 10 5 L 0 10 z" />
						</marker>
					</defs>

					<line className="clh-queue-line" x1="55" y1="205" x2="665" y2="205" />
					<text className="clh-lane-label" x="22" y="211">queue</text>

					{(['A', 'B', 'C'] as ThreadId[]).map((thread) => {
						const position = threadPositions[thread];
						const state = current.active === thread ? 'active' : current.waiting.includes(thread) ? 'waiting' : 'idle';

						return (
							<g key={thread} className={`clh-thread clh-thread-${state}`}>
								<rect x={position.x - 42} y={position.y - 18} width="84" height="36" rx="8" />
								<text x={position.x} y={position.y + 5}>{thread}</text>
							</g>
						);
					})}

					<path className="clh-tail-arrow" d={`M 600 275 C 600 260, ${tailNode.x} 340, ${tailNode.x} ${tailNode.y + 57}`} />
					<text className="clh-pointer-label" x="595" y="290">tail</text>

					{current.spins.map((spin) => {
						const thread = threadPositions[spin.thread];
						const node = nodeById(current.nodes, spin.node);
						const midY = thread.y + 43;
						const label = current.waiting.includes(spin.thread) ? `${spin.thread} watches` : `prev`;

						return (
							<g key={`${spin.thread}-${spin.node}`} className="clh-spin-link">
								<path d={`M ${thread.x} ${thread.y + 22} C ${thread.x} ${midY}, ${node.x} ${midY}, ${node.x} ${node.y - 38}`} />
								<text x={(thread.x + node.x) / 2 - 10} y={midY - 7}>
									{label}
								</text>
							</g>
						);
					})}

					{current.nodes.map((node) => (
						<g
							key={node.id}
							className={`clh-node ${node.locked ? 'clh-node-locked' : 'clh-node-unlocked'}`}
							style={{ transform: `translate(${node.x}px, ${node.y}px)` }}
						>
							<rect x="-55" y="-30" width="110" height="60" rx="8" />
							<text className="clh-node-label" x="0" y="-7">{node.label}</text>
							<text className="clh-node-state" x="0" y="14">{node.locked ? 'locked' : 'unlocked'}</text>
							<text className="clh-node-owner" x="0" y="45">{node.owner}</text>
						</g>
					))}
				</svg>

				<p className="clh-step-text">{current.text}</p>

				<div className="clh-controls-row">
					<div className="clh-controls">
						<button onClick={() => setStep(Math.max(0, step - 1))}>Back</button>
						<button onClick={() => setStep(Math.min(steps.length - 1, step + 1))}>Next</button>
					</div>

					<div className="clh-slide-counter">
						{step + 1} / {steps.length}
					</div>
				</div>
			</div>

			<figcaption>
				CLH queue
			</figcaption>

			<style>{`
				.clh-demo {
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

				.clh-stage {
					display: block;
					width: 100%;
					height: auto;
					margin-bottom: 2rem;
					overflow: visible;
				}

				.clh-stage text {
					font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;
					text-anchor: middle;
					pointer-events: none;
				}

				.clh-queue-line {
					stroke: #d8d2c7;
					stroke-width: 3;
					stroke-linecap: round;
				}

				.clh-lane-label,
				.clh-pointer-label,
				.clh-spin-link text,
				.clh-node-owner {
					fill: #6b7280;
					font-size: 14px;
				}

				.clh-lane-label {
					text-anchor: start;
				}

				.clh-pointer-label {
					font-weight: 700;
				}

				.clh-tail-arrow {
					fill: none;
					stroke: #494e59;
					stroke-width: 2.5;
					marker-end: url(#clh-arrow);
					transition: d 350ms ease;
				}

				#clh-arrow path {
					fill: #494e59;
				}

				#clh-spin-arrow path {
					fill: #268874;
				}

				.clh-spin-link path {
					fill: none;
					stroke: #268874;
					stroke-width: 2;
					stroke-dasharray: 5 5;
					marker-end: url(#clh-spin-arrow);
				}

				.clh-spin-link text {
					fill: #215e48;
					font-size: 13px;
				}

				.clh-thread rect {
					stroke: #b8b2a8;
					stroke-width: 2;
					fill: #b4b5b0;
				}

				.clh-thread text {
					fill: white;
					font-size: 18px;
					font-weight: 700;
				}

				.clh-thread-active rect {
					fill: #42a750;
					stroke: #111827;
				}

				.clh-thread-waiting rect {
					fill: #d74a37;
					stroke: #111827;
				}

				.clh-node {
					transition: transform 350ms ease, opacity 200ms ease;
				}

				.clh-node rect {
					stroke: #494e59;
					stroke-width: 2;
				}

				.clh-node-locked rect {
					fill: #d74a37;
				}

				.clh-node-unlocked rect {
					fill: #42db31;
				}

				.clh-node-label,
				.clh-node-state {
					fill: #20242d;
				}

				.clh-node-label {
					font-size: 16px;
					font-weight: 700;
				}

				.clh-node-state {
					font-size: 15px;
				}

				.clh-node-locked .clh-node-label,
				.clh-node-locked .clh-node-state {
					fill: white;
				}

				.clh-step-text {
					margin: 1rem 0 1rem 0;
					min-height: 3rem;
				}

				.clh-controls-row {
					display: flex;
					align-items: center;
					justify-content: space-between;
					gap: 1rem;
				}

				.clh-controls {
					display: flex;
					gap: 0.5rem;
				}

				.clh-reset-button {
					position: absolute;
					top: 0.5rem;
					left: 0.5rem;
					width: 2rem;
					height: 2rem;
					display: grid;
					place-items: center;
					padding: 0;
				}

				.clh-reset-icon {
					display: block;
					width: 1rem;
					height: 1rem;
					border-radius: 0;
					fill: none;
					stroke: currentColor;
					stroke-width: 2;
					stroke-linecap: round;
					stroke-linejoin: round;
				}

				.clh-slide-counter {
					color: #6b7280;
					font-size: 0.8rem;
					line-height: 1;
				}

				@media (max-width: 720px) {
					.clh-demo {
						font-size: 0.95rem;
						padding: 0.75rem;
					}

					.clh-step-text {
						min-height: 5rem;
					}

					.clh-lane-label,
					.clh-pointer-label,
					.clh-spin-link text,
					.clh-node-owner {
						font-size: 16px;
					}

					.clh-node-label {
						font-size: 17px;
					}

					.clh-node-state,
					.clh-thread text {
						font-size: 16px;
					}
				}
			`}</style>
		</figure>
	);
}
