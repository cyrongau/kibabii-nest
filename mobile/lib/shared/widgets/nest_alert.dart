import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';

enum NestAlertType { info, success, warning, danger }

class NestAlert extends StatelessWidget {
  final String title;
  final String message;
  final String? confirmText;
  final String? cancelText;
  final NestAlertType type;
  final VoidCallback? onConfirm;
  final VoidCallback? onCancel;

  const NestAlert({
    super.key,
    required this.title,
    required this.message,
    this.confirmText,
    this.cancelText,
    this.type = NestAlertType.info,
    this.onConfirm,
    this.onCancel,
  });

  static Future<void> show(
    BuildContext context, {
    required String title,
    required String message,
    String? confirmText,
    String? cancelText,
    NestAlertType type = NestAlertType.info,
    VoidCallback? onConfirm,
    VoidCallback? onCancel,
  }) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => NestAlert(
        title: title,
        message: message,
        confirmText: confirmText,
        cancelText: cancelText,
        type: type,
        onConfirm: onConfirm,
        onCancel: onCancel,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final color = _getColor();
    final icon = _getIcon();

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : Colors.white,
          borderRadius: BorderRadius.circular(40),
          border: isDark ? Border.all(color: Colors.white.withOpacity(0.05)) : null,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isDark ? 0.4 : 0.1),
              blurRadius: 30,
              offset: const Offset(0, 15),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Icon(icon, color: color, size: 32),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : const Color(0xFF1E293B),
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: GoogleFonts.outfit(
                fontSize: 15,
                color: isDark ? Colors.white.withOpacity(0.6) : const Color(0xFF64748B),
                height: 1.5,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 32),
            Row(
              children: [
                if (cancelText != null)
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(right: 12),
                      child: _buildButton(
                        context,
                        cancelText!,
                        isDark ? Colors.white.withOpacity(0.05) : const Color(0xFFF1F5F9),
                        isDark ? Colors.white.withOpacity(0.4) : const Color(0xFF64748B),
                        onCancel,
                      ),
                    ),
                  ),
                Expanded(
                  child: _buildButton(
                    context,
                    confirmText ?? 'Understand',
                    color,
                    Colors.white,
                    onConfirm,
                    isPrimary: true,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildButton(
    BuildContext context,
    String text,
    Color bgColor,
    Color textColor,
    VoidCallback? action, {
    bool isPrimary = false,
  }) {
    return GestureDetector(
      onTap: () {
        Navigator.pop(context);
        action?.call();
      },
      child: Container(
        height: 56,
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(20),
          boxShadow: isPrimary
              ? [
                  BoxShadow(
                    color: bgColor.withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  )
                ]
              : null,
        ),
        child: Center(
          child: Text(
            text,
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.bold,
              color: textColor,
              fontSize: 16,
            ),
          ),
        ),
      ),
    );
  }

  Color _getColor() {
    switch (type) {
      case NestAlertType.success:
        return const Color(0xFF10B981);
      case NestAlertType.warning:
        return const Color(0xFFF59E0B);
      case NestAlertType.danger:
        return const Color(0xFFEF4444);
      case NestAlertType.info:
      default:
        return const Color(0xFF3B82F6);
    }
  }

  IconData _getIcon() {
    switch (type) {
      case NestAlertType.success:
        return LucideIcons.checkCircle2;
      case NestAlertType.warning:
        return LucideIcons.alertTriangle;
      case NestAlertType.danger:
        return LucideIcons.xCircle;
      case NestAlertType.info:
      default:
        return LucideIcons.info;
    }
  }
}
