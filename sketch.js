

let mySound;
let playStopButton;
let sliderVolume;
let jumpButton;
let dryWetLPSlider;
let ouputVolLPSlider;
let dryWetDCSlider;
let outputVolDCSlider;
let dryWetDSlider;
let outputVolDSlider;
let dryWetRSlider;
let outputVolRSlider;

let playButton;
let stopButton;
let pauseButton;
let skipToStart;
let skipToEnd;
let loop;
let record;
let reverse;
let mic, recorder, soundFileRec;
let state = 0;
let lowpassFilter;
let dynCompressor;
let inputSel;
let inputVal;

let filterSel;
let val;

let distortion;

let reverbFilter;
let reverseFlag = false; 

var fft;
var masterVolKnob;
var cutoffFreqKnob;
var distAmountKnob;
var oversampleKnob;
var durKnob;
var decayKnob;
var pointerCursor = false; 

var volume;
let spec;
let spec_lin;
let fft2;


let soundFile = '/sound/sample2_02.wav';
let sound;

// Preloading assets before the sketch starts
function preload() {
    soundFormats('mp3', 'wav'); // Define the sound formats to use
    sound = loadSound(soundFile); // Load a sound file into the 'sound' object
}

function setup() {
    createCanvas(windowWidth, windowHeight); // Create a drawing canvas all along for the hole screen is black 
    background(180); // Set the canvas background color to a medium gray (180 is the gray value)
    
    // Create a dropdown menu for selecting audio filters, position it, and add options to it
    filterSel = createSelect(); // Create a new dropdown element
    filterSel.size(80); // Set the size of the dropdown element
    filterSel.position(95,200); // Position the dropdown on the canvas
    filterSel.option('low-pass'); // Add an option for a low-pass filter
    filterSel.option('high-pass'); // Add an option for a high-pass filter
    filterSel.option('band-pass'); // Add an option for a band-pass filter
    val = filterSel.value(); // Get the current value of the dropdown to use as the default
    filterSel.changed(filterChange); // Assign a callback function when the dropdown selection changes
    
    // Create another dropdown for selecting the audio input source
    inputSel = createSelect(); // Create a new dropdown element for input selection
    inputSel.size(155,50); // Set the size of the input selection dropdown
    inputSel.position(655, 10); // Position the input selection dropdown on the canvas
    inputSel.option('Pre-loaded Sound'); // Add an option for using a pre-loaded sound
    inputSel.option('Mic input'); // Add an option for using microphone input
    inputVal = inputSel.value(); // Get the current value of the dropdown
    console.log(inputVal); // Log the current input value to the console (useful for debugging)
    inputSel.changed(recInputChange); // Assign a callback function when the input selection changes
    
    // Initialize audio effect objects
    lowpassFilter = new p5.Filter(); // Create a new filter object (used for low, high, or band-pass filters)
    lowpassFilter.setType("lowpass"); // Initially set the filter to be a low-pass filter
    dynCompressor = new p5.Compressor(); // Create a new dynamic range compressor object
    distortion = new p5.Distortion(); // Create a new distortion effect object
    reverbFilter = new p5.Reverb(); // Create a new reverb effect object
    
    // Configure audio routing and analysis
    sound.disconnect(); // Disconnect the sound from the default output to avoid double processing
    fft2 = new p5.FFT(); // Create a new Fast Fourier Transform object for analyzing frequencies
    fft2.setInput(sound); // Set the FFT analysis input to the sound object
    sound.connect(lowpassFilter); // Connect the sound object to the lowpass filter
    
    // Chain the audio effects together and set them as the input for the recorder and the FFT object
    lowpassFilter.chain(distortion,dynCompressor,reverbFilter); // Chain the effects in series
    fft = new p5.FFT(); // Create another FFT object
    fft.setInput(lowpassFilter.chain(distortion,dynCompressor,reverbFilter)); // Set the FFT input to the chained effects

    // Initialize microphone and recorder objects
    mic = new p5.AudioIn(); // Create a new microphone input object
    recorder = new p5.SoundRecorder(); // Create a new sound recorder object
    recorder.setInput(lowpassFilter.chain(distortion,dynCompressor,reverbFilter)); // Set the recorder input to the chained effects
    soundFileRec = new p5.SoundFile(); // Create a new sound file object for recording
    
    gui_config(); // Call a custom function to configure additional GUI elements (knobs, buttons, etc.)
}


