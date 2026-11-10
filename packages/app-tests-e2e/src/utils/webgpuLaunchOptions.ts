/**
 * SwiftShader gives headless Chromium a WebGPU adapter, on macOS and on
 * Linux CI.
 */
export const webgpuLaunchOptions = {
  args: [
    "--enable-unsafe-webgpu",
    "--enable-features=Vulkan",
    "--use-vulkan=swiftshader",
    "--use-webgpu-adapter=swiftshader",
    "--use-angle=swiftshader",
  ],
};
