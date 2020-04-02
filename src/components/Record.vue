<template>
	<div class="Record">
		<article>
			<section class="experiment">
				<div id="videos-container"></div>
			</section>
			<section class="experiment" v-show="imgSrc">
				<canvas id="canvasCamera" width="320" height="240"></canvas>
			</section>
			<section class="experimentbtn">
				<button id="openCamera" :disabled="openBtn.disabled" @click="openCameraBtn">打开摄像头</button>
				<button id="start-recording" :disabled="startBtn.disabled" @click="startRecording">开始录制</button>
				<!-- <button id="save-recording" :disabled="saveBtn.disabled" @click="saveRecording">保存</button> -->
				<button v-if="openBtn.disabled" @click="setRecording">{{startBtn.disabled?'抓拍':'拍照'}}</button>
			</section>
		</article>
	</div>
</template>

<script>
	export default {
		name: 'Record',
		data() {
			return {
				mediaStream: '',
				recorderFile: '',
				stopRecordCallback: '',
				mediaRecorder: {
					blobs: []
				},
				openBtn: {
					disabled: false
				},
				startBtn: {
					disabled: true
				},
				saveBtn: {
					disabled: true
				},
				imgSrc: '',
			}
		},
		methods: {
			openCameraBtn() {
				this.openBtn.disabled = true;
				this.startBtn.disabled = false;
				this.openCamera();
			},
			
			startRecording() {
				this.startBtn.disabled = true;
				this.startRecord();
			},
			
			saveRecording() {
				this.saver();
			},
			
			setRecording() {
				this.setImage();
			},
			
			// 打开摄像头
			openCamera() {
				var videosContainer = document.getElementById('videos-container');
				var len = videosContainer.childNodes.length;
				for (var i = 0; i < len; i++) {
					videosContainer.removeChild(videosContainer.childNodes[i]);
				}
				var video = document.createElement('video');

				var videoWidth = 320;
				var videoHeight = 238;

				video.controls = false;
				video.muted = true;
				video.width = videoWidth;
				video.height = videoHeight;
				var that = this;
				that.getUserMedia(true, false, function(err, stream) {
					if (err) {
						throw err;
					} else {
						// 通过 MediaRecorder 记录获取到的媒体流
						console.log();
						that.mediaRecorder = new MediaRecorder(stream);
						that.mediaStream = stream;
						var chunks = [],
							startTime = 0;
						video.srcObject = stream;
						video.play();

						videosContainer.appendChild(video);
						that.mediaRecorder.ondataavailable = function(e) {
							that.mediaRecorder.blobs.push(e.data);
							chunks.push(e.data);
						};
						that.mediaRecorder.blobs = [];

						that.mediaRecorder.onstop = function(e) {
							that.recorderFile = new Blob(chunks, {
								'type': that.mediaRecorder.mimeType
							});
							chunks = [];
							if (null != that.stopRecordCallback) {
								that.stopRecordCallback();
							}
						};
					}
				});
			},
			// 开始录制
			startRecord() {
				var that = this;
				that.mediaRecorder.start();
				setTimeout(function() {
					// 结束
					that.stopRecord(function() {
						alert("录制成功!");
						that.openBtn.disabled = false;
						that.saveBtn.disabled = false;
						that.saver();
					});
				}, 10000);
			},
			// 保存录制文件
			saver() {
				var file = new File([this.recorderFile], (new Date() * 1000) + '.mp4', {
					type: 'video/mp4'
				});
				this.saveBtn.disabled = true;
				console.log(file);
			},
			//  绘制图片（拍照功能）
			setImage() {
				var thisCancas = document.getElementById('canvasCamera');
				
				var thisContext = thisCancas.getContext('2d');
				
				var thisVideo = document.getElementsByTagName("video")[0];
				
				// 点击，canvas画图
				thisContext.drawImage(thisVideo, 0, 0, 318, 238)
				// 获取图片base64链接
				var image = thisCancas.toDataURL('image/png')
				this.imgSrc = image;
				// 转base64图片为文件类型	已当前时间戳为文件名
				let nowTime = new Date() * 1000;
				console.log(this.dataURLtoFile(image, nowTime))
			},
			
			// 停止录制
			stopRecord(callback) {
				this.stopRecordCallback = callback;
				// 终止录制器
				this.mediaRecorder.stop();
				// 关闭媒体流
				this.closeStream(this.mediaStream);
			},
			
			/**
			 * 获取用户媒体设备(处理兼容的问题)
			 * @param videoEnable {boolean} - 是否启用摄像头
			 * @param audioEnable {boolean} - 是否启用麦克风
			 * @param callback {Function} - 处理回调
			 */
			getUserMedia(videoEnable, audioEnable, callback) {
				navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
					navigator.msGetUserMedia || window.getUserMedia;
				var constraints = {
					video: videoEnable,
					audio: audioEnable
				};
				if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
					navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
						callback(false, stream);
					})['catch'](function(err) {
						callback(err);
					});
				} else if (navigator.getUserMedia) {
					navigator.getUserMedia(constraints, function(stream) {
						callback(false, stream);
					}, function(err) {
						callback(err);
					});
				} else {
					callback(new Error('Not support userMedia'));
				}
			},
			/**
			 * 关闭媒体流
			 * @param stream {MediaStream} - 需要关闭的流
			 */
			closeStream(stream) {
				if (typeof stream.stop === 'function') {
					stream.stop();
				} else {
					let trackList = [stream.getAudioTracks(), stream.getVideoTracks()];
						
					for (let i = 0; i < trackList.length; i++) {
						let tracks = trackList[i];
						if (tracks && tracks.length > 0) {
							for (let j = 0; j < tracks.length; j++) {
								let track = tracks[j];
								if (typeof track.stop === 'function') {
									track.stop();
								}
							}
						}
					}
				}
			},
			
			// base64转文件
			dataURLtoFile(dataurl, filename) {
				var arr = dataurl.split(',')
				var mime = arr[0].match(/:(.*?);/)[1]
				var bstr = atob(arr[1])
				var n = bstr.length
				var u8arr = new Uint8Array(n)
				while (n--) {
					u8arr[n] = bstr.charCodeAt(n)
				}
				return new File([u8arr], filename, {
					type: mime
				})
			},
			
		}
	}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="less" scoped>
	.Record {
		
		article {
			width: 660px;
			height: 400px;
			margin: 0 auto;
			display: -webkit-box;
			display: -ms-flexbox;
			display: flex;
			-ms-flex-wrap: wrap;
			flex-wrap: wrap;
			-webkit-box-pack: center;
			-ms-flex-pack: center;
			justify-content: center;
			border: 1px solid white;
			background-color: white;
			
			.experiment {
				width: 320px;
				height: 240px;
				border: 1px solid green;
				margin: 50px auto;
				
				#videos-container {
					width: 320px;
					height: 240px;
				}
				
			}
			
			.experimentbtn {
				width: 400px;
				text-align: center;
				border: none;
				margin-top: 20px;
			}
		}
		
	}
</style>
