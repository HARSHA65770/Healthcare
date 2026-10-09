package com.healthcare.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    /**
     * Forwards Single Page Application client-side routes to index.html
     * while excluding /api/**, /ws/**, /h2-console/**, and static assets.
     */
    @RequestMapping(value = {
            "/",
            "/{path:^(?!api|ws|h2-console)[^\\.]*}"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
