import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../ui/navigation_screen.dart';

class NavigateToPropertyButton extends StatelessWidget {
  final double latitude;
  final double longitude;
  final String? destinationName;
  final String label;
  final bool fullWidth;
  final bool isPrimary;

  const NavigateToPropertyButton({
    super.key,
    required this.latitude,
    required this.longitude,
    this.destinationName,
    this.label = 'START NAVIGATION',
    this.fullWidth = false,
    this.isPrimary = true,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    final button = isPrimary
        ? ElevatedButton.icon(
            onPressed: () => _startNavigation(context),
            icon: const Icon(Icons.directions, color: Colors.white),
            label: Text(label),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
              minimumSize: const Size(200, 60),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              elevation: 8,
              shadowColor: Colors.blue.withValues(alpha: 0.4),
            ),
          )
        : OutlinedButton.icon(
            onPressed: () => _startNavigation(context),
            icon: const Icon(LucideIcons.navigation),
            label: Text(label),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size(200, 50),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
          );

    return fullWidth ? SizedBox(width: double.infinity, child: button) : button;
  }

  void _startNavigation(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => NavigationScreen(
          destinationLat: latitude,
          destinationLng: longitude,
          destinationName: destinationName,
        ),
      ),
    );
  }
}

class NavigateToLocationTile extends StatelessWidget {
  final double latitude;
  final double longitude;
  final String title;
  final String? subtitle;
  final IconData icon;
  final VoidCallback? onTap;

  const NavigateToLocationTile({
    super.key,
    required this.latitude,
    required this.longitude,
    required this.title,
    this.subtitle,
    this.icon = LucideIcons.mapPin,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: theme.colorScheme.primary.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, color: theme.colorScheme.primary),
      ),
      title: Text(title, style: theme.textTheme.titleSmall),
      subtitle: subtitle != null ? Text(subtitle!, style: theme.textTheme.bodySmall) : null,
      trailing: IconButton(
        icon: const Icon(LucideIcons.navigation),
        onPressed: () => _startNavigation(context),
        tooltip: 'Navigate',
      ),
      onTap: onTap ?? () => _startNavigation(context),
    );
  }

  void _startNavigation(BuildContext context) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => NavigationScreen(
          destinationLat: latitude,
          destinationLng: longitude,
          destinationName: title,
        ),
      ),
    );
  }
}