function draw() {
    background(0); // Set the canvas background color to a light gray
    
    gui_colors(); // Call a function to set the colors of the GUI elements
    
    labels(); // Call a function to draw the text labels on the GUI

    // This block draws a static rectangle which could be used as a background for another visual element
    push(); // Start a new drawing state
    noFill(); // Do not fill the upcoming shapes
    stroke(0); // Set the outline color of shapes to black
    rect(545,175,220,30); // Draw a rectangle outline at position (545,280) with width 30 and height 100
    pop(); // Restore the previous drawing state
    
    pointerCursor = false; // Initially set the cursor to the default style
    update_knobs(); // Call a function to update the positions of the knobs based on user interaction
    
    // This block draws the dynamic volume meter rectangle
    noFill(); // Ensure that shapes are not filled
    fill(0,200,0); // Set the fill color to green for the volume meter
    rect(545,175, masterVolKnob.knobValue, 30 ); // Draw the volume meter rectangle dynamically based on the master volume knob value

    x = fft.waveform(); // Get the waveform data from the FFT analysis
    noFill(); // Do not fill the upcoming shapes
    stroke(255, 255, 0); // Set the stroke color to yellow
    strokeWeight(1); // Set the thickness of the stroke
    
    // Update the audio processing filters based on the GUI controls
    lowpassFilter.set(cutoffFreqKnob.knobValue); // Set the cutoff frequency of the lowpass filter
    lowpassFilter.res(resKnob.knobValue); // Set the resonance of the lowpass filter
    lowpassFilter.drywet(dryWetLPSlider.value()); // Set the dry/wet mix of the lowpass filter
    lowpassFilter.amp(ouputVolLPSlider.value()); // Set the output volume of the lowpass filter

    // Determine the oversampling rate for the distortion effect
    let os;
    if(oversampleKnob.knobValue == 0){
        os = "none"; // No oversampling
    }
    else if( oversampleKnob.knobValue == 2){
        os = "2x"; // 2x oversampling
    }
    else if(oversampleKnob.knobValue == 4){
        os = "4x"; // 4x oversampling
    }
    distortion.set(distAmountKnob.knobValue, os); // Apply the distortion amount and oversampling
    distortion.drywet(dryWetDSlider.value()); // Set the dry/wet mix of the distortion effect
    distortion.amp(outputVolDSlider.value()); // Set the output volume of the distortion effect
    
    // Update the dynamic compressor parameters based on the GUI controls
    dynCompressor.attack(attackKnob.knobValue); // Set the attack time
    dynCompressor.knee(kneeKnob.knobValue); // Set the knee value
    dynCompressor.release(releaseKnob.knobValue); // Set the release time
    dynCompressor.ratio(ratioKnob.knobValue); // Set the compression ratio
    dynCompressor.threshold(thresKnob.knobValue); // Set the threshold for the compression
    dynCompressor.drywet(dryWetDCSlider.value()); // Set the dry/wet mix of the compressor
    dynCompressor.amp(outputVolDCSlider.value()); // Set the output volume of the compressor
    
    reverbFilter.drywet(dryWetRSlider.value()); // Set the dry/wet mix of the reverb effect
    reverbFilter.amp(outputVolRSlider.value()); // Set the output volume of the reverb effect
    dryWetRSlider.changed(cb); // Add a callback for when the reverb dry/wet slider changes
    
    volume = masterVolKnob.knobValue; // Get the current value from the master volume knob
    volume = map(volume,0,100,0,220); // Map the knob value to a range from 0 to 1
    sound.setVolume(volume); // Set the volume of the sound to this mapped value
    
    if (pointerCursor) { cursor('pointer'); } else { cursor('default'); } // Change the cursor based on pointerCursor state
    // Visualize the spectrum of frequencies from the FFT analysis
    let h1 = 460; // Update to new y position for the first spectrum visualization
    let spectrumHeight1 = 230; // Height of the spectrum display area
    let w1 = 310; // Total width for the spectrum visualization
    spec = fft2.analyze(); // Perform an FFT analysis and store the result
    noStroke(); // Do not outline shapes
    fill(170, 0, 10, 100); // Set the fill color for the spectrum (semi-transparent red)
    for (i = 0; i < spec.length; i++) { // Loop through each value in the FFT analysis
        let barWidth = w1 / spec.length; // Calculate the width of each bar
        let barHeight = map(spec[i], 0, 255, 0, spectrumHeight1); // Map the FFT value to a height within the spectrum display area
        let x = 510 + barWidth * i; // Calculate the x position for each bar
        rect(x, h1 + spectrumHeight1 - barHeight, barWidth, barHeight); // Draw a rectangle for each frequency bin
    }

    // Similar visualization for another spectrum of frequencies
    let h2 = 225; // Update to new y position for the second spectrum visualization
    let spectrumHeight2 = 230; // Height of the spectrum display area
    let w2 = 310; // Total width for the spectrum visualization
    X = fft.analyze(); // Perform another FFT analysis
    noStroke(); // Do not outline shapes
    fill(170, 0, 10, 100); // Set the fill color for the spectrum (semi-transparent red)
    for (i = 0; i < X.length; i++) { // Loop through each value in the FFT analysis
        let barWidth = w2 / X.length; // Calculate the width of each bar
        let barHeight = map(X[i], 0, 255, 0, spectrumHeight2); // Map the FFT value to a height within the spectrum display area
        let x = 510 + barWidth * i; // Calculate the x position for each bar
        rect(x, h2 + spectrumHeight2 - barHeight, barWidth, barHeight); // Draw a rectangle for each frequency bin
    }

}


