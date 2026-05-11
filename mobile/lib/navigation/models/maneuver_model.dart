class ManeuverModel {
  final String type;
  final String modifier;
  final String instruction;
  final double distance;
  final double duration;
  final List<double> location;

  ManeuverModel({
    required this.type,
    required this.modifier,
    required this.instruction,
    required this.distance,
    required this.duration,
    required this.location,
  });

  String get formattedDistance {
    if (distance < 1000) {
      return '${distance.round()} m';
    } else {
      return '${(distance / 1000).toStringAsFixed(1)} km';
    }
  }

  String get formattedDuration {
    final minutes = (duration / 60).floor();
    final seconds = (duration % 60).round();
    
    if (minutes < 1) {
      return '$seconds sec';
    } else if (minutes == 1) {
      return '1 min';
    } else {
      return '$minutes mins';
    }
  }

  String get fullInstruction {
    if (distance > 0) {
      return '$instruction (${formattedDistance})';
    }
    return instruction;
  }

  String get iconType {
    switch (type) {
      case 'depart':
        return 'depart';
      case 'arrive':
        return 'arrive';
      case 'turn':
        if (modifier == 'right') return 'turn-right';
        if (modifier == 'left') return 'turn-left';
        if (modifier == 'slight right') return 'turn-slight-right';
        if (modifier == 'slight left') return 'turn-slight-left';
        return 'turn';
      case 'merge':
        return 'merge';
      case 'fork':
        return 'fork';
      case 'continue':
        return 'continue';
      case 'new name':
        return 'new-name';
      default:
        return 'continue';
    }
  }
}