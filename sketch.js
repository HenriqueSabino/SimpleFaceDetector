let video
function setup() {
    createCanvas(200, 100)

    video = createCapture(VIDEO)
    video.size(width, height)
    video.hide()
}

function draw() {
    background(255)
    image(video, 0, 0)

    let skinAreas = []
    let hairAreas = []
    video.loadPixels()

    detectSkinAndHair(video, skinAreas, hairAreas)

    let hairComponents = connectedComponents(hairAreas)

    // drawComponents(hairComponents)

    let skinComponents = connectedComponents(skinAreas)

    // drawComponents(skinComponents)

    for (let i = 0; i < skinComponents.length; i++) {
        for (let j = 0; j < hairComponents.length; j++) {
            isFace(skinComponents[i], hairComponents[j])
        }
    }
}

function isFace(skinComponent, hairComponent) {
    let skinBox = {
        min: {
            x: min(skinComponent.map(e => e.j)), y: min(skinComponent.map(e => e.i))
        },
        max: {
            x: max(skinComponent.map(e => e.j)), y: max(skinComponent.map(e => e.i))
        }
    }

    let hairBox = {
        min: {
            x: min(hairComponent.map(e => e.j)), y: min(hairComponent.map(e => e.i))
        },
        max: {
            x: max(hairComponent.map(e => e.j)), y: max(hairComponent.map(e => e.i))
        }
    }

    if (hairBox.max.y >= skinBox.min.y && hairBox.min.y <= skinBox.max.y) {
        noFill()
        strokeWeight(2)

        stroke(255, 0, 0)
        drawComponents([skinComponent])
    }
}

function detectSkinAndHair(image, skinAreas, hairAreas) {
    for (let j = 0; j < height; j += 5) {

        skinAreas.push([])
        hairAreas.push([])

        for (let i = 0; i < width; i += 5) {

            let skinCount = 0
            let hairCount = 0
            for (let n = j; n < j + 5; n++) {
                for (let m = i; m < i + 5; m++) {

                    if (n > height || m > width) {
                        continue
                    }

                    const pixelIndex = (m + n * width) * 4
                    const R = image.pixels[pixelIndex + 0]
                    const G = image.pixels[pixelIndex + 1]
                    const B = image.pixels[pixelIndex + 2]

                    const r = R / 255
                    const g = G / 255

                    const w = (sq(r - 0.33) + sq(g - 0.33)) > 0.001

                    const theta = acos((0.5 * ((R - G) + (R - B))) / sqrt(sq(R - G) + (R - B) * (G - B)))
                    const H = (B <= G) ? theta : 360 - theta
                    const I = (R + G + B) / 3


                    if (g > F2(r) && g < F1(r) && w && (H <= 20 || H > 240)) {
                        skinCount++
                    }

                    if (I < 80 && (B - G < 15 || B - R < 15) || (H > 20 && H <= 40)) {
                        hairCount++
                    }
                }
            }

            if (hairCount >= 12) {
                hairAreas[j / 5].push(1)
            } else {
                hairAreas[j / 5].push(0)
            }

            if (skinCount >= 12) {
                skinAreas[j / 5].push(1)
            } else {
                skinAreas[j / 5].push(0)
            }
        }
    }
}

function drawSkinAndHair(skinAreas, hairAreas) {
    for (let i = 0; i < skinAreas.length; i++) {
        for (let j = 0; j < skinAreas[i].length; j++) {

            if (hairAreas[i][j] == 1) {
                noStroke()
                fill(0)
                rect(5 * j, 5 * i, 5, 5)
            }

            if (skinAreas[i][j] == 1) {
                noStroke()
                fill(150, 120, 0)
                rect(5 * j, 5 * i, 5, 5)
            }
        }
    }
}

function drawComponents(components) {
    for (let i = 0; i < components.length; i++) {

        let minJ = min(components[i].map(e => e.j)) * 5
        let maxJ = max(components[i].map(e => e.j)) * 5

        let minI = min(components[i].map(e => e.i)) * 5
        let maxI = max(components[i].map(e => e.i)) * 5

        rect(minJ, minI, maxJ - minJ, maxI - minI)
    }
}

function min(arr) {
    if (arr.length == 0) return undefined

    let m = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] < arr[m]) {
            m = i;
        }
    }

    return arr[m];
}

function max(arr) {
    if (arr.length == 0) return undefined

    let m = 0;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] > arr[m]) {
            m = i;
        }
    }

    return arr[m];
}

function connectedComponents(area) {
    let components = []

    for (let i = 0; i < area.length; i++) {
        for (let j = 0; j < area[i].length; j++) {

            if (area[i][j] == 0) continue

            let inComponent = false
            for (let i = 0; i < components.length; i++) {
                for (let p = 0; p < components[i].length; p++) {
                    if (components[i][p].i == i && components[i][p].j == j) {
                        inComponent = true
                        break
                    }
                }
            }

            if (inComponent) continue

            let queue = [{ i: i, j: j }]
            let visited = []
            while (queue.length > 0) {

                let pixel = queue.pop()
                visited.push(pixel)

                for (let a = -1; a <= 1; a++) {
                    for (let b = -1; b <= 1; b++) {
                        let neighbor = { i: pixel.i + a, j: pixel.j + b }

                        if (neighbor.i < 0 || neighbor.i >= area.length ||
                            neighbor.j < 0 || neighbor.j >= area[i].length ||
                            area[neighbor.i][neighbor.j] == 0)
                            continue

                        let isVisited = false
                        for (let p = 0; p < visited.length; p++) {
                            if (visited[p].i == neighbor.i && visited[p].j == neighbor.j) {
                                isVisited = true
                                break
                            }
                        }

                        let isQueued = false
                        for (let p = 0; p < queue.length; p++) {
                            if (queue[p].i == neighbor.i && queue[p].j == neighbor.j) {
                                isQueued = true
                                break
                            }
                        }

                        if (isVisited || isQueued) continue

                        queue.unshift(neighbor)
                    }
                }
            }

            if (visited.length > 15)
                components.push(visited)
        }
    }

    return components
}

function F1(r) {
    return -1.376 * sq(r) + 1.0743 * r + 0.2
}

function F2(r) {
    return -0.776 * sq(r) + 0.5601 * r + 0.18
}