// This function is triggered when the input selection changes (e.g., between microphone input and pre-loaded sound)
function recInputChange() {
    stopSound(); // Stops any currently playing sound

    inputVal = inputSel.value(); // Retrieve the current value from the input selection dropdown
    
    // Check if the input selection is set to 'Mic input'
    if(inputVal=='Mic input'){
        mic.start(); // Start the microphone input
        recorder.setInput(mic); // Set the recorder's input to the microphone
        fft.setInput(mic); // Set the FFT's input to the microphone for frequency analysis
        
    }
    // Check if the input selection is set to 'Pre-loaded Sound'
    else if(inputVal=='Pre-loaded Sound'){
        mic.stop(); // Stop the microphone input
        // Set the recorder's and FFT's input to the chain of audio nodes (lowpass filter, distortion, compressor, reverb)
        recorder.setInput(lowpassFilter.chain(distortion,dynCompressor,reverbFilter));
        fft.setInput(lowpassFilter.chain(distortion,dynCompressor,reverbFilter));
    }
    
    // After the input selection changes, the audio input for recording and analysis is updated accordingly.
    // If 'Mic input' is selected, the system will listen and process audio from the user's microphone.
    // If 'Pre-loaded Sound' is selected, it will process the sound that has been preloaded and potentially
    // altered by the chain of audio effects.
}


function cb() {
    reverbFilter.set(durKnob.knobValue, decayKnob.knobValue, reverseFlag);
}

function update_knobs() {
    masterVolKnob.update();
    cutoffFreqKnob.update();
    resKnob.update();
    attackKnob.update();
    kneeKnob.update();
    releaseKnob.update();
    ratioKnob.update();
    thresKnob.update();
    distAmountKnob.update();
    oversampleKnob.update();
    durKnob.update();
    decayKnob.update();
}

