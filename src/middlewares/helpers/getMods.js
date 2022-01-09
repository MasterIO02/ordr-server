module.exports = async modNumber => {
    let modStr = ""
    let mods = {
        NoFail: 1,
        Easy: 2,
        TouchDevice: 4,
        Hidden: 8,
        HardRock: 16,
        SuddenDeath: 32,
        DoubleTime: 64,
        Relax: 128,
        HalfTime: 256,
        Nightcore: 512,
        Flashlight: 1024,
        Autoplay: 2048,
        SpunOut: 4096,
        Relax2: 8192, // Autopilot
        Perfect: 16384
    }

    if (modNumber & mods.NoFail) {
        modStr += "NF"
    }
    if (modNumber & mods.Easy) {
        modStr += "EZ"
    }
    if (modNumber & mods.TouchDevice) {
        modStr += "TD"
    }
    if (modNumber & mods.Hidden) {
        modStr += "HD"
    }
    if (modNumber & mods.HardRock) {
        modStr += "HR"
    }
    if (modNumber & mods.SuddenDeath) {
        modStr += "SD"
    }
    if (modNumber & mods.DoubleTime) {
        modStr += "DT"
    }
    if (modNumber & mods.Relax) {
        modStr += "RX"
    }
    if (modNumber & mods.HalfTime) {
        modStr += "HT"
    }
    if (modNumber & mods.Nightcore) {
        modStr += "NC"
    }
    if (modNumber & mods.Flashlight) {
        modStr += "FL"
    }
    if (modNumber & mods.Autoplay) {
        modStr += "AT"
    }
    if (modNumber & mods.SpunOut) {
        modStr += "SO"
    }
    if (modNumber & mods.Relax2) {
        modStr += "AP"
    }
    if (modNumber & mods.Perfect) {
        modStr += "PF"
    }

    if (modStr.includes("DT") && modStr.includes("NC")) {
        modStr = modStr.replace("DT", "")
    }
    if (modStr.includes("SD") && modStr.includes("PF")) {
        modStr = modStr.replace("SD", "")
    }

    return modStr
}
