const products = {
  solo: [
    { name: "Red Rose", image: "https://scontent.fmnl4-1.fna.fbcdn.net/v/t1.15752-9/836379164_1600958747680374_5089962906456670225_n.jpg?stp=dst-jpg_s480x480_tt6&_nc_cat=103&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=0024fc&_nc_eui2=AeHuP1rdejo7TuE8Te-R2tCmpGcLygyByrukZwvKDIHKu3a4oRBS3ccp0WGNmFMQG9OSUdI6AKjVIoj209q0rGC9&_nc_ohc=V-hmSApZFoQQ7kNvwH5Leqj&_nc_oc=AdoMwbOGwykTNzrruIcSlaB9Yhwk20LN4P-wL9jWB4NBR97P27P9TtS1iXP0FT-6vNirmOQWWA6A79M8oHCveq5j&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.fmnl4-1.fna&_nc_ss=7a22e&oh=03_Q7cD6gG-y0V-Fr3tu4M5mx_7Z38Jr40H5lyj0EpFekIiofahJQ&oe=6AEE0E2C", price: 49 },
    { name: "Tulip", image: "https://scontent.fmnl4-5.fna.fbcdn.net/v/t1.15752-9/829517405_2522121778627563_4092395780261813640_n.jpg?stp=dst-jpg_s480x480_tt6&_nc_cat=110&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=0024fc&_nc_eui2=AeFf4ryTpWwEtvOp8fkpfyUq7LJKt2Ms9pfsskq3Yyz2lwLTbtNzEUfkOvizyJvod-Vyuq7L4SfNrk_XQrzlp2b4&_nc_ohc=-n3Ce45yEfgQ7kNvwFZBlK5&_nc_oc=AdrvyFZmiVYMxENaH-EPcNTGNlUhRv5XSKSh1uXWW0aw3ZdBOsGN-9dccr6_n0DgDH5wqOC0FKABxDZmqL1v0TkZ&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.fmnl4-5.fna&_nc_ss=7a22e&oh=03_Q7cD6gHFSlcmaP710y6mF71lHK7XgqRCXkBO44Pp1-6PTRSGUw&oe=6AEE11E0", price: 49 },
    { name: "Lavander", image: "https://scontent.fmnl4-1.fna.fbcdn.net/v/t1.15752-9/833135298_1104875052344668_5633535042872270775_n.jpg?stp=dst-jpg_s480x480_tt6&_nc_cat=104&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=0024fc&_nc_eui2=AeGvtt_bHXXhwbiy1LQbsURCuY4abWsqOA25jhptayo4DcKZRhlTCfnxbgFPLHScgYKbEy1-vYVpb7KkQfN-ukWl&_nc_ohc=0ihSufMpkQ0Q7kNvwEcRz6g&_nc_oc=AdoBLByjUTjJaYEdF0KyBLa5JQNGu9wNnsN15CgG31mQDZUSCWoXtj72v0U4mAmBSgd-OYbCRmDOJ6ZedmRmjkJM&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.fmnl4-1.fna&_nc_ss=7a22e&oh=03_Q7cD6gHW7Z_xq4nPJk-WqYeob3JguSJHTn0RfXpH7TK6xk0P_g&oe=6AEE07AE", price: 49 }
  ],
  triple: [
    { name: "Lily", image: "https://scontent.fmnl4-6.fna.fbcdn.net/v/t1.15752-9/825261264_2156102801786609_7012531619310319984_n.jpg?stp=dst-jpg_s640x640_tt6&_nc_cat=108&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=0024fc&_nc_eui2=AeE3631WKJJPWyYAwFLMR6L4bPvMzP88XH9s-8zM_zxcfwTImnCWSaL26sE1kw-1dhDlM86g_gx-WqvUYUXCie21&_nc_ohc=heaNhcMPJv4Q7kNvwFco8W9&_nc_oc=AdqOfgHYjGMcSxLu88YVJ0SoMW-Q50xJvlDrPesU9fV6KBR8ZVRuQi3pK0QamPUHVRUzedsKcVsAW9uFiGwvrBpM&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.fmnl4-6.fna&_nc_ss=7a22e&oh=03_Q7cD6gGx8NN5aRZt-RYCZty003b9g_kXpH9qlBVkLD2eeQzOiA&oe=6AEE052F", price: 149 },
    { name: "Purple", image: "https://scontent.fmnl4-5.fna.fbcdn.net/v/t1.15752-9/829733958_1101456095961993_6998095993439013317_n.jpg?stp=dst-jpg_p480x480_tt6&_nc_cat=102&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=0024fc&_nc_eui2=AeHLhrdW625gmmyRO75cxGGJGBD-Luw_9q8YEP4u7D_2r67oE9I8TGg5TTKp-Dmu5yIqSDDayASc3HstcnuSlJew&_nc_ohc=_RO2ZsCiwlwQ7kNvwEfgie1&_nc_oc=AdpBHMKktsVzkhSQaiAV8PdY5C6fQg0uH5tYSStr2d9o7XZu8sDUUOSEsNxE_-L_dQq-if2OJVXMeHlytOCM3McA&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.fmnl4-5.fna&_nc_ss=7a22e&oh=03_Q7cD6gE8J_WqNCTF-a5MZJmAn8vAsMjck-w3Pe3uaysQw0UbGw&oe=6AEE1A59", price: 149 },
    { name: "Blue Rose", image: "https://scontent.fmnl4-1.fna.fbcdn.net/v/t1.15752-9/829671032_1722762305463876_5997666405140940905_n.jpg?stp=dst-jpg_p480x480_tt6&_nc_cat=101&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=0024fc&_nc_eui2=AeGuO4CIX_gN80_bphAzI3AUACL5DJh8osMAIvkMmHyiw-rZs1knO7U5J9gUmk3s9OWhh8nVWsNprUp9rhcTiO_t&_nc_ohc=5AHC1QVH2n0Q7kNvwFz9zyZ&_nc_oc=AdqECuCz44bgDU6t7uHxZnC6P7dZoX8QhxFZcBZ3b0cAgEy22lsBAG9UNFaU0oOkGcgQawrpwGECE_REUsDeAWLE&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.fmnl4-1.fna&_nc_ss=7a22e&oh=03_Q7cD6gEvqbQ9ajszofT1YgdekNao3qQJ4fQfseZ_NoE0IkYhgA&oe=6AEE19B0", price: 149 }
  ],
  bouquet: [
    { name: "FUSHCIA", image: "https://scontent.fmnl4-7.fna.fbcdn.net/v/t1.15752-9/829016102_2510443939436022_6120183339912102719_n.jpg?stp=dst-jpg_p480x480_tt6&_nc_cat=104&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=0024fc&_nc_eui2=AeEVB8yuSefGa5Mv2cHEbtK6JzzXtl3a6X0nPNe2XdrpfQ5__NVx5zWi7svKtLlrwPhBKGJaaEYsv4ergg7DXdsz&_nc_ohc=-I7RywH3C-oQ7kNvwEmgrAN&_nc_oc=AdriPY5u7EYpMiXTvdzSJvbrdbUWPno6HETJcFA3MPfreTpIg611vdiEZt_xYv35LhgEgrSQktUlybe4SgEEI4yO&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.fmnl4-7.fna&_nc_ss=7a22e&oh=03_Q7cD6gElkheRKC1ohVGOGEIy_lbFbomu62RQVm4CTsuuOAA41g&oe=6AEE34C0", price: 350 },
    { name: "Sky Blue", image: "https://scontent.fmnl4-6.fna.fbcdn.net/v/t1.15752-9/829246240_958760070643800_8523206445535767473_n.jpg?stp=dst-jpg_p480x480_tt6&_nc_cat=108&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=0024fc&_nc_eui2=AeHj_jm0UQD_c0WUYVQQW1-4jqiBR0Bs5uiOqIFHQGzm6J3fiQewZfT7bfBWAE2pJ-YrnSFyFJdVgTXoCkhhM3xC&_nc_ohc=Ic5J0U8OnIIQ7kNvwG5NU37&_nc_oc=AdrZMU_jrWJjfhpPKMQUcEm3yRkY-Az_y1dyk_PvhrP5d5iu9eDdfL4ZONMbPwbAIuQS5F8sqEI-s68Zv_QwV46X&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.fmnl4-6.fna&_nc_ss=7a22e&oh=03_Q7cD6gFCBuIg911kAFel36t-ukzgklOxyNvJ0POPqd6ToOg4GQ&oe=6AEE2D78", price: 350 },
    { name: "Rose & Daisy", image: "https://scontent.fmnl4-2.fna.fbcdn.net/v/t1.15752-9/828675795_1102200535648743_3991274945762656269_n.jpg?stp=dst-jpg_s480x480_tt6&_nc_cat=110&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=0024fc&_nc_eui2=AeHRGHFItUc3zdOtBWaN3b8SRgE72ymvmppGATvbKa-amsu8iGAVpx_ym7pCN5zxhmNXr8MFc2IjXOF0ggwpvWgl&_nc_ohc=4pAujN4owooQ7kNvwFOu83X&_nc_oc=Adqta4iABcGTXQLO1C2mfduanjOYAj7z58EzqfTJJ_8TppcXZwAhN_ABZ32f2gq4GMjrofr8c1piUAXJ2y_XUiBt&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.fmnl4-2.fna&_nc_ss=7a22e&oh=03_Q7cD6gEkVeLw1dJCAFqsVNfUpwFMJ5OLB_qg4KAPJKiT8V5S8g&oe=6AEE2B53", price: 350 }
  ]
};