function gui_colors() {
    // Sets the color for the Filters section and draws the rectangle for its background
    fill(154, 205, 50); // Pastel green
    rect(60, 70, 150, 320); // Filters background

    // Sets the color for the Dynamic Compressor section and draws the rectangle for its background
    fill(50); // Pastel purple
    rect(250, 70, 242, 340); // Dynamic Compressor background

    // Sets the color for the Waveshaper Distortion section and draws the rectangle for its background
    fill(204, 85, 0); // Pastel orange
    rect(250, 420, 242, 270); // Waveshaper Distortion background

    // Sets the color for the Reverb section and draws the rectangle for its background
    fill(0, 0, 139); // Pastel blue
    rect(60, 400, 150, 290); // Reverb background

    // Sets the color for the Master Volume section and draws the rectangle for its background
    fill(102, 0, 153); // Pastel pink
    rect(510, 70, 300, 150); // Master Volume background

    // Draw the first spectrum display area with a darker gray background
    push(); // Save the current drawing style
    fill(125); // Dark gray
    stroke(0); // Black border
    rect(510, 460, 300, 230); // Spectrum In background
    pop(); // Restore previous drawing style

    // Draw the second spectrum display area with a darker gray background
    push(); // Save the current drawing style
    fill(125); // Dark gray
    stroke(0); // Black border
    rect(510, 225, 300, 230); // Spectrum Out background
    pop(); // Restore previous drawing style
}


function labels() {
    textSize(14); // Set text size to 14 for section titles
    
    fill(0)
    text('Filters', 116, 95); // Title for the Filters section
    // These are labels for the controls within the Filters section
    textSize(10); // Set text size to 10 for control labels
    text('Cut off Freq', 66, 120); // Label for the Cutoff Frequency knob
    text('Resonance', 150, 120); // Label for the Resonance knob
    text('Dry/Wet', 72, 380); // Label for the Dry/Wet slider
    text('Output vol', 155, 380); // Label for the Output Volume slider

    fill(255); // Set text color to black

    textSize(14); // Set text size to 14 for section titles

    // These are the titles for each section of the interface
    text('Dynamic Compressor', 300, 87); // Title for the Dynamic Compressor section
    text('Waveshaper Distortion', 300, 440); // Title for the Waveshaper Distortion section
    text('Master Volume', 615, 90); // Title for the Master Volume control
    text('Reverb', 110, 425); // Title for the Reverb section
    text('Spectrum In', 730, 240); // Title for the Spectrum In display
    text('Spectrum Out', 720, 475); // Title for the Spectrum Out display
    
    textSize(10); // Set text size to 10 for control labels
    

    
    // Labels for the controls within the Dynamic Compressor section
    text('Attack', 265, 157); // Label for the Attack knob
    text('Knee', 358, 157); // Label for the Knee knob
    text('Release', 442, 157); // Label for the Release knob
    text('Ratio', 314, 240); // Label for the Ratio knob
    text('Threshold', 394, 240); // Label for the Threshold knob
    text('Dry/Wet', 309, 400); // Label for the Dry/Wet slider
    text('Output vol', 396, 400); // Label for the Output Volume slider
    
    // Labels for the controls within the Waveshaper Distortion section
    text('Distortion Amount', 287, 514); // Label for the Distortion Amount knob
    text('Oversample', 394, 514); // Label for the Oversample knob
    text('Dry/Wet', 309, 680); // Label for the Dry/Wet slider
    text('Output vol', 396, 680); // Label for the Output Volume slider
    
    // Labels for the controls within the Reverb section
    text('Duration', 71, 447); // Label for the Duration knob
    text('Decay', 165, 447); // Label for the Decay knob
    text('Dry/Wet', 75, 680); // Label for the Dry/Wet slider
    text('Output vol', 158, 680); // Label for the Output Volume slider
}


