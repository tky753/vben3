import { createBreakpointListen } from '@/hooks/event/use-breakpoint'
import { namespace } from '@/setting'
import { defineComponent, toRefs, ref, unref } from 'vue'
import { createAppProviderContext } from '@/hooks/web/useAppContext'
import { useAppStoreWithOut } from '@/store/config'
import { MenuModeEnum, MenuTypeEnum } from '@vben/constants'
import { useMsg, useNotice } from '@vben/vbencomponents'
import { setMsg, setNoice } from '@vben/request'

const props = {
  /**
   * class style prefix
   */
  prefixCls: { type: String, default: namespace },
}

export default defineComponent({
  name: 'AppProvider',
  inheritAttrs: false,
  props,
  setup(props, { slots }) {
    const isMobile = ref(false)
    const isSetState = ref(false)

    const appStore = useAppStoreWithOut()
    //注册msg以及notice，方便全局使用
    const msg = useMsg()
    const notice = useNotice()
    setMsg(msg)
    setNoice(notice)
    // Monitor screen breakpoint information changes
    createBreakpointListen(({ screenMap, sizeEnum, width }) => {
      const lgWidth = screenMap.get(sizeEnum.LG)
      if (lgWidth) {
        isMobile.value = width.value - 1 < lgWidth
      }
      handleRestoreState()
    })

    const { prefixCls } = toRefs(props)

    // Inject variables into the global
    createAppProviderContext({ prefixCls, isMobile })

    /**
     * Used to maintain the state before the window changes
     */
    function handleRestoreState() {
      if (unref(isMobile)) {
        if (!unref(isSetState)) {
          isSetState.value = true
          const {
            menuSetting: {
              type: menuType,
              mode: menuMode,
              collapsed: menuCollapsed,
              split: menuSplit,
            },
          } = appStore.getProjectConfig
          appStore.setProjectConfig({
            menuSetting: {
              type: MenuTypeEnum,
              mode: MenuModeEnum,
              split: false,
            },
          })
          appStore.setBeforeMiniInfo({
            menuMode,
            menuCollapsed,
            menuType,
            menuSplit,
          })
        }
      } else {
        if (unref(isSetState)) {
          isSetState.value = false
          const { menuMode, menuCollapsed, menuType, menuSplit } =
            appStore.getBeforeMiniInfo
          appStore.setProjectConfig({
            menuSetting: {
              type: menuType,
              mode: menuMode,
              collapsed: menuCollapsed,
              split: menuSplit,
            },
          })
        }
      }
    }
    return () => slots.default?.()
  },
})