const grid = document.getElementById("productGrid");
const tabs = document.querySelectorAll(".tab");

function renderProducts(category) {
  grid.innerHTML = products[category].map((product, index) => `
    <article class="card">
      <div class="card-image">
        <span class="number">${String(index + 1).padStart(2, "0")}</span>
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        <span class="category-badge">${category === "solo" ? "SOLO" : category === "triple" ? "TRIPLE" : "BOUQUET"}</span>
      </div>
      <div class="card-body">
        <h3>${product.name}</h3>
        <div class="product-bottom">
          <span class="price">₱${product.price}</span>
          <span class="price-label">per piece</span>
        </div>
      </div>
    </article>
  `).join("");
}

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(item => item.classList.remove("active"));
    tab.classList.add("active");
    renderProducts(tab.dataset.category);
  });
});

renderProducts("solo");

const lightbox = document.createElement("div");
lightbox.className = "lightbox";
lightbox.innerHTML = '<button aria-label="Close">&times;</button><img alt="">';
document.body.appendChild(lightbox);
const lightboxImg = lightbox.querySelector("img");

grid.addEventListener("click", e => {
  const img = e.target.closest(".card-image")?.querySelector("img");
  if (!img) return;
  lightboxImg.src = img.src;
  lightboxImg.alt = img.alt;
  lightbox.classList.add("open");
});
lightbox.addEventListener("click", () => lightbox.classList.remove("open"));
document.addEventListener("keydown", e => { if (e.key === "Escape") lightbox.classList.remove("open"); });