function gui_config() {
    
    // This knob controls the master volume, displayed as a pink knob in the interface
    masterVolKnob = new MakeKnob("images/knob_multi.png", 70, 658, 134, 0, 220, 110, 0);

    // These knobs are part of the Filters section, controlling cutoff frequency and resonance
    cutoffFreqKnob = new MakeKnob("images/knob_green.png", 50, 95, 160, 10, 22050, 100, 0);
    resKnob = new MakeKnob("images/knob_green.png", 50, 175, 160, 0.001, 1000, 0, 0);
    
    // These knobs are part of the Dynamic Compressor section, 
    //controlling attack, knee, and release parameters
    attackKnob = new MakeKnob("images/knob_purple.png", 70, 280, 120, 0, 1, 0.003, 0);
    kneeKnob = new MakeKnob("images/knob_purple.png", 70, 370, 120, 0, 40, 30, 0);
    releaseKnob = new MakeKnob("images/knob_purple.png", 70, 460, 120, 0, 1, 0.25, 0);
    //controlling ratio and threshold parameters
    ratioKnob = new MakeKnob("images/knob_purple.png", 70, 326, 200, 1, 20, 12, 0);
    thresKnob = new MakeKnob("images/knob_purple.png", 70, 416, 200, -100, 0, -24, 0);
    
    // These knobs are part of the Waveshaper Distortion section, controlling the amount of distortion and oversampling
    distAmountKnob = new MakeKnob("images/knob_orange.png", 50, 326, 475, 0, 1, 0, 0);
    oversampleKnob = new MakeKnob("images/knob_orange.png", 50, 419, 475, 0, 4, 0, 3);
    
    // These knobs are part of the Reverb section, controlling the duration and decay of the reverb effect
    durKnob = new MakeKnob("images/knob_blue.png", 50, 90, 480, 0, 10, 0, 0);
    decayKnob = new MakeKnob("images/knob_blue.png", 50, 180, 480, 0, 100, 0, 0);
    
    
    masterVolKnob.moveRange=128;
    cutoffFreqKnob.moveRange = 128;
    resKnob.moveRange = 128;
    attackKnob.moveRange = 128;
    kneeKnob.moveRange = 128;
    releaseKnob.moveRange = 128;
    ratioKnob.moveRange = 128;
    thresKnob.moveRange = 128;
    distAmountKnob.moveRange = 128;
    oversampleKnob.moveRange = 4;
    durKnob.moveRange = 128;
    decayKnob.moveRange = 128;
    
    // The following are buttons for controlling playback, each described by their label
    playButton = createButton('PLAY'); // Button to start playback
    playButton.size(80,50);
    playButton.position(60,10);
    playButton.mousePressed(playSound);
    
    stopButton = createButton('STOP'); // Button to stop playback
    stopButton.size(80,50);
    stopButton.position(145,10);
    stopButton.mousePressed(stopSound);
    
    pauseButton = createButton('PAUSE'); // Button to pause playback
    pauseButton.size(80,50);
    pauseButton.position(230,10);
    pauseButton.mousePressed(pauseSound);

    skipToStart = createButton('SKIP - START'); // Button to Skip start
    skipToStart.size(80,50);
    skipToStart.position(315, 10);
    skipToStart.mousePressed(skipToStartSound);
    
    skipToEnd = createButton('SKIP - END'); // Button to pause playback end
    skipToEnd.size(80,50);
    skipToEnd.position(400, 10);
    skipToEnd.mousePressed(skipToEndSound);
    
    loop = createButton('LOOP'); // Button to LOOP
    loop.size(80,50);
    loop.position(485, 10);
    loop.mousePressed(loopSound);

    // Record button with custom style
    record = createButton('RECORD');
    record.size(80,50);
    record.position(570, 10);
    let c = color(255,0,0,0.7*255);
    record.style('background-color', c); // Semi-transparent red background
    record.mousePressed(recordSound);


    
    // Button to toggle reverse effect in the Reverb section
    reverse = createButton('REVERSE');
    reverse.size(80,20);
    reverse.position(95,510); // Positioned below the Reverb section
    reverse.mousePressed(reverbReverse);
    

    // Slider for controlling the dry/wet mix of the Filter
    dryWetLPSlider = createSlider(0, 1, 0.5, 0.1);
    dryWetLPSlider.position(5, 285); // Position it under the 'Dry/Wet' label in the Filters section
    dryWetLPSlider.style("transform", "rotate(270deg) scale(0.85)"); // Rotate to vertical orientation and scale down

    // Slider for controlling the output volume of the Filter
    ouputVolLPSlider = createSlider(0, 1, 0.5, 0.1);
    ouputVolLPSlider.position(100, 285); // Position it under the 'Output vol' label in the Filters section
    ouputVolLPSlider.style("transform", "rotate(270deg) scale(0.85)"); // Rotate to vertical orientation and scale down

    // Slider for controlling the dry/wet mix of the Dynamic Compressor
    dryWetDCSlider = createSlider(0, 1, 0, 0.1);
    dryWetDCSlider.position(245, 310); // Position it under the 'Dry/Wet' label in the Dynamic Compressor section
    dryWetDCSlider.style("transform", "rotate(270deg) scale(0.8)"); // Rotate to vertical orientation

    // Slider for controlling the output volume of the Dynamic Compressor
    outputVolDCSlider = createSlider(0, 1, 0.5, 0.1);
    outputVolDCSlider.position(335, 310); // Position it under the 'Output vol' label in the Dynamic Compressor section
    outputVolDCSlider.style("transform", "rotate(270deg) scale(0.8)"); // Rotate to vertical orientation

    // Slider for controlling the dry/wet mix of the Waveshaper Distortion
    dryWetDSlider = createSlider(0, 1, 0, 0);
    dryWetDSlider.position(245, 590); // Position it under the 'Dry/Wet' label in the Waveshaper Distortion section
    dryWetDSlider.style("transform", "rotate(270deg) scale(0.8)"); // Rotate to vertical orientation

    // Slider for controlling the output volume of the Waveshaper Distortion
    outputVolDSlider = createSlider(0, 1, 0.5, 0.1);
    outputVolDSlider.position(340, 590); // Position it under the 'Output vol' label in the Waveshaper Distortion section
    outputVolDSlider.style("transform", "rotate(270deg) scale(0.8)"); // Rotate to vertical orientation

    // Slider for controlling the dry/wet mix of the Reverb effect
    dryWetRSlider = createSlider(0, 1, 0, 0);
    dryWetRSlider.position(10, 590); // Position it under the 'Dry/Wet' label in the Reverb section
    dryWetRSlider.style("transform", "rotate(270deg) scale(0.8)"); // Rotate to vertical orientation

    // Slider for controlling the output volume of the Reverb effect
    outputVolRSlider = createSlider(0, 1, 0, 0);
    outputVolRSlider.position(100, 590); // Position it under the 'Output vol' label in the Reverb section
    outputVolRSlider.style("transform", "rotate(270deg) scale(0.8)"); // Rotate to vertical orientation

}

