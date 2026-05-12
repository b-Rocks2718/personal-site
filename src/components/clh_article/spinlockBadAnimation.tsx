import { useState } from 'react';

const steps = [
	"Spinlock is initially free.",
	"Thread A swaps true into the lock, sees it wasn't taken, and takes the lock.",
	"Thread B swaps true into the lock, sees it was already taken, and starts spinning.",
	"Thread A releases the lock by setting it to false.",
	"Before Thread B can can observe the release, thread A reacquires the lock.",
];

export default function SpinlockBadAnimation() {
	const [step, setStep] = useState(0);

  const lockTaken = [1, 2, 4].includes(step);
  const threadAState = lockTaken ? 'active' : 'free';
  const threadAWorking = [1, 3, 4].includes(step);
  const threadBState = step <= 1 ? 'free' : 'waiting';
  const threadBWorking = step === 2;

	return (
    <figure className="spinlock-figure">
      <div className="spinlock-demo">
        <div className="spinlock-row">
          <div className={lockTaken ? 'lock taken' : 'lock free'}>lock ({lockTaken ? 'taken' : 'free'})</div>
        </div>

        <div className="thread-row">
          <div className={`thread ${threadAState} ${threadAWorking ? 'working' : ''}`}>A ({threadAState})</div>
          <div className={`thread ${threadBState} ${threadBWorking ? 'working' : ''}`}>B ({threadBState})</div>
        </div>

        <p className="step-text">{steps[step]}</p>

        <div className="controls-row">
          <div className="controls">
            <button onClick={() => setStep(Math.max(0, step - 1))}>Back</button>
            <button onClick={() => setStep(Math.min(steps.length - 1, step + 1))}>Next</button>
          </div>

          <div className="slide-counter">
            {step + 1} / {steps.length}
          </div>
        </div>
      </div>

      <figcaption>
        Spinlock (bad case)
      </figcaption>

			<style>{`
				.spinlock-demo {
					margin: 0;
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          color: #494e59;
          font-size: 1.2rem;
          line-height: 1.4;
          text-align: left;
				}

				.spinlock-row {
					display: flex;
					gap: 1rem;
					margin-bottom: 1rem;
          justify-content: center;
				}

        .thread-row {
					display: flex;
					gap: 6rem;
					margin-bottom: 1rem;
          margin-top: 2rem;
          justify-content: center;
				}

				.lock {
					width: 110px;
					height: 60px;
					display: grid;
					place-items: center;
					border-radius: 8px;
					background: #eee;
          border: 2px solid #494e59;
				}

				.lock.taken {
					background: #d74a37;
					color: white;
				}

				.lock.free {
					background: #42db31;
				}

        .thread {
					width: 100px;
					height: 32px;
					display: grid;
					place-items: center;
					border-radius: 8px;
					background: #eee;
          border: 2px solid #b8b2a8;
				}

        .thread.waiting {
          background: #d74a37;
          color: white;
        }

        .thread.active {
					background: #42db31;
					color: white;
				}

        .thread.working {
          border-color: #000000;
	        box-shadow: 0 0 0 2px white, 0 0 0 4px #000000;
        }

				.thread.free {
					background: #b4b5b0;
				}

				.controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .controls {
          display: flex;
          gap: 0.5rem;
        }

        .slide-counter {
          color: #6b7280;
          font-size: 0.8rem;
          line-height: 1;
        }

        .spinlock-demo .step-text {
          margin: 0 0 1rem 0;
          min-height: 1rem;
        }
        
        @media (max-width: 720px) {
          .spinlock-demo {
            font-size: 1rem;
            padding: 0.75rem;
          }

          .thread-row {
            gap: 3rem;
            margin-top: 1rem;
          }

          .thread {
            width: 82px;
            height: 28px;
            padding: 0 0.25rem;
            font-size: 0.9rem;
            line-height: 1.1;
            text-align: center;
            box-sizing: border-box;
          }

          .lock {
            width: 96px;
            height: 48px;
            padding: 0 0.25rem;
            font-size: 0.9rem;
            line-height: 1.1;
            text-align: center;
            box-sizing: border-box;
          }

          .spinlock-demo .step-text {
            min-height: 4rem;
          }

          .controls-row {
            align-items: flex-end;
          }

          .controls {
            flex-wrap: wrap;
          }
        }
			`}</style>
    </figure>
	);
}
