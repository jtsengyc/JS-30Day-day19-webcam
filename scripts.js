const video = document.querySelector('.player');
const canvas = document.querySelector('.photo');
const ctx = canvas.getContext('2d');
const strip = document.querySelector('.strip');
const snap = document.querySelector('.snap');

const methods = {
  rbgSplit, blur, redShift, greenScreen, grayScale, flip
}

let selectedProcessor = null;

document.querySelector('.processorSelector').addEventListener('change', (e) => {
  if(e.target.value) {
    selectedProcessor = methods[e.target.value];
  } else {
    selectedProcessor = null;
  }
});

navigator.mediaDevices.getUserMedia({video: true}).then(
  mediaStream => {
    console.log(mediaStream);
    video.src = window.URL.createObjectURL(mediaStream);
    video.play();
  }
);

video.addEventListener('canplay', e => {
  const {videoWidth: width, videoHeight: height} = video;

  // set canvas size to fit with input video
  Object.assign(canvas, {width, height});

  // print image on interval to canvas, with optional processing if specified
  setInterval(() => {
    ctx.drawImage(video, 0, 0, width, height);
    if(selectedProcessor) {
      let image = ctx.getImageData(0, 0, width, height);
      image = selectedProcessor(image, width, height);
      ctx.putImageData(image, 0, 0);
    }
  }, 64);
})

function takePhoto() {
  const data = canvas.toDataURL('image/jpeg');
  const link = document.createElement('a');
  link.href = data;
  link.setAttribute('download', 'img');
  link.innerHTML = `<img src="${data}" alt="img" />`;
  strip.insertBefore(link, strip.firsChild);
}

function redShift(image) {
  for(let i = 0; i < image.data.length; i += 4) {
    image.data[i + 0] = image.data[i + 0] * 2;
    image.data[i + 1] = image.data[i + 1] / 2;
    image.data[i + 2] = image.data[i + 2] / 2;
  }
  return image;
}

// vertical blur is quite inefficient without proper matrix library
function blur(image) {
  for(let i = 0; i < image.data.length; i += 4) {
    try {
      image.data[i + 0] = (image.data[i - 16] + image.data[i - 12] + image.data[i - 8] + image.data[i - 4] + image.data[i] + image.data[i + 16] + image.data[i + 12] + image.data[i + 8] + image.data[i + 4])/9;
      image.data[i + 1] = (image.data[i - 15] + image.data[i - 11] + image.data[i - 7] + image.data[i - 3] + image.data[i + 1] + image.data[i + 17] + image.data[i + 13] + image.data[i + 9] + image.data[i + 5])/9;
      image.data[i + 2] = (image.data[i - 14] + image.data[i - 10] + image.data[i - 6] + image.data[i - 2] + image.data[i + 2] + image.data[i + 18] + image.data[i + 14] + image.data[i + 10] + image.data[i + 6])/9;
    } catch(e) {

    }
  }
  return image;
}

function rbgSplit(image) {
  for(let i = 0; i < image.data.length; i += 4) {
    image.data[i - 100] = image.data[i + 0];
    image.data[i - 199] = image.data[i + 1];
    image.data[i - 298] = image.data[i + 2];
  }
  return image;
}

function grayScale(image) {
  for(let i = 0; i < image.data.length; i += 4) {
    const avg = (image.data[i + 0] + image.data[i + 1] + image.data[i + 2]) / 3;
    image.data[i + 0] = avg;
    image.data[i + 1] = avg;
    image.data[i + 2] = avg;
  }
  return image;
}

function flip(image, width, height) {
  const rowPixels = width * 4;
  for(let i = 0; i < height; i++) {
    const startIdx = i * rowPixels;
    for(let j = 0; j < width/2; j++) {
      const aIdx = startIdx + j * 4;
      const bIdx = startIdx + rowPixels - ((j + 1) * 4);
      const swap = image.data.slice(aIdx, aIdx + 4);
      image.data[aIdx + 0] = image.data[bIdx + 0];
      image.data[aIdx + 1] = image.data[bIdx + 1];
      image.data[aIdx + 2] = image.data[bIdx + 2];
      image.data[aIdx + 3] = image.data[bIdx + 3];
      image.data[bIdx + 0] = swap[0];
      image.data[bIdx + 1] = swap[1];
      image.data[bIdx + 2] = swap[2];
      image.data[bIdx + 3] = swap[3];
    }
  }
  return image;
}

function greenScreen(image) {
  const levels = {};
  document.querySelectorAll('.rgb input').forEach((input) => {
    levels[input.name] = input.value;
  });

  for (let i = 0; i < image.data.length; i += 4) {
    red = image.data[i + 0];
    green = image.data[i + 1];
    blue = image.data[i + 2];

    if (red >= levels.rmin && red <= levels.rmax
      && green >= levels.gmin && green <= levels.gmax
      && blue >= levels.bmin && blue <= levels.bmax) {
      image.data[i + 3] = 0;
    }
  }
  return image;
}

