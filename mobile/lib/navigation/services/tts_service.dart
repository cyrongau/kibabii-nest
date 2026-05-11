import 'package:flutter_tts/flutter_tts.dart';

enum TtsState { playing, stopped, paused }

class TtsService {
  final FlutterTts _flutterTts = FlutterTts();
  TtsState _state = TtsState.stopped;
  
  TtsState get state => _state;

  Future<void> initialize() async {
    await _flutterTts.setLanguage('en-US');
    await _flutterTts.setSpeechRate(0.5);
    await _flutterTts.setVolume(1.0);
    await _flutterTts.setPitch(1.0);

    _flutterTts.setStartHandler(() {
      _state = TtsState.playing;
    });

    _flutterTts.setCompletionHandler(() {
      _state = TtsState.stopped;
    });

    _flutterTts.setErrorHandler((msg) {
      _state = TtsState.stopped;
    });
  }

  Future<void> speak(String text) async {
    if (text.isEmpty) return;
    
    if (_state == TtsState.playing) {
      await stop();
    }
    
    await _flutterTts.speak(text);
    _state = TtsState.playing;
  }

  Future<void> stop() async {
    await _flutterTts.stop();
    _state = TtsState.stopped;
  }

  Future<void> pause() async {
    await _flutterTts.pause();
    _state = TtsState.paused;
  }

  String formatDistance(double meters) {
    if (meters < 1000) {
      return '${meters.round()} meters';
    } else {
      return '${(meters / 1000).toStringAsFixed(1)} kilometers';
    }
  }

  String formatDuration(double seconds) {
    final minutes = (seconds / 60).floor();
    final remainingSeconds = (seconds % 60).round();
    
    if (minutes < 1) {
      return '$remainingSeconds seconds';
    } else if (minutes == 1) {
      return remainingSeconds > 0 
          ? '1 minute $remainingSeconds seconds'
          : '1 minute';
    } else {
      return remainingSeconds > 0 
          ? '$minutes minutes $remainingSeconds seconds'
          : '$minutes minutes';
    }
  }

  String getManeuverInstruction(String type, String modifier, double distance, String streetName) {
    String instruction = '';
    
    switch (type) {
      case 'depart':
        instruction = 'Start walking on $streetName';
        break;
      case 'arrive':
        instruction = 'You have arrived at your destination';
        break;
      case 'turn':
        if (modifier == 'right') {
          instruction = 'Turn right in ${formatDistance(distance)}';
        } else if (modifier == 'left') {
          instruction = 'Turn left in ${formatDistance(distance)}';
        } else if (modifier == 'slight right') {
          instruction = 'Bear right in ${formatDistance(distance)}';
        } else if (modifier == 'slight left') {
          instruction = 'Bear left in ${formatDistance(distance)}';
        }
        break;
      case 'merge':
        instruction = 'Merge onto $streetName';
        break;
      case 'fork':
        if (modifier == 'right') {
          instruction = 'At the fork, keep right onto $streetName';
        } else if (modifier == 'left') {
          instruction = 'At the fork, keep left onto $streetName';
        }
        break;
      case 'continue':
        instruction = 'Continue on $streetName for ${formatDistance(distance)}';
        break;
      case 'new name':
        instruction = 'Continue onto $streetName';
        break;
      default:
        instruction = 'Continue for ${formatDistance(distance)}';
    }
    
    return instruction;
  }

  void dispose() {
    _flutterTts.stop();
  }
}