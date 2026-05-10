import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

export function hapticError(): void {
  Haptics.notification({ type: NotificationType.Error }).catch(() => {})
}

export function hapticSuccess(): void {
  Haptics.notification({ type: NotificationType.Success }).catch(() => {})
}

export function hapticLight(): void {
  Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
}
