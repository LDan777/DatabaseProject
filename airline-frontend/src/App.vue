<script setup>
// 这个文件现在极其简单，只需要这两行
</script>

<template>
  <!-- <router-view> 就是一个占位符。
       当网址是 / 时，这里显示 CustomerView
       当网址是 /admin 时，这里显示 AdminView -->
  <router-view></router-view>
</template>

<style>
/* 这里放一些所有页面都通用的全局样式即可，或者留空 */
body {
  margin: 0;
  padding: 0;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}
</style>