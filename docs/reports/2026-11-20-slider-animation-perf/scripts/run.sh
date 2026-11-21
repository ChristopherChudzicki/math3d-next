#!/bin/zsh
# Usage: scripts/run.sh [react]
# Measures next.math3d.org (and math3d.org with "react") on the scenes in scene_keys.json,
# in interleaved rounds of one run per scene and app, into results/{x1,x4}/results.jsonl
# (x1: native CPU, x4: CPU throttled 4×). ROUNDS_X1 / ROUNDS_X4 set the round counts.
# Keeps the Mac awake, logs the power source each round, and stops below 20% battery.
cd "${0:A:h}/.."
apps=(next=https://next.math3d.org)
[[ $1 == react ]] && apps=(react=https://math3d.org $apps)
scenes=(${(f)"$(python3 -c 'import json; print("\n".join(json.load(open("scripts/scene_keys.json"))))')"})
key() { python3 -c "import json, sys; print(json.load(open('scripts/scene_keys.json'))[sys.argv[1]])" $1; }
targets() { for s in $scenes; do for a in $apps; do print -r -- "${a%%=*}.$s=${a#*=}/$(key $s)"; done; done; }
log=results/run.log
mkdir -p results
round() { # <kind> <throttle>
	local batt=$(pmset -g batt)
	local pct=$(echo "$batt" | grep -o '[0-9]*%' | tr -d '%')
	print -r -- "== $1 round $(date '+%Y-%m-%d %H:%M') $(echo $batt | head -1)" >>$log
	if [[ $batt == *"Battery Power"* && $pct -lt 20 ]]; then
		echo "stopping: battery $pct%" >>$log
		exit 2
	fi
	caffeinate -di node scripts/measure.cjs results/$1 1 $2 ${(f)"$(targets)"} >>$log 2>&1
}
for i in {1..${ROUNDS_X1:-9}}; do round x1 1; done
for i in {1..${ROUNDS_X4:-6}}; do round x4 4; done
