import json, subprocess

def check(*files):
    """Run pssparser and return its diagnostics, or [] if the model is clean."""
    r = subprocess.run(["pssparser", "--json", *files],
                       capture_output=True, text=True)
    if r.returncode == 2:                  # our invocation is wrong, not the model
        raise RuntimeError(r.stderr)
    return json.loads(r.stdout)["diagnostics"]

for d in check("did_you_mean.pss"):
    print(f'{d["file"]}:{d["line"]}:{d["col"]}: [{d["code"]}] {d["message"]}')
