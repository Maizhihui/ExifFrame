let isFontsLoaded = false;
function loadFonts() {
    const fontInter400 = new FontFace('Inter', 'url(./fonts/inter-v12-latin-regular.woff2)', { weight: '400' });
    const fontInter500 = new FontFace('Inter', 'url(./fonts/inter-v12-latin-500.woff2)', { weight: '500' });
    const fontInter700 = new FontFace('Inter', 'url(./fonts/inter-v12-latin-700.woff2)', { weight: '700' });

    return Promise.all([fontInter400.load(), fontInter500.load(), fontInter700.load()]).then(function (loadedFonts) {
      loadedFonts.forEach(function (loadedFont) {
        document.fonts.add(loadedFont);
      });

      isFontsLoaded = true;
    }).catch(function (error) {
      alert('无法加载字体：' + error);
    });
}
loadFonts();
window.onload = function () {
  loadFonts();
  //文件操作相关
  const fileInput = document.getElementById('upload');
  const uploadBtn = document.getElementById('uploadBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  //加载相关
  const loadingDiv = document.getElementById('loading');

  //样例图像
  const sampleContent = document.getElementById('sampleContent');
  const slideShowImage = document.getElementById('slideshowImage');

  //结果图像显示相关
  const contentsDiv = document.getElementById('resultContents');
  const resultImage = document.getElementById('resultImage');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  //结果显示和更正表格相关
  const makeInput = document.getElementById('makeInput');
  const modelInput = document.getElementById('modelInput');
  const lensInput = document.getElementById('lensInput');
  const focalLengthIn35mmFilmInput = document.getElementById('focalLengthIn35mmFilmInput');
  const fNumberInput = document.getElementById('fNumberInput');
  const exposureTimeInput = document.getElementById('exposureTimeInput');
  const isoSpeedRatingsInput = document.getElementById('isoSpeedRatingsInput');
  const fixInfoBtn = document.getElementById('fixInfoBtn');

  let file;
  let imgData = null;
  let isImageDisplayed = true;

  uploadBtn.addEventListener('click', function () {
    fileInput.click();
  });

  fileInput.addEventListener('change', function (e) {
    //隐藏样例内容并显示加载屏幕
    sampleContent.style.display = 'none';
    toggleImageDisplay();
    toggleLoading();

    file = e.target.files[0];
    let reader = new FileReader();

    reader.onloadend = function () {
      let img = new Image();
      img.onload = function () {
        //将原始图像保存到变量以进行修改
        imgData = img;
        let exifData = {};
        EXIF.Tags[0xA432]="LensSpecification";
        EXIF.Tags[0xA433]="LensMake";
        EXIF.Tags[0xA434]="LensModel";
        EXIF.Tags[0xA435]="LensSerialNumber";
        EXIF.getData(img, function () {
          exifData = EXIF.getAllTags(this);
        });

        //字体加载和文本渲染（防止字体双重加载）
        if (isFontsLoaded) {
          draw(exifData)
        } else {
          loadFonts().then(function () {
            draw(exifData)
          });
        }

      }
      img.src = reader.result;
    }

    if (file) {
      reader.readAsDataURL(file);
    }

    //启用下载按钮
    downloadBtn.disabled = false;
  }, false);

  downloadBtn.addEventListener('click', function () {
    let a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 1.0);
    let fileNameWithoutExtension = file.name.split('.')[0];
    a.download = fileNameWithoutExtension + '-frame.jpeg';
    a.click();
  });

  fixInfoBtn.addEventListener('click', function () {
    let inputs = {
      Make: makeInput.value,
      Model: modelInput.value,
      LensModel: lensInput.value,
      FocalLengthIn35mmFilm: focalLengthIn35mmFilmInput.value,
      FNumber: fNumberInput.value,
      ExposureTimeString: exposureTimeInput.value,
      ISOSpeedRatings: isoSpeedRatingsInput.value
    };
    
    exifData = {};
    
    for (let key in inputs) {
      let trimed_input = inputs[key].trim()
      if (trimed_input !== "") {
        exifData[key] = trimed_input;
      }
    }
    toggleImageDisplay();
    draw(exifData)
  });

  // function slideshowtimer() {
  //   if (slideNum === 3) {
  //     slideNum = 0;
  //   }
  //   else {
  //     slideNum++;
  //   }
  //   slideShowImage.src = `samples/sample${slideNum + 1}.webp`;
  // }

  // let slideNum = 0;
  //setInterval(slideshowtimer, 3000);
  
  function draw(exifData) {
    let text1 = '';
    let text2 = '';
    let text3 = '';
    if( isMobile() ){
      //调整尺寸
      imgData.width = imgData.width * 0.70;
      imgData.height = imgData.height * 0.70;
    }
    const HORIZONTAL_MARGIN = imgData.width * 0.025;
    const BOTTOM_MARGIN = imgData.width > imgData.height ? imgData.height * 0.25 : imgData.width * 0.17;
    const BASE_FONT_SIZE = imgData.width > imgData.height ? imgData.height * 0.0275 : imgData.width * 0.02;
    const FONT_FAMILY = 'Inter, sans-serif';
    const LINE_SPACING = imgData.width > imgData.height ? imgData.height * 0.005 : imgData.width * 0.0045;

    canvas.width = imgData.width + HORIZONTAL_MARGIN * 2;
    canvas.height = imgData.height + BOTTOM_MARGIN;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(imgData, HORIZONTAL_MARGIN, HORIZONTAL_MARGIN, imgData.width, imgData.height);

    ctx.fillStyle = '#747474';
    ctx.font = '400 ' + BASE_FONT_SIZE + 'px ' + FONT_FAMILY;
    // ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let textCenter = canvas.height - BOTTOM_MARGIN / 2;

    if ("Make" in exifData) {
      text1 = exifData.Make.replace(/\u0000/g, '');
    }
    if ("Model" in exifData) {
      text2 = '  ' + exifData.Model.replace(/\u0000/g, '');
    }
    if ("LensModel" in exifData) {
      text3 = '  /  ' + exifData.LensModel.replace(/\u0000/g, '');
    }
    let text1Width = ctx.measureText(text1).width;
    let text2Width = ctx.measureText(text2).width;
    let textStart = canvas.width / 2 - (text1Width + text2Width + ctx.measureText(text3).width) / 2;

    let exposureTime;
    if (exifData.ExposureTime != undefined) {
      exposureTime = exifData.ExposureTime >= 1 ? exifData.ExposureTime : `1/${Math.round(1 / exifData.ExposureTime)}`;
    } else {
      exposureTime = exifData.ExposureTimeString;
    }

    let focalLengthText = exifData.FocalLengthIn35mmFilm ? `${exifData.FocalLengthIn35mmFilm}mm ` : (exifData.FocalLength ? `${exifData.FocalLength}mm ` : '');
    let fNumberText = exifData.FNumber ? `f/${exifData.FNumber} ` : '';
    let exposureTimeText = exposureTime ? `${exposureTime}s ` : '';
    let isoSpeedRatingsText = exifData.ISOSpeedRatings ? `ISO${exifData.ISOSpeedRatings}` : '';
    let finalText = focalLengthText + fNumberText + exposureTimeText + isoSpeedRatingsText;

    makeInput.value = "Make" in exifData ? exifData.Make : '';
    modelInput.value = "Model" in exifData ? exifData.Model : '';
    lensInput.value = "LensModel" in exifData ? exifData.LensModel : '';
    focalLengthIn35mmFilmInput.value = focalLengthText.replace('mm ', '');
    fNumberInput.value = fNumberText.replace('f/', '').replace(' ', '');
    exposureTimeInput.value = exposureTimeText.replace('s ', '');
    isoSpeedRatingsInput.value = isoSpeedRatingsText.replace('ISO', '');

    let textHeight = finalText ? textCenter - LINE_SPACING : textCenter + BASE_FONT_SIZE / 2;
    ctx.font = '700 ' + BASE_FONT_SIZE + 'px ' + FONT_FAMILY;
    ctx.fillStyle = '#000000';
    ctx.fillText(text1, textStart, textHeight);
    ctx.font = '700 ' + BASE_FONT_SIZE + 'px ' + FONT_FAMILY;
    ctx.fillStyle = '#000000';
    ctx.fillText(text2, textStart + text1Width, textHeight);
    ctx.font = '700 ' + BASE_FONT_SIZE + 'px ' + FONT_FAMILY;
    // ctx.fillStyle = '#343434';  // 文字色
    ctx.fillText(text3, textStart + text1Width + text2Width, textHeight);

    ctx.textAlign = 'center';
    ctx.font = '400 ' + BASE_FONT_SIZE * 0.8 + 'px ' + FONT_FAMILY;
    ctx.fillStyle = '#747474';
    ctx.fillText(finalText, canvas.width / 2, textCenter + LINE_SPACING + BASE_FONT_SIZE);

    let result = canvas.toDataURL('image/jpeg', 1.0);
    if (result === "data:,") {
      toggleLoading(false);
      alert("生成失败，尝试减小图像的高度和宽度。");
      return;
    }
    resultImage.src = result;
    toggleLoading(false);
    toggleImageDisplay();
  }

  function toggleImageDisplay() {
    contentsDiv.style.display = isImageDisplayed ? 'none' : 'block';
    isImageDisplayed = !isImageDisplayed;
  }

  function toggleLoading(isDisplay = true) {
    loadingDiv.style.display = isDisplay ? 'flex' : 'none';
  }
  
  function isMobile(){
    return /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test( navigator.userAgent );
  }
}
