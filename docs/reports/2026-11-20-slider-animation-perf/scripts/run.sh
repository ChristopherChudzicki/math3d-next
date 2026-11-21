#!/bin/zsh
# Usage: scripts/run.sh  (from a new report folder holding only scripts/ and .gitignore)
# Measures math3d.org and next.math3d.org on the scenes in scene_keys.json, in
# interleaved rounds, into results/{x1,x4}/results.jsonl (x1: native CPU,
# x4: CPU throttled 4×). ROUNDS_X1 / ROUNDS_X4 set the round counts. Keeps the
# Mac awake, logs the power source each round, and stops below 20% battery.
cd "${0:A:h}/.."
if [[ -e results ]]; then
	echo "results/ exists; start from a fresh copy of scripts/ and .gitignore" >&2
	exit 1
fi
mkdir results
log=results/run.log
round() { # <kind> <throttle>
	local batt=$(pmset -g batt)
	local pct=$(echo "$batt" | grep -o '[0-9]*%' | tr -d '%')
	print -r -- "== $1 round $(date '+%Y-%m-%d %H:%M') $(echo $batt | head -1)" >>$log
	if [[ $batt == *"Battery Power"* && $pct -lt 20 ]]; then
		echo "stopping: battery $pct%" >>$log
		exit 2
	fi
	caffeinate -di node scripts/measure.cjs results/$1 $2 \
		react=https://math3d.org next=https://next.math3d.org >>$log 2>&1
}
for i in {1..${ROUNDS_X1:-9}}; do round x1 1; done
for i in {1..${ROUNDS_X4:-6}}; do round x4 4; done
