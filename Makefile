
test:
	@protoc test/test.proto -o test/test.desc
	@npm test

clean:
	@rm -f test/test.desc

.PHONY: test