function reverbReverse() {
    reverseFlag = !reverseFlag;
    reverbFilter.set(durKnob.knobValue, decayKnob.knobValue, reverseFlag);
}

function filterChange() {
    val = filterSel.value();
    if(val=='low-pass'){
        lowpassFilter.setType("lowpass");
    }
    else if(val=='high-pass') {
        lowpassFilter.setType("highpass");
    }
    else if(val=='bandpass'){
        lowpassFilter.setType("bandpass");
    }
}

function recordSound() {
    if(state == 0){
        mic.start();
        recorder.record(soundFileRec);
        state++; 
    }
    else if (state == 1){
        recorder.stop();
        stopSound();
        save(soundFileRec, 'rec_sound.wav');
        console.log(state);
        state=0;
    }
}


function loopSound() {
    sound.loop();
}

function playSound() {
    
    if(sound.isPlaying()){
        
    } else {
        sound.play();
    }
}

function stopSound() {
    if(sound.isPlaying()){
        sound.stop();
    } 
}

function pauseSound() {
    if(sound.isPlaying()){
        sound.pause();
    }
}

function skipToStartSound() {
    if(sound.isPlaying()){
        sound.jump(0);
    } else {
        sound.play(0,1,1,1);
    }
}

function skipToEndSound() {
    if(sound.isPlaying()){
        sound.jump(sound.duration()-5);
    } else {
        sound.play(0,1,1,1);
    }
}

function mousePressed() {
    masterVolKnob.active();
    cutoffFreqKnob.active();
    resKnob.active();
    attackKnob.active();
    kneeKnob.active();
    releaseKnob.active();
    ratioKnob.active();
    thresKnob.active();
    distAmountKnob.active();
    oversampleKnob.active();
    durKnob.active();
    decayKnob.active();
}

function mouseReleased() {
    masterVolKnob.inactive();
    cutoffFreqKnob.inactive();
    resKnob.inactive();
    attackKnob.inactive();
    kneeKnob.inactive();
    releaseKnob.inactive();
    ratioKnob.inactive();
    thresKnob.inactive();
    distAmountKnob.inactive();
    oversampleKnob.inactive();
    durKnob.inactive();
    decayKnob.inactive();
}